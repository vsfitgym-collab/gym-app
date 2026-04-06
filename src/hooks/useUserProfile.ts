import { useAuth } from '../context/AuthContext'
import { useSubscription } from './useSubscription'
import type { UserRole, Plan } from '../types'

export interface UserProfile {
  role: UserRole
  plan: Plan
  isPersonal: boolean
  isAluno: boolean
  isPremium: boolean
  isBasic: boolean
  isFree: boolean
  loading: boolean
}

export function useUserProfile(): UserProfile {
  const { role, loading: authLoading } = useAuth()
  const { plan, isPremium, isBasic, loading: planLoading } = useSubscription()

  return {
    role,
    plan,
    isPersonal: role === 'personal',
    isAluno: role === 'aluno',
    isPremium,
    isBasic,
    isFree: plan === 'free',
    loading: authLoading || planLoading,
  }
}
