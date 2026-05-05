import { useState, useEffect, useCallback } from 'react'
import { supabase, type Subscription, type PlanKey, type FeatureKey } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import {
  getUserSubscription,
  hasFeature,
  getFeatureNumber,
  isPlanActive,
  getUserPlanKey,
  checkWorkoutAccess,
  clearFeatureCache
} from '@/lib/services/featureAccess'

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { user } = useAuthStore()

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const sub = await getUserSubscription(user.id)
      setSubscription(sub)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchSubscription()
  }, [fetchSubscription])

  return { subscription, loading, error, refetch: fetchSubscription }
}

export function useUserPlan() {
  const [plan, setPlan] = useState<PlanKey | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { user } = useAuthStore()

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    async function fetchPlan() {
      if (!user) return
      try {
        setLoading(true)
        const planKey = await getUserPlanKey(user.id)
        setPlan(planKey)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setLoading(false)
      }
    }

    fetchPlan()
  }, [user])

  return { plan, loading, error }
}

export function useFeatureAccess(featureKey: FeatureKey) {
  const [hasAccess, setHasAccess] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { user } = useAuthStore()

  const checkAccess = useCallback(async () => {
    if (!user) {
      setHasAccess(false)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      clearFeatureCache(user.id)
      const result = await hasFeature(user.id, featureKey)
      setHasAccess(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setLoading(false)
    }
  }, [user, featureKey])

  useEffect(() => {
    checkAccess()
  }, [checkAccess])

  return { hasAccess, loading, error, refetch: checkAccess }
}

export function useWorkoutsLimitCheck() {
  const [canDoWorkout, setCanDoWorkout] = useState(true)
  const [remainingWorkouts, setRemainingWorkouts] = useState(Infinity)
  const [isUnlimited, setIsUnlimited] = useState(true)
  const [used, setUsed] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { user } = useAuthStore()

  const checkLimit = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      clearFeatureCache(user.id)
      const result = await checkWorkoutAccess(user.id)
      setCanDoWorkout(result.canWorkout)
      setRemainingWorkouts(result.remaining)
      setIsUnlimited(result.isUnlimited)
      setUsed(result.used)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    checkLimit()
  }, [checkLimit])

  return { 
    canDoWorkout, 
    remainingWorkouts, 
    isUnlimited,
    used,
    loading, 
    error, 
    refetch: checkLimit 
  }
}

export function useUserFeatures() {
  const [features, setFeatures] = useState<Map<FeatureKey, boolean | number | null>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { user } = useAuthStore()

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    async function fetchFeatures() {
      if (!user) return
      try {
        setLoading(true)
        clearFeatureCache(user.id)

        const featureKeys: FeatureKey[] = [
          'workouts_limit',
          'chat_with_trainer',
          'progress_tracking',
          'analytics',
          'achievements'
        ]

        const featureMap = new Map<FeatureKey, boolean | number | null>()

        for (const key of featureKeys) {
          if (key === 'workouts_limit') {
            const val = await getFeatureNumber(user.id, key)
            featureMap.set(key, val)
          } else {
            const val = await hasFeature(user.id, key)
            featureMap.set(key, val)
          }
        }

        setFeatures(featureMap)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setLoading(false)
      }
    }

    fetchFeatures()
  }, [user])

  return { features, loading, error }
}

export function useIsPlanActive() {
  const [isActive, setIsActive] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { user } = useAuthStore()

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    async function checkActive() {
      if (!user) return
      try {
        setLoading(true)
        const result = await isPlanActive(user.id)
        setIsActive(result)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setLoading(false)
      }
    }

    checkActive()
  }, [user])

  return { isActive, loading, error }
}