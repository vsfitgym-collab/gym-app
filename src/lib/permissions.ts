/**
 * PLAN_PERMISSIONS — Single Source of Truth
 * Controls all feature access across the entire VSFitness app.
 */

export const PLAN_PERMISSIONS = {
  free: {
    workouts: 'limited' as const,
    maxWorkouts: 3,
    exercises: 'basic' as const,
    analytics: false,
    vipChat: false,
    finance: false,
    customTraining: false,
    requiresProfile: false,
    gamification: false,
    prioritySupport: false,
    attendanceHistory: false,
    personalizedExercises: false,
  },
  basic: {
    workouts: true as const,
    exercises: true as const,
    analytics: false,
    vipChat: false,
    finance: false,
    customTraining: true,
    requiresProfile: true,
    gamification: true,
    prioritySupport: false,
    attendanceHistory: false,
    personalizedExercises: false,
  },
  pro: {
    workouts: true as const,
    exercises: true as const,
    analytics: true,
    vipChat: true,
    finance: false,
    customTraining: true,
    requiresProfile: true,
    gamification: true,
    prioritySupport: false,
    attendanceHistory: false,
    personalizedExercises: false,
  },
  premium: {
    workouts: true as const,
    exercises: true as const,
    analytics: true,
    vipChat: true,
    finance: true,
    customTraining: true,
    requiresProfile: true,
    gamification: true,
    prioritySupport: true,
    attendanceHistory: true,
    personalizedExercises: true,
  },
} as const

export type PlanKey = keyof typeof PLAN_PERMISSIONS
export type FeatureKey = keyof typeof PLAN_PERMISSIONS['premium']

/**
 * Normalizes legacy plan name strings from the database to canonical keys.
 * Examples: "Plano Pro" → "pro", "Essencial" → "basic", "Elite" → "premium"
 */
export function normalizePlanKey(raw: string | null | undefined): PlanKey {
  if (!raw) return 'free'

  const lower = raw.toLowerCase().trim()

  // Direct match
  if (lower in PLAN_PERMISSIONS) return lower as PlanKey

  // Legacy name mapping
  if (lower.includes('essencial') || lower.includes('básico') || lower.includes('basico') || lower === 'basic') return 'basic'
  if (lower.includes('personal') || lower.includes('pro')) return 'pro'
  if (lower.includes('elite') || lower.includes('premium')) return 'premium'
  if (lower.includes('free') || lower.includes('gratuito') || lower.includes('grátis')) return 'free'

  console.warn(`[permissions] Unknown plan key: "${raw}", defaulting to free`)
  return 'free'
}

/**
 * Check if a plan grants access to a specific feature.
 * Personal trainers always have full access (handled at component level).
 */
export function hasAccess(plan: string, feature: FeatureKey): boolean {
  const key = normalizePlanKey(plan)
  const value = PLAN_PERMISSIONS[key]?.[feature]

  // "limited" and "basic" count as truthy for basic access checks
  if (value === 'limited' || value === 'basic') return true
  return value === true
}

/**
 * Check if a FREE user can still use workouts (max 3 active).
 */
export function canUseWorkout(plan: string, currentCount: number): boolean {
  const key = normalizePlanKey(plan)
  if (key === 'free') {
    return currentCount < PLAN_PERMISSIONS.free.maxWorkouts
  }
  return true
}

/**
 * Check if a plan requires a student profile (ficha técnica) before training.
 */
export function requiresStudentProfile(plan: string): boolean {
  const key = normalizePlanKey(plan)
  return PLAN_PERMISSIONS[key]?.requiresProfile === true
}

/**
 * Check if a plan grants access to custom/personalized training.
 */
export function hasCustomTraining(plan: string): boolean {
  const key = normalizePlanKey(plan)
  return PLAN_PERMISSIONS[key]?.customTraining === true
}

/**
 * Returns the workout system type for a given plan.
 */
export function getWorkoutSystem(plan: string): 'free' | 'custom' {
  const key = normalizePlanKey(plan)
  return PLAN_PERMISSIONS[key]?.customTraining ? 'custom' : 'free'
}
