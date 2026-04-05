import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { getUserPlan, setupPlanRealtime, planLimits, type UserPlan, type Plan, type PlanLimits } from '../lib/planService'

interface UseUserPlanReturn {
  plan: Plan
  isPremium: boolean
  isBasic: boolean
  limits: PlanLimits
  loading: boolean
  expiresAt: string | null
  activatedAt: string | null
  refresh: () => Promise<void>
}

export function useUserPlan(): UseUserPlanReturn {
  const { user } = useAuth()
  const [userPlan, setUserPlan] = useState<UserPlan>({
    plan: 'free',
    isPremium: false,
    expiresAt: null,
    activatedAt: null,
  })
  const [loading, setLoading] = useState(true)
  const cleanupRef = useRef<(() => void) | null>(null)

  const loadPlan = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const plan = await getUserPlan(user.id)
      setUserPlan(plan)
    } catch (error) {
      console.error('Error loading user plan:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadPlan()
  }, [loadPlan])

  // Setup realtime listener for plan changes
  useEffect(() => {
    if (!user) return

    // Cleanup previous subscription
    if (cleanupRef.current) {
      cleanupRef.current()
    }

    const cleanup = setupPlanRealtime(user.id, (newPlan) => {
      setUserPlan(newPlan)
    })

    cleanupRef.current = cleanup

    return () => {
      cleanup()
    }
  }, [user])

  const limits = planLimits[userPlan.plan] || planLimits.free

  return {
    plan: userPlan.plan,
    isPremium: userPlan.isPremium,
    isBasic: userPlan.plan === 'basic',
    limits,
    loading,
    expiresAt: userPlan.expiresAt,
    activatedAt: userPlan.activatedAt,
    refresh: loadPlan,
  }
}
