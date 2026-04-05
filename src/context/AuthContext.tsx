import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import type { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { AuthContextType, UserRole } from '../types'

const PERSONAL_EMAIL = 'vsfitgym@gmail.com'

function getRoleByEmail(email: string | undefined): UserRole {
  if (email?.toLowerCase() === PERSONAL_EMAIL.toLowerCase()) {
    return 'personal'
  }
  return 'aluno'
}

function getCleanErrorMessage(error: AuthError | Error | null): string {
  if (!error) return 'Erro desconhecido'
  const message = error.message || error.name || 'Erro desconhecido'
  
  if (message.includes('Invalid login credentials')) {
    return 'Email ou senha incorretos'
  }
  if (message.includes('Email not confirmed')) {
    return 'Confirme seu email antes de fazer login'
  }
  if (message.includes('User already registered')) {
    return 'Este email já está cadastrado'
  }
  if (message.includes('Password should be at least')) {
    return 'A senha deve ter pelo menos 6 caracteres'
  }
  if (message.includes('Too many requests')) {
    return 'Muitas tentativas. Tente novamente mais tarde'
  }
  
  return 'Erro ao processar solicitação'
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthState {
  user: User | null
  session: Session | null
  role: UserRole
  loading: boolean
  initialized: boolean
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    role: 'aluno',
    loading: true,
    initialized: false
  })
  
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const retryCountRef = useRef(0)
  const MAX_RETRY_COUNT = 3

  const clearRefreshTimeout = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
      refreshTimeoutRef.current = null
    }
  }, [])

  const scheduleSessionRefresh = useCallback((expiresAt: number | undefined) => {
    clearRefreshTimeout()
    
    if (!expiresAt) return
    
    const expiresIn = expiresAt * 1000 - Date.now()
    const refreshBuffer = 60 * 1000
    
    if (expiresIn > refreshBuffer) {
      refreshTimeoutRef.current = setTimeout(async () => {
        const { error } = await supabase.auth.refreshSession()
        if (error) {
          console.warn('Session refresh failed:', error.message)
        }
      }, expiresIn - refreshBuffer)
    }
  }, [clearRefreshTimeout])

  const createProfileIfNeeded = useCallback(async (user: User): Promise<boolean> => {
    try {
      const { data: existing, error: fetchError } = await supabase
        .from('profiles')
        .select('id, role, plan, plan_expires_at')
        .eq('id', user.id)
        .single()
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching profile:', fetchError)
        return false
      }
      
      if (!existing) {
        const name = user.email?.split('@')[0] || 'Usuario'
        const { error: insertError } = await supabase.from('profiles').insert({
          id: user.id,
          name,
          role: getRoleByEmail(user.email),
          plan: 'free',
          plan_expires_at: null
        })
        
        if (insertError) {
          console.error('Error creating profile:', insertError)
          return false
        }
      }
      
      return true
    } catch (error) {
      console.error('Profile creation error:', error)
      return false
    }
  }, [])

  const handleAuthError = useCallback((error: AuthError | Error | null) => {
    retryCountRef.current += 1
    
    if (retryCountRef.current >= MAX_RETRY_COUNT) {
      console.error('Max retry count reached, signing out')
      supabase.auth.signOut()
      setState({
        user: null,
        session: null,
        role: 'aluno',
        loading: false,
        initialized: true
      })
    }
    
    return getCleanErrorMessage(error)
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    retryCountRef.current = 0
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email)) {
      return { error: { message: 'Email inválido', name: 'ValidationError' } as AuthError, cleanMessage: 'Email inválido' }
    }
    
    if (!password || password.length < 6) {
      return { error: { message: 'Senha inválida', name: 'ValidationError' } as AuthError, cleanMessage: 'Senha inválida' }
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    
    if (error) {
      const cleanMessage = handleAuthError(error)
      return { error, cleanMessage }
    }
    
    if (data.session) {
      const profileOk = await createProfileIfNeeded(data.session.user)
      if (!profileOk) {
        return { error: { message: 'Erro ao criar perfil', name: 'ProfileError' } as AuthError, cleanMessage: 'Erro ao criar perfil' }
      }
      
      retryCountRef.current = 0
      scheduleSessionRefresh(data.session.expires_at)
    }
    
    return { error: null, cleanMessage: null }
  }, [createProfileIfNeeded, handleAuthError, scheduleSessionRefresh])

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    retryCountRef.current = 0
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email)) {
      return { error: { message: 'Email inválido', name: 'ValidationError' } as AuthError, cleanMessage: 'Email inválido' }
    }
    
    if (!password || password.length < 6) {
      return { error: { message: 'Senha deve ter pelo menos 6 caracteres', name: 'ValidationError' } as AuthError, cleanMessage: 'Senha deve ter pelo menos 6 caracteres' }
    }
    
    if (!name || name.trim().length < 2) {
      return { error: { message: 'Nome inválido', name: 'ValidationError' } as AuthError, cleanMessage: 'Nome deve ter pelo menos 2 caracteres' }
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { 
        data: { name: name.trim() },
        emailRedirectTo: `${window.location.origin}/`
      }
    })
    
    if (error) {
      const cleanMessage = handleAuthError(error)
      return { error, cleanMessage }
    }
    
    if (data.user) {
      await createProfileIfNeeded(data.user)
    }
    
    return { error: null, cleanMessage: null }
  }, [createProfileIfNeeded, handleAuthError])

  const signOut = useCallback(async () => {
    clearRefreshTimeout()
    retryCountRef.current = 0
    
    try {
      await supabase.auth.signOut()
    } finally {
      setState({
        user: null,
        session: null,
        role: 'aluno',
        loading: false,
        initialized: true
      })
    }
  }, [clearRefreshTimeout])

  useEffect(() => {
    let mounted = true

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (mounted && session) {
          setState({
            user: session.user,
            session,
            role: getRoleByEmail(session.user.email),
            loading: false,
            initialized: true
          })
          
          await createProfileIfNeeded(session.user)
          scheduleSessionRefresh(session.expires_at)
        } else if (mounted) {
          setState(prev => ({ ...prev, loading: false, initialized: true }))
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        if (mounted) {
          setState(prev => ({ ...prev, loading: false, initialized: true }))
        }
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      if (event === 'TOKEN_REFRESHED' && session) {
        scheduleSessionRefresh(session.expires_at)
      }

      if (event === 'SIGNED_IN' && session) {
        setState({
          user: session.user,
          session,
          role: getRoleByEmail(session.user.email),
          loading: false,
          initialized: true
        })
        await createProfileIfNeeded(session.user)
        scheduleSessionRefresh(session.expires_at)
        retryCountRef.current = 0
      }

      if (event === 'SIGNED_OUT') {
        clearRefreshTimeout()
        setState({
          user: null,
          session: null,
          role: 'aluno',
          loading: false,
          initialized: true
        })
      }

      if (event === 'USER_UPDATED' && session) {
        setState(prev => ({
          ...prev,
          user: session.user,
          session,
          role: getRoleByEmail(session.user.email)
        }))
      }
    })

    return () => {
      mounted = false
      clearRefreshTimeout()
      subscription.unsubscribe()
    }
  }, [createProfileIfNeeded, scheduleSessionRefresh, clearRefreshTimeout])

  const value: AuthContextType = {
    user: state.user,
    session: state.session,
    role: state.role,
    loading: state.loading,
    signIn,
    signUp,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export function useRequiredAuth() {
  const { user, loading } = useAuth()
  
  if (loading) {
    return { user: null, ready: false }
  }
  
  return { user, ready: true }
}
