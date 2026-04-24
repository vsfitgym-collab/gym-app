import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'

export type PlanType = 'TRIAL' | 'FREE_LIMITED' | 'basic' | 'pro' | 'premium' | 'personal'

export interface UserPlan {
  plan: PlanType
  planName: string
  isTrial: boolean
  isExpired: boolean
  isActive: boolean
  trialEndsAt: Date | null
  planExpiresAt: Date | null
  trialDaysRemaining: number
  features: string[]
}

interface PlanContextType {
  userPlan: UserPlan | null
  loading: boolean
  error: Error | null
  canAccess: (feature: string) => boolean
  refreshPlan: () => Promise<void>
}

const PlanContext = createContext<PlanContextType | undefined>(undefined)

export function PlanProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadPlan = useCallback(async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) throw profileError

      const now = new Date()
      const trialEndsAt = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null
      const planExpiresAt = profile.plan_expires_at ? new Date(profile.plan_expires_at) : null

      const isTrialActive = trialEndsAt && trialEndsAt > now && profile.is_trial_active

      let plan: PlanType = 'FREE_LIMITED'
      let planName = 'Gratuito'
      let features: string[] = []

      if (profile.role === 'personal' || profile.role === 'admin') {
        plan = 'personal'
        planName = 'Personal Trainer'
        features = ['all']
      } else if (isTrialActive) {
        plan = 'TRIAL'
        planName = 'Teste Premium'
        features = ['all']
      } else if (planExpiresAt && planExpiresAt > now && profile.plan) {
        plan = profile.plan as PlanType
        planName = getPlanDisplayName(profile.plan)
        features = getFeatures(profile.plan)
      }

      const trialDaysRemaining = trialEndsAt
        ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
        : 0

      setUserPlan({
        plan,
        planName,
        isTrial: plan === 'TRIAL',
        isExpired: planExpiresAt ? planExpiresAt < now : false,
        isActive: plan === 'TRIAL' || (planExpiresAt ? planExpiresAt > now : false),
        trialEndsAt,
        planExpiresAt,
        trialDaysRemaining,
        features,
      })
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      console.error('PlanProvider error:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    loadPlan()
  }, [loadPlan])

  const canAccess = useCallback(
    (feature: string): boolean => {
      if (!userPlan) return false
      if (userPlan.plan === 'personal') return true
      if (userPlan.plan === 'TRIAL') return true
      if (userPlan.features.includes('all')) return true
      return userPlan.features.includes(feature)
    },
    [userPlan]
  )

  return (
    <PlanContext.Provider
      value={{
        userPlan,
        loading,
        error,
        canAccess,
        refreshPlan: loadPlan,
      }}
    >
      {children}
    </PlanContext.Provider>
  )
}

export function usePlan() {
  const context = useContext(PlanContext)
  if (!context) {
    throw new Error('usePlan must be used within PlanProvider')
  }
  return context
}

function getPlanDisplayName(plan: string): string {
  switch (plan) {
    case 'basic':
      return 'Plano Essencial'
    case 'pro':
      return 'Plano Personal'
    case 'premium':
      return 'Plano Elite'
    default:
      return 'Gratuito'
  }
}

function getFeatures(plan: string): string[] {
  switch (plan) {
    case 'basic':
      return ['workouts', 'library']
    case 'pro':
      return ['workouts', 'library', 'chat', 'custom_workout']
    case 'premium':
      return ['workouts', 'library', 'chat', 'custom_workout', 'priority']
    default:
      return []
  }
}

export const PLAN_FEATURES: Record<string, string[]> = {
  FREE_LIMITED: [],
  basic: ['workouts', 'library'],
  pro: ['workouts', 'library', 'chat', 'custom_workout'],
  premium: ['workouts', 'library', 'chat', 'custom_workout', 'priority'],
  PERSONAL: ['all'],
  TRIAL: ['all'],
}

export const PLAN_PRICES: Record<string, number> = {
  basic: 29.9,
  pro: 49.9,
  premium: 79.9,
}

export const PLAN_DESCRIPTIONS: Record<string, { title: string; subtitle: string; features: string[] }> = {
  TRIAL: {
    title: 'Teste Premium',
    subtitle: '7 dias de acesso completo',
    features: ['Todos os treinos', 'Chat com personal', 'Acompanhamento completo'],
  },
  basic: {
    title: 'Plano Essencial',
    subtitle: 'Ideal para treinar sozinho',
    features: ['Treinos prontos', 'Biblioteca de exercícios', 'Acesso básico'],
  },
  pro: {
    title: 'Plano Personal',
    subtitle: 'Treino 100% personalizado',
    features: ['Treino personalizado', 'Chat com personal', 'Ajustes contínuos'],
  },
  premium: {
    title: 'Plano Elite',
    subtitle: 'O mais completo',
    features: ['Tudo do Personal', 'Prioridade no atendimento', 'Ajustes mais frecuentes'],
  },
}