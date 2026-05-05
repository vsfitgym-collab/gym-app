export type PlanType = 'basic' | 'pro' | 'premium'

export interface PlanConfig {
  enabled: boolean
  limit: number | null
}

export interface FeaturePlanConfig {
  enabled: boolean
  limit?: number | null
}

export type PlanFeaturesConfig = Record<string, Record<PlanType, FeaturePlanConfig>>

export const planFeatures: PlanFeaturesConfig = {
  workouts_per_week: {
    basic: { enabled: true, limit: 3 },
    pro: { enabled: true, limit: null },
    premium: { enabled: true, limit: null }
  },
  chat_with_trainer: {
    basic: { enabled: true },
    pro: { enabled: true },
    premium: { enabled: true }
  },
  progress_tracking: {
    basic: { enabled: false },
    pro: { enabled: true },
    premium: { enabled: true }
  },
  analytics: {
    basic: { enabled: false },
    pro: { enabled: false },
    premium: { enabled: true }
  },
  achievements: {
    basic: { enabled: false },
    pro: { enabled: false },
    premium: { enabled: true }
  }
}

export const PLAN_REQUIREMENTS: Record<string, PlanType> = {
  workouts_per_week: 'basic',
  chat_with_trainer: 'basic',
  progress_tracking: 'pro',
  analytics: 'premium',
  achievements: 'premium'
}

export const FEATURE_TO_PLAN_MAP: Record<string, PlanType> = {
  workouts_per_week: 'basic',
  chat_with_trainer: 'basic',
  progress_tracking: 'pro',
  analytics: 'premium',
  achievements: 'premium'
}

export const FEATURE_LABELS: Record<string, string> = {
  workouts_per_week: 'Treinos por Semana',
  chat_with_trainer: 'Chat com Personal',
  progress_tracking: 'Acompanhamento de Progresso',
  analytics: 'Analytics Avançado',
  achievements: 'Conquistas'
}

export const FEATURE_DESCRIPTIONS: Record<string, string> = {
  workouts_per_week: 'Número de treinos permitidos por semana',
  chat_with_trainer: 'Comunicação direta com seu personal trainer',
  progress_tracking: 'Acompanhe sua evolução com dados reais',
  analytics: 'Métricas detalhadas e gráficos de evolução',
  achievements: 'Desbloqueie conquistas ao completar metas'
}

export function getRequiredPlanForFeature(feature: string): PlanType {
  return PLAN_REQUIREMENTS[feature] || 'premium'
}

export function canAccessFeature(feature: string, userPlan: PlanType): boolean {
  const featureConfig = planFeatures[feature]
  if (!featureConfig) return false
  return featureConfig[userPlan]?.enabled ?? false
}

export function getFeatureLimit(feature: string, userPlan: PlanType): number | null {
  const featureConfig = planFeatures[feature]
  if (!featureConfig) return null
  return featureConfig[userPlan]?.limit ?? null
}

export function isPlanSufficient(userPlan: PlanType, requiredPlan: PlanType): boolean {
  const planOrder: Record<PlanType, number> = {
    basic: 1,
    pro: 2,
    premium: 3
  }
  return planOrder[userPlan] >= planOrder[requiredPlan]
}
