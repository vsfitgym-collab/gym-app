import { supabase } from './supabase'

export type Plan = 'free' | 'basic' | 'premium'

export interface UserPlan {
  plan: Plan
  isPremium: boolean
  expiresAt: string | null
  activatedAt: string | null
}

export interface PlanLimits {
  maxWorkouts: number
  maxExercisesPerWorkout: number
  hasAnalytics: boolean
  hasFinance: boolean
  hasPresenceHistory: boolean
  hasCustomExercises: boolean
  hasExport: boolean
  maxStudents: number
  hasAdvancedExercises: boolean
  hasPrioritySupport: boolean
}

export const planLimits: Record<Plan, PlanLimits> = {
  free: {
    maxWorkouts: 1,
    maxExercisesPerWorkout: 5,
    hasAnalytics: false,
    hasFinance: false,
    hasPresenceHistory: false,
    hasCustomExercises: false,
    hasExport: false,
    maxStudents: 5,
    hasAdvancedExercises: false,
    hasPrioritySupport: false,
  },
  basic: {
    maxWorkouts: 5,
    maxExercisesPerWorkout: 15,
    hasAnalytics: true,
    hasFinance: false,
    hasPresenceHistory: true,
    hasCustomExercises: false,
    hasExport: false,
    maxStudents: 10,
    hasAdvancedExercises: false,
    hasPrioritySupport: false,
  },
  premium: {
    maxWorkouts: Infinity,
    maxExercisesPerWorkout: Infinity,
    hasAnalytics: true,
    hasFinance: true,
    hasPresenceHistory: true,
    hasCustomExercises: true,
    hasExport: true,
    maxStudents: Infinity,
    hasAdvancedExercises: true,
    hasPrioritySupport: true,
  },
}

export const getUserPlan = async (userId: string): Promise<UserPlan> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('plan, plan_expires_at, plan_activated_at')
      .eq('id', userId)
      .single()

    if (error) throw error

    // Check if plan has expired
    let plan = (data?.plan as Plan) || 'free'
    const expiresAt = data?.plan_expires_at || null
    const activatedAt = data?.plan_activated_at || null

    if (expiresAt && new Date(expiresAt) < new Date()) {
      plan = 'free'
      // Auto-downgrade in DB
      await supabase
        .from('profiles')
        .update({ plan: 'free', plan_expires_at: null })
        .eq('id', userId)
    }

    return {
      plan,
      isPremium: plan !== 'free',
      expiresAt,
      activatedAt,
    }
  } catch (error) {
    console.error('Error fetching user plan:', error)
    return { plan: 'free', isPremium: false, expiresAt: null, activatedAt: null }
  }
}

export const checkFeatureAccess = async (
  userId: string,
  feature: keyof PlanLimits
): Promise<{ allowed: boolean; currentPlan: Plan; limit?: number }> => {
  const userPlan = await getUserPlan(userId)
  const limits = planLimits[userPlan.plan]
  const value = limits[feature]

  if (typeof value === 'boolean') {
    return { allowed: value, currentPlan: userPlan.plan }
  }

  return { allowed: true, currentPlan: userPlan.plan, limit: value as number }
}

export const setupPlanRealtime = (
  userId: string,
  onPlanChange: (plan: UserPlan) => void
): (() => void) => {
  const channel = supabase
    .channel(`plan-changes-${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${userId}`,
      },
      async (payload) => {
        const newPlan = payload.new.plan as Plan
        const expiresAt = payload.new.plan_expires_at

        onPlanChange({
          plan: newPlan,
          isPremium: newPlan !== 'free',
          expiresAt,
          activatedAt: payload.new.plan_activated_at,
        })
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

export const canCreateWorkout = async (
  userId: string,
  currentWorkouts: number
): Promise<{ allowed: boolean; limit: number }> => {
  const { limit } = await checkFeatureAccess(userId, 'maxWorkouts')
  const maxWorkouts = limit || planLimits.free.maxWorkouts

  return {
    allowed: currentWorkouts < maxWorkouts,
    limit: maxWorkouts,
  }
}

export const canAddExercise = async (
  userId: string,
  currentExercises: number
): Promise<{ allowed: boolean; limit: number }> => {
  const { limit } = await checkFeatureAccess(userId, 'maxExercisesPerWorkout')
  const maxExercises = limit || planLimits.free.maxExercisesPerWorkout

  return {
    allowed: currentExercises < maxExercises,
    limit: maxExercises,
  }
}
