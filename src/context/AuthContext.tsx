import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { AuthContextType, UserRole } from '../types'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [role, setRole] = useState<UserRole>('aluno')
  const [loading, setLoading] = useState(true)

  const fetchUserRole = useCallback(async (userId: string): Promise<UserRole> => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()

      if (!error && profile?.role) {
        return profile.role as UserRole
      }

      return 'aluno'
    } catch {
      return 'aluno'
    }
  }, [])

  const handleAuthChange = useCallback(async (newSession: Session | null) => {
    try {
      if (newSession) {
        setSession(newSession)
        setUser(newSession.user)

        const userRole = await fetchUserRole(newSession.user.id)
        setRole(userRole)
        
        try {
          await supabase.from('profiles').upsert({
            id: newSession.user.id,
            name: newSession.user.email?.split('@')[0] || 'Usuario'
          }, { onConflict: 'id' })
        } catch (e) {
          console.warn('Profile upsert error (non-critical):', e)
        }
      } else {
        setSession(null)
        setUser(null)
        setRole('aluno')
      }
    } finally {
      setLoading(false)
    }
  }, [fetchUserRole])

  useEffect(() => {
    const init = async () => {
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
    } catch (error) {
      console.error('Sign out error:', error)
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
