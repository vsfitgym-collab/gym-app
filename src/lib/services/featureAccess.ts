import { supabase, type FeatureKey, type PlanKey, type PlanFeatureRow, type Subscription, PLAN_ORDER } from '../supabase'
import { PLANS } from '../supabase'

const featureCache = new Map<string, { data: unknown; timestamp: number }>()
const CACHE_TTL = 30 * 1000

function getCacheKey(userId: string, featureKey: string): string {
  return `${userId}:${featureKey}`
}

function getCached<T>(userId: string, featureKey: string): T | null {
  const cached = featureCache.get(getCacheKey(userId, featureKey))
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T
  }
  return null
}

function setCached<T>(userId: string, featureKey: string, data: T): void {
  featureCache.set(getCacheKey(userId, featureKey), { data, timestamp: Date.now() })
}

export function clearFeatureCache(userId?: string): void {
  if (userId) {
    featureCache.forEach((_, key) => {
      if (key.startsWith(`${userId}:`)) {
        featureCache.delete(key)
      }
    })
  } else {
    featureCache.clear()
  }
}

export async function getUserSubscription(userId: string): Promise<Subscription | null> {
  const cached = getCached<Subscription>(userId, '_subscription')
  if (cached) {
    return cached
  }

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    return null
  }

  const subscription = data as Subscription
  setCached(userId, '_subscription', subscription)
  return subscription
}

export function normalizePlanKey(plan: string): PlanKey {
  const normalized = plan.toLowerCase()
  if (normalized === 'trial') return 'trial'
  if (normalized === 'basico' || normalized === 'básico' || normalized === 'basic') return 'basic'
  if (normalized === 'pro') return 'pro'
  if (normalized === 'premium') return 'premium'
  return 'trial'
}

export async function getUserPlanKey(userId: string): Promise<PlanKey | null> {
  const subscription = await getUserSubscription(userId)
  if (!subscription?.plan) return null
  return normalizePlanKey(subscription.plan)
}

export async function isPlanActive(userId: string): Promise<boolean> {
  const subscription = await getUserSubscription(userId)
  if (!subscription) return false

  if (subscription.status !== 'active') return false

  if (subscription.end_date) {
    const endDate = new Date(subscription.end_date)
    if (endDate < new Date()) return false
  }

  return true
}

export async function getUserFeatureRow(
  userId: string,
  featureKey: FeatureKey
): Promise<PlanFeatureRow | null> {
  const plan = await getUserPlanKey(userId)
  if (!plan) {
    console.log('[featureAccess] No plan found for user:', userId)
    return null
  }

  console.log('[featureAccess] Looking for feature:', featureKey, 'plan:', plan)

  const { data, error } = await supabase
    .from('plan_features')
    .select('*')
    .eq('plan_id', plan)
    .eq('feature_key', featureKey)
    .single()

  if (error || !data) {
    console.log('[featureAccess] Feature not found:', featureKey, 'error:', error?.message)
    return null
  }
  
  console.log('[featureAccess] Found feature:', data)
  return data as PlanFeatureRow
}

export async function getFeatureBoolean(
  userId: string,
  featureKey: FeatureKey
): Promise<boolean> {
  const cached = getCached<boolean>(userId, `${featureKey}:boolean`)
  if (cached !== null) return cached

  const feature = await getUserFeatureRow(userId, featureKey)
  const result = feature?.value_boolean ?? false

  setCached(userId, `${featureKey}:boolean`, result)
  return result
}

export async function getFeatureNumber(
  userId: string,
  featureKey: FeatureKey
): Promise<number | null> {
  const cached = getCached<number | null>(userId, `${featureKey}:number`)
  if (cached !== undefined) return cached

  const feature = await getUserFeatureRow(userId, featureKey)
  const result = feature?.value_number ?? null

  setCached(userId, `${featureKey}:number`, result)
  return result
}

export async function getWorkoutsLimit(userId: string): Promise<number | null> {
  return getFeatureNumber(userId, 'workouts_limit')
}

export async function hasFeature(userId: string, featureKey: FeatureKey): Promise<boolean> {
  const plan = await getUserPlanKey(userId)
  const value = await getFeatureBoolean(userId, featureKey)
  
  if (value === true) return true
  if (plan && value === null) {
    const FEATURE_PLAN_REQUIREMENTS: Record<FeatureKey, PlanKey> = {
      workouts_limit: 'basic',
      chat_with_trainer: 'pro',
      progress_tracking: 'premium',
      analytics: 'premium',
      achievements: 'premium'
    }
    const requiredPlan = FEATURE_PLAN_REQUIREMENTS[featureKey]
    const userPlanOrder = PLAN_ORDER[plan]
    const requiredPlanOrder = PLAN_ORDER[requiredPlan]
    return userPlanOrder >= requiredPlanOrder
  }
  
  return false
}

export async function getFeatureValue(
  userId: string,
  featureKey: FeatureKey
): Promise<boolean | number | null> {
  const booleanVal = await getFeatureBoolean(userId, featureKey)
  if (booleanVal) return booleanVal

  const numberVal = await getFeatureNumber(userId, featureKey)
  return numberVal
}

export function canAccessFeature(userPlan: PlanKey, featureKey: FeatureKey): boolean {
  const requiredPlanOrder = PLAN_ORDER[featureKey === 'workouts_limit' ? 'basic' : featureKey === 'progress_tracking' ? 'basic' : featureKey === 'analytics' ? 'premium' : featureKey === 'achievements' ? 'premium' : 'pro']
  const userPlanOrder = PLAN_ORDER[userPlan]
  return userPlanOrder >= requiredPlanOrder
}

export async function checkWorkoutAccess(userId: string): Promise<{
  canWorkout: boolean
  remaining: number
  isUnlimited: boolean
  used: number
}> {
  const plan = await getUserPlanKey(userId)
  const limit = await getWorkoutsLimit(userId)

  const planConfig = plan ? PLANS[plan] : null
  const defaultLimit = planConfig ? (plan === 'premium' || plan === 'pro' ? null : 3) : 3

  if (limit === null) {
    if (defaultLimit === null) {
      return { canWorkout: true, remaining: Infinity, isUnlimited: true, used: 0 }
    }
    return { canWorkout: true, remaining: defaultLimit, isUnlimited: false, used: 0 }
  }

  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  weekStart.setHours(0, 0, 0, 0)

  const { count } = await supabase
    .from('workout_assignments')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'completed')
    .gte('completed_at', weekStart.toISOString())

  const used = count ?? 0
  const remaining = Math.max(0, limit - used)

  return {
    canWorkout: remaining > 0,
    remaining,
    isUnlimited: false,
    used
  }
}