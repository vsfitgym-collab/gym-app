import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { AuthContextType, UserRole } from '../types'

const PERSONAL_EMAIL = 'vsfitgym@gmail.com'

function getRoleByEmail(email: string | undefined): UserRole {
  if (email?.toLowerCase() === PERSONAL_EMAIL.toLowerCase()) {
    return 'personal'
  }
  return 'aluno'
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [role, setRole] = useState<UserRole>('aluno')
  const [loading, setLoading] = useState(true)

  const createProfileIfNeeded = useCallback(async (user: User) => {
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()
    
    if (!existing) {
      const name = user.email?.split('@')[0] || 'Usuario'
      await supabase.from('profiles').insert({
        id: user.id,
        name,
        role: getRoleByEmail(user.email)
      })
    }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setSession(data.session)
        setUser(data.session.user)
        setRole(getRoleByEmail(data.session.user.email))
        createProfileIfNeeded(data.session.user)
      }
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setSession(session)
        setUser(session.user)
        setRole(getRoleByEmail(session.user.email))
        createProfileIfNeeded(session.user)
      } else {
        setSession(null)
        setUser(null)
        setRole('aluno')
      }
    })

    return () => subscription.unsubscribe()
  }, [createProfileIfNeeded])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error) {
      setRole(getRoleByEmail(email))
    }
    return { error }
  }, [])

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } }
    })
    if (!error) {
      setRole(getRoleByEmail(email))
    }
    return { error }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  return (
    <AuthContext.Provider value={{ user, session, role, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
