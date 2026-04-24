import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { planService, type UserPlan, type WorkoutLimit, type ExerciseLimit } from '../lib/planService'

interface UsePlanReturn {
  plan: UserPlan | null
  loading: boolean
  error: Error | null
  isTrial: boolean
  isPremium: boolean
  isActive: boolean
  hasFeature: (feature: keyof UserPlan['features']) => boolean
  checkWorkoutLimit: () => Promise<WorkoutLimit | null>
  checkExerciseLimit: (exerciseCount: number) => Promise<ExerciseLimit | null>
  refresh: () => Promise<void>
}

export function usePlan(): UsePlanReturn {
  const { user, role } = useAuth()
  const [plan, setPlan] = useState<UserPlan | null>(null)
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
      if (role === 'personal') {
        setPlan({
          plan_name: 'personal',
          plan_display_name: 'Personal Trainer',
          status: 'ACTIVE',
          features: {
            max_workouts: -1,
            max_exercises_per_workout: -1,
            can_receive_custom: true,
            can_create_custom: true,
            can_export: true,
            chat_support: true,
            analytics: true,
            priority_support: true,
            custom_nutrition: true
          },
          is_trial: false,
          expires_at: null
        })
      } else {
        const userPlan = await planService.getUserActivePlan(user.id)
        setPlan(userPlan)
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      console.warn('usePlan error:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.id, role])

  useEffect(() => {
    loadPlan()
  }, [loadPlan])

  const checkWorkoutLimit = useCallback(async (): Promise<WorkoutLimit | null> => {
    if (!user?.id || role === 'personal') {
      return {
        can_create: true,
        current_count: 0,
        max_allowed: -1,
        message: 'Acesso ilimitado'
      }
    }
    return planService.checkWorkoutLimit(user.id)
  }, [user?.id, role])

  const checkExerciseLimit = useCallback(async (exerciseCount: number): Promise<ExerciseLimit | null> => {
    if (!user?.id || role === 'personal') {
      return {
        can_add: true,
        current_count: exerciseCount,
        max_allowed: -1,
        message: 'Ilimitado'
      }
    }
    return planService.checkExerciseLimit(user.id, exerciseCount)
  }, [user?.id, role])

  return {
    plan,
    loading,
    error,
    isTrial: planService.isTrialAccess(plan),
    isPremium: planService.isPremiumAccess(plan),
    isActive: plan?.status === 'TRIAL' || plan?.status === 'ACTIVE',
    hasFeature: (feature) => planService.hasFeature(plan, feature),
    checkWorkoutLimit,
    checkExerciseLimit,
    refresh: loadPlan
  }
}
