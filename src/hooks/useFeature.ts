import { useState, useEffect, useCallback } from 'react'
import { 
  hasFeature, 
  getFeatureNumber, 
  getWorkoutsLimit,
  checkWorkoutAccess,
  clearFeatureCache
} from '@/lib/services/featureAccess'
import { useAuthStore } from '@/stores/authStore'
import { type FeatureKey } from '@/lib/supabase'

interface UseFeatureReturn {
  value: boolean | number | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

interface UseBooleanFeatureReturn {
  hasAccess: boolean
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

interface UseWorkoutsLimitReturn {
  canWorkout: boolean
  remaining: number
  isUnlimited: boolean
  used: number
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useFeature(featureKey: FeatureKey): UseFeatureReturn {
  const [value, setValue] = useState<boolean | number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { user } = useAuthStore()

  const fetchFeature = useCallback(async () => {
    if (!user) {
      setValue(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      clearFeatureCache(user.id)
      const result = await (featureKey === 'workouts_limit' 
        ? getWorkoutsLimit(user.id)
        : featureKey === 'chat_with_trainer' || featureKey === 'progress_tracking' || featureKey === 'analytics' || featureKey === 'achievements'
          ? hasFeature(user.id, featureKey)
          : getFeatureNumber(user.id, featureKey)
      )
      setValue(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setLoading(false)
    }
  }, [user, featureKey])

  useEffect(() => {
    fetchFeature()
  }, [fetchFeature])

  return { value, loading, error, refetch: fetchFeature }
}

export function useBooleanFeature(featureKey: FeatureKey): UseBooleanFeatureReturn {
  const [hasAccess, setHasAccess] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { user } = useAuthStore()

  useEffect(() => {
    if (!user) {
      setHasAccess(false)
      setLoading(false)
      return
    }

    async function fetchAccess() {
      if (!user) return
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
    }

    fetchAccess()
  }, [user, featureKey])

  const refetch = useCallback(async () => {
    if (!user) return
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

  return { hasAccess, loading, error, refetch }
}

export function useWorkoutsLimit(): UseWorkoutsLimitReturn {
  const [state, setState] = useState({
    canWorkout: true,
    remaining: Infinity,
    isUnlimited: true,
    used: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { user } = useAuthStore()

  const checkAccess = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      clearFeatureCache(user.id)
      const result = await checkWorkoutAccess(user.id)
      setState(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    checkAccess()
  }, [checkAccess])

  return { ...state, loading, error, refetch: checkAccess }
}

export { clearFeatureCache }