import { supabase } from './supabase'

export type Plan = 'free' | 'basic' | 'pro' | 'premium'
export type SubscriptionStatus = 'active' | 'canceled' | 'expired' | 'trial'

export interface Subscription {
  id: string
  user_id: string
  plan: Plan
  status: SubscriptionStatus
  start_date: string
  end_date: string | null
  trial_ends_at: string | null
  created_at?: string
  updated_at?: string
}

export interface SubscriptionWithProfile extends Subscription {
  profile?: {
    name: string
    email: string
  }
}

export interface PlanLimits {
  maxWorkouts: number
  maxExercisesPerWorkout: number
  hasAnalytics: boolean
  hasFinance: boolean
  hasPresenceHistory: boolean
  hasCustomExercises: boolean
  hasExport: boolean
  maxStudents: number
  canCreateUnlimitedWorkouts: boolean
}

export const planLimits: Record<Plan, PlanLimits> = {
  free: {
    maxWorkouts: 1,
    maxExercisesPerWorkout: 5,
    hasAnalytics: false,
    hasFinance: false,
    hasPresenceHistory: false,
    hasCustomExercises: false,
    hasExport: false,
    maxStudents: 5,
    canCreateUnlimitedWorkouts: false,
  },
  basic: {
    maxWorkouts: 3,
    maxExercisesPerWorkout: 15,
    hasAnalytics: false,
    hasFinance: false,
    hasPresenceHistory: true,
    hasCustomExercises: true,
    hasExport: false,
    maxStudents: 10,
    canCreateUnlimitedWorkouts: false,
  },
  pro: {
    maxWorkouts: Infinity,
    maxExercisesPerWorkout: Infinity,
    hasAnalytics: false,
    hasFinance: false,
    hasPresenceHistory: true,
    hasCustomExercises: true,
    hasExport: false,
    maxStudents: 20,
    canCreateUnlimitedWorkouts: true,
  },
  premium: {
    maxWorkouts: Infinity,
    maxExercisesPerWorkout: Infinity,
    hasAnalytics: true,
    hasFinance: true,
    hasPresenceHistory: true,
    hasCustomExercises: true,
    hasExport: true,
    maxStudents: Infinity,
    canCreateUnlimitedWorkouts: true,
  },
}

export const getSubscription = async (userId: string): Promise<Subscription | null> => {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      console.warn('Subscription fetch error (non-critical):', error.message)
      return null
    }
    return data || null
  } catch {
    return null
  }
}

export const isPremium = async (userId: string): Promise<boolean> => {
  const sub = await getSubscription(userId)
  if (!sub) return false
  
  if (sub.status === 'active') {
    const p = sub.plan.toLowerCase()
    if (p.includes('premium') || p.includes('pro') || p.includes('basic')) return true
  }
  
  if (sub.status === 'trial' && sub.trial_ends_at) {
    return new Date(sub.trial_ends_at) > new Date()
  }
  
  return false
}

export const getPlan = async (userId: string): Promise<Plan> => {
  try {
    const sub = await getSubscription(userId)
    if (!sub) return 'free'
    
    if (sub.status === 'trial' && sub.trial_ends_at) {
      if (new Date(sub.trial_ends_at) > new Date()) return 'premium'
    }
    
    if (sub.status === 'active') {
      const p = sub.plan.toLowerCase()
      if (p.includes('premium')) return 'premium'
      if (p.includes('pro')) return 'pro'
      if (p.includes('basic') || p.includes('básico')) return 'basic'
      return sub.plan as Plan
    }
    
    return 'free'
  } catch {
    return 'free'
  }
}

export const subscribeToPlan = async (userId: string, plan: Plan): Promise<{ success: boolean; error?: string }> => {
  try {
    const existing = await getSubscription(userId)
    
    const now = new Date()
    const endDate = new Date(now)
    endDate.setMonth(endDate.getMonth() + 1)
    
    if (existing) {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          plan,
          status: 'active',
          start_date: now.toISOString(),
          end_date: endDate.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq('user_id', userId)

      if (error) throw error
    } else {
      const { error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan,
          status: 'active',
          start_date: now.toISOString(),
          end_date: endDate.toISOString(),
        })

      if (error) throw error
    }
    
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export const startTrial = async (userId: string, days: number = 7): Promise<{ success: boolean; error?: string }> => {
  try {
    const existing = await getSubscription(userId)
    const now = new Date()
    const trialEnds = new Date(now)
    trialEnds.setDate(trialEnds.getDate() + days)
    
    if (existing) {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'trial',
          trial_ends_at: trialEnds.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq('user_id', userId)

      if (error) throw error
    } else {
      const { error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan: 'free',
          status: 'trial',
          trial_ends_at: trialEnds.toISOString(),
        })

      if (error) throw error
    }
    
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export const cancelSubscription = async (userId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)

    if (error) throw error
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export const checkFeatureAccess = async (
  userId: string,
  feature: keyof PlanLimits
): Promise<{ allowed: boolean; limit?: number; current?: number }> => {
  const premium = await isPremium(userId)
  const limits = premium ? planLimits.premium : planLimits.free
  
  return {
    allowed: limits[feature] as boolean,
    limit: limits[feature] as number,
  }
}

export const getTrialDaysRemaining = (subscription: Subscription | null): number => {
  if (!subscription || subscription.status !== 'trial' || !subscription.trial_ends_at) return 0
  const remaining = new Date(subscription.trial_ends_at).getTime() - Date.now()
  return Math.max(0, Math.ceil(remaining / (1000 * 60 * 60 * 24)))
}
