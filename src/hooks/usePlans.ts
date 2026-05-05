import { useState, useEffect } from 'react'
import { supabase, type PlanRow, parsePlanFeatures, mapPlanNameToKey, type PlanKey } from '@/lib/supabase'

export interface PlanFromDB extends Omit<PlanRow, 'features'> {
  features: string[]
  planKey: PlanKey
}

interface UsePlansResult {
  plans: PlanFromDB[]
  loading: boolean
  error: string | null
}

export function usePlans(): UsePlansResult {
  const [plans, setPlans] = useState<PlanFromDB[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('plans')
        .select('*')
        .order('price', { ascending: true })

      if (fetchError) {
        console.error('Error fetching plans:', fetchError)
        setError('Erro ao carregar planos')
        setPlans(getFallbackPlans())
        return
      }

      if (!data || data.length === 0) {
        console.warn('No plans found in database, using fallback')
        setPlans(getFallbackPlans())
        return
      }

      const mappedPlans: PlanFromDB[] = data.map((plan) => ({
        id: plan.id,
        name: plan.name,
        price: plan.price,
        duration_days: plan.duration_days,
        is_trial: plan.is_trial,
        features: parsePlanFeatures(plan.features),
        planKey: mapPlanNameToKey(plan.name),
      }))

      setPlans(mappedPlans)
    } catch (err) {
      console.error('Unexpected error fetching plans:', err)
      setError('Erro ao carregar planos')
      setPlans(getFallbackPlans())
    } finally {
      setLoading(false)
    }
  }

  return { plans, loading, error }
}

function getFallbackPlans(): PlanFromDB[] {
  return [
    {
      id: 'fallback-trial',
      name: 'Trial',
      price: 0,
      duration_days: 7,
      is_trial: true,
      features: ['Acesso total por 7 dias'],
      planKey: 'trial',
    },
    {
      id: 'fallback-basic',
      name: 'Básico',
      price: 49.9,
      duration_days: 30,
      features: ['Acompanhamento de progresso', '3 treinos por semana', 'Catálogo de exercícios'],
      planKey: 'basic',
    },
    {
      id: 'fallback-pro',
      name: 'Pro',
      price: 89.9,
      duration_days: 30,
      features: ['Treinos ilimitados', 'Chat com personal trainer', 'Analytics básico'],
      planKey: 'pro',
    },
    {
      id: 'fallback-premium',
      name: 'Premium',
      price: 149.9,
      duration_days: 30,
      features: ['Tudo do Pro', 'Analytics avançado', 'Conquistas e premiações'],
      planKey: 'premium',
    },
  ]
}

export function useCurrentPlan(userId: string | undefined) {
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!userId) return
    fetchCurrentPlan()
  }, [userId])

  const fetchCurrentPlan = async () => {
    try {
      setLoading(true)
      const { data } = await supabase
        .from('subscriptions')
        .select('plan')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (data) {
        setCurrentPlanId(data.plan)
      }
    } catch (err) {
      console.error('Error fetching current plan:', err)
    } finally {
      setLoading(false)
    }
  }

  return { currentPlanId, loading }
}