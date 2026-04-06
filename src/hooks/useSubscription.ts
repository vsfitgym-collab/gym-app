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
  const [loading, setLoading] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      if (user) {
        const [sub, plan] = await Promise.all([
          getSubscription(user.id),
          getPlan(user.id),
        ])
        
        setSubscription(sub)
        setCurrentPlan(plan || 'free')
      }
    } catch (error) {
      console.warn('useSubscription error (non-critical):', error)
    } finally {
      setLoading(false)
    }
  }, [user])

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
