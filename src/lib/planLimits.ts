import { supabase } from './supabase'
import { planLimits } from './subscriptionService'
import type { Plan, PlanLimits } from '../types'

export const PLAN_LIMITS = {
  free: {
    workouts: 1,
    exercises: 5,
    students: 5,
  },
  basic: {
    workouts: 5,
    exercises: 15,
    students: 10,
  },
  premium: {
    workouts: Infinity,
    exercises: Infinity,
    students: Infinity,
  },
  pro: {
    workouts: Infinity,
    exercises: Infinity,
    students: 20,
  },
} as const

export type PlanType = keyof typeof PLAN_LIMITS

export interface LimitCheckResult {
  allowed: boolean
  current: number
  limit: number
  remaining: number
  upgradeMessage?: string
}

export interface PlanInfo {
  plan: Plan
  isPremium: boolean
  limits: PlanLimits
  canCreateWorkout: boolean
  canAddExercise: boolean
  canViewFinance: boolean
  canViewAnalytics: boolean
  canExport: boolean
}

export const checkWorkoutLimit = async (
  userId: string,
  currentWorkouts: number
): Promise<LimitCheckResult> => {
  const { plan, limits } = await getUserPlanInfo(userId)
  const limit = limits.maxWorkouts === Infinity ? Infinity : limits.maxWorkouts
  
  const remaining = limit === Infinity ? Infinity : limit - currentWorkouts
  const allowed = currentWorkouts < limit

  return {
    allowed,
    current: currentWorkouts,
    limit,
    remaining: remaining === Infinity ? -1 : remaining,
    upgradeMessage: !allowed 
      ? `Você atingiu o limite do plano ${plan === 'free' ? 'Free' : plan === 'basic' ? 'Básico' : 'Premium'} (${limit} treino${limit !== 1 ? 's' : ''}). Faça upgrade para criar mais treinos!`
      : undefined,
  }
}

export const checkExerciseLimit = async (
  userId: string,
  currentExercises: number
): Promise<LimitCheckResult> => {
  const { limits } = await getUserPlanInfo(userId)
  const limit = limits.maxExercisesPerWorkout === Infinity ? Infinity : limits.maxExercisesPerWorkout
  
  const remaining = limit === Infinity ? Infinity : limit - currentExercises
  const allowed = currentExercises < limit

  return {
    allowed,
    current: currentExercises,
    limit,
    remaining: remaining === Infinity ? -1 : remaining,
    upgradeMessage: !allowed
      ? `Limite de ${limit} exercícios por treino atingido. Faça upgrade para adicionar mais!`
      : undefined,
  }
}

export const getUserPlanInfo = async (userId: string): Promise<PlanInfo> => {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('plan, status')
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      return {
        plan: 'free',
        isPremium: false,
        limits: planLimits.free,
        canCreateWorkout: true,
        canAddExercise: true,
        canViewFinance: false,
        canViewAnalytics: false,
        canExport: false,
      }
    }

    const plan = data.plan as Plan
    const isActive = data.status === 'active'
    const isTrialing = data.status === 'trialing'
    const isPremium = (plan === 'basic' || plan === 'premium') && isActive
    const isTrialingPremium = plan === 'free' && isTrialing

    return {
      plan,
      isPremium: isPremium || isTrialingPremium,
      limits: planLimits[plan],
      canCreateWorkout: plan !== 'free' || isPremium || isTrialingPremium,
      canAddExercise: planLimits[plan].maxExercisesPerWorkout > 5,
      canViewFinance: plan === 'premium',
      canViewAnalytics: plan === 'premium' || plan === 'basic',
      canExport: plan === 'premium',
    }
  } catch {
    return {
      plan: 'free',
      isPremium: false,
      limits: planLimits.free,
      canCreateWorkout: true,
      canAddExercise: true,
      canViewFinance: false,
      canViewAnalytics: false,
      canExport: false,
    }
  }
}

export const showLimitToast = (message: string) => {
  const toast = document.createElement('div')
  toast.className = 'limit-toast'
  toast.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
    <span>${message}</span>
  `
  document.body.appendChild(toast)
  
  requestAnimationFrame(() => {
    toast.classList.add('show')
  })

  setTimeout(() => {
    toast.classList.remove('show')
    setTimeout(() => toast.remove(), 300)
  }, 4000)
}

export const canUserAccessFeature = async (
  userId: string,
  feature: 'workout' | 'exercise' | 'finance' | 'analytics' | 'export'
): Promise<boolean> => {
  const info = await getUserPlanInfo(userId)
  
  switch (feature) {
    case 'workout':
      return info.canCreateWorkout
    case 'exercise':
      return info.canAddExercise
    case 'finance':
      return info.canViewFinance
    case 'analytics':
      return info.canViewAnalytics
    case 'export':
      return info.canExport
    default:
      return false
  }
}

export const getUpgradeBenefits = (plan: Plan): string[] => {
  switch (plan) {
    case 'free':
      return [
        '✓ Treinos ilimitados',
        '✓ Analytics completo',
        '✓ Controle financeiro',
        '✓ Histórico detalhado',
        '✓ Exercícios avançados',
        '✓ Exportação de dados',
        '✓ Suporte prioritário',
      ]
    case 'basic':
      return [
        '✓ Controle financeiro',
        '✓ Histórico completo',
        '✓ Exercícios avançados',
        '✓ Exportação de dados',
        '✓ Suporte prioritário',
      ]
    default:
      return []
  }
}

export const formatLimitMessage = (
  current: number,
  limit: number,
  resource: string
): string => {
  if (limit === Infinity) {
    return `${resource}: ${current} (ilimitado)`
  }
  return `${resource}: ${current}/${limit}`
}
