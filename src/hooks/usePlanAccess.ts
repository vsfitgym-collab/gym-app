import { useMemo, useCallback, useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { 
  type PlanType,
  planFeatures,
  canAccessFeature as configCanAccessFeature,
  getFeatureLimit as configGetFeatureLimit,
  FEATURE_LABELS,
  FEATURE_DESCRIPTIONS,
  FEATURE_TO_PLAN_MAP
} from '@/config/planFeatures'

export interface PlanAccessReturn {
  plan: PlanType
  canAccess: (feature: string) => boolean
  getLimit: (feature: string) => number | null
  isPremium: () => boolean
  isPro: () => boolean
  isBasic: () => boolean
  getFeatureLabel: (feature: string) => string
  getFeatureDescription: (feature: string) => string
  getRequiredPlan: (feature: string) => PlanType
}

export function usePlanAccess(): PlanAccessReturn {
  const { user, profileExtended } = useAuthStore()
  const [dbPlan, setDbPlan] = useState<PlanType | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function fetchPlan() {
      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        const { data: subscription, error } = await supabase
          .from('subscriptions')
          .select('plan')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        
        if (!error && subscription?.plan && mounted) {
          setDbPlan(subscription.plan.toLowerCase() as PlanType)
        }
      } catch (e) {
        console.log('[usePlanAccess] No subscription found')
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchPlan()

    return () => {
      mounted = false
    }
  }, [user?.id])
  
  const plan: PlanType = useMemo(() => {
    if (loading) {
      return 'basic'
    }

    const profilePlanType = user?.plan_type?.toLowerCase() || ''
    const extendedPlanType = profileExtended?.plan_type?.toLowerCase() || ''
    
    const planType = dbPlan || profilePlanType || extendedPlanType || 'basic'
    
    if (planType === 'premium') return 'premium'
    if (planType === 'pro') return 'pro'
    if (planType === 'basic') return 'basic'
    
    return 'basic'
  }, [user?.plan_type, profileExtended?.plan_type, dbPlan, loading])

  const canAccess = useCallback((feature: string): boolean => {
    return configCanAccessFeature(feature, plan)
  }, [plan])

  const getLimit = useCallback((feature: string): number | null => {
    return configGetFeatureLimit(feature, plan)
  }, [plan])

  const isPremium = useCallback((): boolean => {
    return plan === 'premium'
  }, [plan])

  const isPro = useCallback((): boolean => {
    return plan === 'pro' || plan === 'premium'
  }, [plan])

  const isBasic = useCallback((): boolean => {
    return plan === 'basic'
  }, [plan])

  const getFeatureLabel = useCallback((feature: string): string => {
    return FEATURE_LABELS[feature] || feature
  }, [])

  const getFeatureDescription = useCallback((feature: string): string => {
    return FEATURE_DESCRIPTIONS[feature] || ''
  }, [])

  const getRequiredPlan = useCallback((feature: string): PlanType => {
    return FEATURE_TO_PLAN_MAP[feature] || 'premium'
  }, [])

  return {
    plan,
    canAccess,
    getLimit,
    isPremium,
    isPro,
    isBasic,
    getFeatureLabel,
    getFeatureDescription,
    getRequiredPlan
  }
}