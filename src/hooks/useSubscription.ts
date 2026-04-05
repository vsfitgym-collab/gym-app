import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  getSubscription,
  isPremium,
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
  const [premium, setPremium] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }
    
    setLoading(true)
    try {
      const [sub, isPrem, currentPlan] = await Promise.all([
        getSubscription(user.id),
        isPremium(user.id),
        getPlan(user.id),
      ])
      
      setSubscription(sub)
      setPremium(isPrem)
      setCurrentPlan(currentPlan)
    } catch (error) {
      console.error('Erro ao carregar assinatura:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  const [currentPlan, setCurrentPlan] = useState<Plan>('free')

  useEffect(() => {
    loadData()
  }, [loadData])

  const limits = premium ? planLimits.premium : planLimits.free
  const trialDaysRemaining = getTrialDaysRemaining(subscription)

  return {
    subscription,
    plan: currentPlan,
    isPremium: premium,
    limits,
    loading,
    trialDaysRemaining,
    refresh: loadData,
  }
}
