import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  getSubscription,
  getPlan,
  planLimits,
  type Subscription,
  type Plan,
  type PlanLimits,
  getTrialDaysRemaining,
} from '../lib/subscriptionService'

interface UseSubscriptionReturn {
  subscription: Subscription | null
  plan: Plan
  isPremium: boolean
  isBasic: boolean
  limits: PlanLimits
  loading: boolean
  trialDaysRemaining: number
  status: Subscription['status']
  refresh: () => Promise<void>
}

export function useSubscription(): UseSubscriptionReturn {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [currentPlan, setCurrentPlan] = useState<Plan>('free')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const userId = user?.id ?? null

  const loadData = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const [sub, plan] = await Promise.all([
        getSubscription(userId),
        getPlan(userId),
      ])
      
      setSubscription(sub)
      setCurrentPlan(plan || 'free')
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      console.warn('useSubscription error (non-critical):', error)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const isPremium = currentPlan !== 'free'
  const isBasic = currentPlan === 'basic'
  const limits = planLimits[currentPlan] || planLimits.free
  const trialDaysRemaining = getTrialDaysRemaining(subscription)

  return {
    subscription,
    plan: currentPlan,
    isPremium,
    isBasic,
    limits,
    loading,
    trialDaysRemaining,
    status: subscription?.status || 'active',
    refresh: loadData,
  }
}
