import { type FeatureKey, type PlanKey, PLANS, FEATURE_LABELS, FEATURE_REQUIREMENTS, PLAN_ORDER } from './supabase'

export { PLANS, FEATURE_LABELS, FEATURE_REQUIREMENTS, PLAN_ORDER }

export interface FeatureConfig {
  label: string
  description: string
  type: 'boolean' | 'number'
  requiredPlan: PlanKey
}

export const FEATURE_CONFIG: Record<FeatureKey, FeatureConfig> = {
  workouts_limit: {
    label: 'Treinos por Semana',
    description: 'Número de treinos permitidos por semana',
    type: 'number',
    requiredPlan: 'basic'
  },
  chat_with_trainer: {
    label: 'Chat com Personal',
    description: 'Comunicação direta com seu personal trainer',
    type: 'boolean',
    requiredPlan: 'pro'
  },
  progress_tracking: {
    label: 'Acompanhamento de Progresso',
    description: 'Acompanhe sua evolução com dados reais',
    type: 'boolean',
    requiredPlan: 'premium'
  },
  analytics: {
    label: 'Analytics Avançado',
    description: 'Métricas detalhadas e gráficos de evolução',
    type: 'boolean',
    requiredPlan: 'premium'
  },
  achievements: {
    label: 'Conquistas',
    description: 'Desbloqueie conquistas ao completar metas',
    type: 'boolean',
    requiredPlan: 'premium'
  }
}

export function getRequiredPlanForFeature(feature: FeatureKey): PlanKey {
  return FEATURE_CONFIG[feature].requiredPlan
}

export function getFeatureLabel(feature: FeatureKey): string {
  return FEATURE_CONFIG[feature].label
}

export function getFeatureType(feature: FeatureKey): 'boolean' | 'number' {
  return FEATURE_CONFIG[feature].type
}

export function isBooleanFeature(feature: FeatureKey): boolean {
  return FEATURE_CONFIG[feature].type === 'boolean'
}

export function isNumberFeature(feature: FeatureKey): boolean {
  return FEATURE_CONFIG[feature].type === 'number'
}

export function canAccessFeatureFromPlan(feature: FeatureKey, userPlan: PlanKey): boolean {
  const requiredPlan = FEATURE_CONFIG[feature].requiredPlan
  const userPlanOrder = PLAN_ORDER[userPlan]
  const requiredPlanOrder = PLAN_ORDER[requiredPlan]
  return userPlanOrder >= requiredPlanOrder
}

export function getFeatureValueFromPlan(
  feature: FeatureKey,
  plan: PlanKey,
  featureRow: { value_boolean: boolean | null; value_number: number | null }
): boolean | number | null {
  if (FEATURE_CONFIG[feature].type === 'boolean') {
    return featureRow.value_boolean ?? false
  }
  return featureRow.value_number
}

export const FEATURE_TO_PLAN_MAP: Partial<Record<FeatureKey, PlanKey>> = {
  workouts_limit: 'basic',
  chat_with_trainer: 'pro',
  progress_tracking: 'basic',
  analytics: 'premium',
  achievements: 'premium'
}