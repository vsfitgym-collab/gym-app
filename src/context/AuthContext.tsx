import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { AuthContextType, UserRole } from '../types'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [role, setRole] = useState<UserRole>('aluno')
  const [loading, setLoading] = useState(true)

  const getRoleByEmail = (email: string | undefined): UserRole => {
    return email?.toLowerCase() === 'vsfitgym@gmail.com' ? 'personal' : 'aluno'
  }

  const fetchUserRole = useCallback(async (userId: string, email?: string): Promise<UserRole> => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()

      if (profile?.role === 'personal' || profile?.role === 'aluno') {
        return profile.role
      }

      return getRoleByEmail(email)
    } catch {
      return getRoleByEmail(email)
    }
  }, [])

  const handleAuthChange = useCallback(async (newSession: Session | null) => {
    if (newSession) {
      setSession(newSession)
      setUser(newSession.user)

      const userRole = await fetchUserRole(newSession.user.id, newSession.user.email)
      setRole(userRole)
      
      try {
        await supabase.from('profiles').upsert({
          id: newSession.user.id,
          name: newSession.user.email?.split('@')[0] || 'Usuario',
          role: userRole
        }, { onConflict: 'id' })
      } catch (e) {
        console.warn('Profile upsert error (non-critical):', e)
      }
    } else {
      setSession(null)
      setUser(null)
      setRole('aluno')
    }
    setLoading(false)
  }, [fetchUserRole])

  useEffect(() => {
    const init = async () => {
      console.log('AuthContext: Initializing...')
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          await handleAuthChange(session)
        } else {
          setLoading(false)
        }
      } catch (error) {
        console.error('Auth init error:', error)
        setLoading(false)
      }
    }

    const timeoutId = setTimeout(() => {
      console.log('AuthContext: Timeout reached, forcing loading=false')
      setLoading(false)
    }, 8000)

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleAuthChange(session)
    })

    return () => {
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      return { error: null as Error | null, cleanMessage: null as string | null }
    } catch (err: any) {
      return { error: err, cleanMessage: err.message }
    }
  }

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: { data: { name } }
      })
      if (error) throw error
      return { error: null as Error | null, cleanMessage: null as string | null }
    } catch (err: any) {
      return { error: err, cleanMessage: err.message }
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setSession(null)
      setRole('aluno')
      window.location.href = '/login'
    } catch (error) {
      console.error('Sign out error:', error)
      window.location.href = '/login'
    }
  }

  const value: AuthContextType = {
    user,
    session,
    role,
    loading,
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
