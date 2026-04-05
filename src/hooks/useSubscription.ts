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
  limits: PlanLimits
  loading: boolean
  trialDaysRemaining: number
  refresh: () => Promise<void>
}

export function useSubscription(): UseSubscriptionReturn {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [currentPlan, setCurrentPlan] = useState<Plan>('free')
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }
    
    setLoading(true)
    try {
      const [sub, plan] = await Promise.all([
        getSubscription(user.id),
        getPlan(user.id),
      ])
      
      setSubscription(sub)
      setCurrentPlan(plan)
    } catch (error) {
      console.error('Erro ao carregar assinatura:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadData()
  }, [loadData])

  const isSubscribed = currentPlan !== 'free'
  const limits = planLimits[currentPlan] || planLimits.free
  const trialDaysRemaining = getTrialDaysRemaining(subscription)

  return {
    subscription,
    plan: currentPlan,
    isPremium: isSubscribed,
    limits,
    loading,
    trialDaysRemaining,
    refresh: loadData,
  }
}
