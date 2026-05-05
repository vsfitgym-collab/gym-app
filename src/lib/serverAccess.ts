import { supabase } from '@/lib/supabase'
import { canAccessFeature, getFeatureLimit, type PlanType } from '@/config/planFeatures'
import { PLAN_ORDER } from '@/lib/supabase'

export interface AccessCheckResult {
  allowed: boolean
  reason?: string
  remaining?: number
}

export async function checkFeatureAccess(
  userId: string,
  feature: string
): Promise<AccessCheckResult> {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('plan_type')
      .eq('id', userId)
      .single()

    if (error || !profile) {
      return { allowed: false, reason: 'Usuário não encontrado' }
    }

    const plan = (profile.plan_type?.toLowerCase() || 'basic') as PlanType
    const hasAccess = canAccessFeature(feature, plan)

    if (!hasAccess) {
      return { allowed: false, reason: `Plano ${plan} não permite acesso a ${feature}` }
    }

    return { allowed: true }
  } catch (error) {
    console.error('[checkFeatureAccess] Error:', error)
    return { allowed: false, reason: 'Erro ao verificar acesso' }
  }
}

export async function checkWorkoutLimit(userId: string): Promise<AccessCheckResult> {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('plan_type')
      .eq('id', userId)
      .single()

    if (error || !profile) {
      return { allowed: false, reason: 'Usuário não encontrado' }
    }

    const plan = (profile.plan_type?.toLowerCase() || 'basic') as PlanType
    const limit = getFeatureLimit('workouts_per_week', plan)

    if (limit === null) {
      return { allowed: true }
    }

    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    weekStart.setHours(0, 0, 0, 0)

    const { count, error: countError } = await supabase
      .from('workout_assignments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('completed_at', weekStart.toISOString())

    if (countError) {
      console.error('[checkWorkoutLimit] Count error:', countError)
      return { allowed: false, reason: 'Erro ao verificar limite' }
    }

    const used = count ?? 0
    const remaining = limit - used

    if (remaining <= 0) {
      return { 
        allowed: false, 
        reason: `Você atingiu o limite de ${limit} treinos por semana. Faça upgrade para continuar.`,
        remaining: 0
      }
    }

    return { allowed: true, remaining }
  } catch (error) {
    console.error('[checkWorkoutLimit] Error:', error)
    return { allowed: false, reason: 'Erro ao verificar limite' }
  }
}

export function validatePlanAccess(userPlan: string, requiredFeaturePlan: string): boolean {
  const userPlanOrder = PLAN_ORDER[userPlan as keyof typeof PLAN_ORDER] || 0
  const requiredPlanOrder = PLAN_ORDER[requiredFeaturePlan as keyof typeof PLAN_ORDER] || 3
  return userPlanOrder >= requiredPlanOrder
}