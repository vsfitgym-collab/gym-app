import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export interface StudentProfile {
  id: string
  user_id: string
  nome: string
  idade: number
  altura: number
  peso: number
  objetivo: string
  nivel_experiencia: 'iniciante' | 'intermediario' | 'avancado'
  lesoes: string
  limitacoes: string
  observacoes: string
  status: 'awaiting_program' | 'program_assigned' | 'active'
  created_at: string
  updated_at: string
}

export interface StudentProfileInput {
  nome: string
  idade: number
  altura: number
  peso: number
  objetivo: string
  nivel_experiencia: 'iniciante' | 'intermediario' | 'avancado'
  lesoes?: string
  limitacoes?: string
  observacoes?: string
}

export function useStudentProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error: fetchErr } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (fetchErr) throw fetchErr
      setProfile(data)
    } catch (err: any) {
      console.error('[useStudentProfile] Error fetching:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const saveProfile = async (input: StudentProfileInput): Promise<boolean> => {
    if (!user?.id) return false

    setSaving(true)
    setError(null)

    try {
      if (profile) {
        // Update existing
        const { error: updateErr } = await supabase
          .from('student_profiles')
          .update({
            ...input,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id)

        if (updateErr) throw updateErr
      } else {
        // Insert new
        const { error: insertErr } = await supabase
          .from('student_profiles')
          .insert({
            user_id: user.id,
            ...input,
            status: 'awaiting_program',
          })

        if (insertErr) throw insertErr
      }

      await fetchProfile()
      return true
    } catch (err: any) {
      console.error('[useStudentProfile] Error saving:', err)
      setError(err.message)
      return false
    } finally {
      setSaving(false)
    }
  }

  return {
    profile,
    loading,
    saving,
    error,
    saveProfile,
    refreshProfile: fetchProfile,
    hasProfile: !!profile,
    isAwaitingProgram: profile?.status === 'awaiting_program',
    isProgramAssigned: profile?.status === 'program_assigned' || profile?.status === 'active',
  }
}
