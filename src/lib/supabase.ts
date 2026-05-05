import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'supabase-auth',
    storage: typeof window !== 'undefined' ? localStorage : undefined,
  }
})

export type UserRole = 'student' | 'trainer'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  avatar_url?: string
  plan_type?: string
  created_at: string
}

export interface UserProfileExtended {
  id: string
  user_id: string
  objective?: string
  age?: number
  height?: number
  weight?: number
  level?: 'iniciante' | 'intermediario' | 'avancado'
  days_per_week?: number
  training_time?: number
  injuries?: string
  preferences?: string
  onboarding_completed?: boolean
  plan_type?: string
  created_at?: string
  updated_at?: string
}

export interface Workout {
  id: string
  trainer_id: string
  title: string
  description?: string
  duration_minutes: number
  difficulty: 'iniciante' | 'intermediario' | 'avancado'
  created_at: string
}

export interface WorkoutExercise {
  id: string
  workout_id: string
  exercise_id: string
  sets: number
  reps?: number
  duration_seconds?: number
  rest_seconds: number
  order_index: number
}

export interface Exercise {
  id: string
  name: string
  description?: string
  muscle_group: string
  equipment?: string
  image_url?: string
  video_url?: string
  created_at: string
}

export interface Subscription {
  id: string
  user_id: string
  plan: PlanKey
  status: 'active' | 'expired' | 'cancelled'
  start_date: string
  end_date?: string
  created_at: string
}

export interface Payment {
  id: string
  user_id: string
  amount: number
  status: 'pending' | 'completed' | 'failed'
  pix_key?: string
  pix_code?: string
  paid_at?: string
  created_at: string
}

export interface Achievement {
  id: string
  trainer_id: string
  title: string
  description?: string
  icon?: string
  created_at: string
}

export interface UserAchievement {
  id: string
  user_id: string
  achievement_id: string
  earned_at: string
}

export interface Chat {
  id: string
  participant_ids: string[]
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  chat_id: string
  sender_id: string
  content: string
  created_at: string
}

export interface WorkoutAssignment {
  id: string
  workout_id: string
  user_id: string
  assigned_by: string
  assigned_at: string
  status: 'pending' | 'in_progress' | 'completed'
  completed_at?: string
}

export type PlanKey = 'trial' | 'basic' | 'pro' | 'premium'

export type FeatureKey = 
  | 'workouts_limit'
  | 'chat_with_trainer'
  | 'progress_tracking'
  | 'analytics'
  | 'achievements'

export const PLAN_ORDER: Record<PlanKey, number> = {
  trial: 0,
  basic: 1,
  pro: 2,
  premium: 3
} as const

export const PLANS: Record<PlanKey, PlanConfig> = {
  trial: {
    name: 'Trial',
    key: 'trial',
    price: 0,
    duration: 7,
    description: 'Período de teste gratuito por 7 dias',
    features: ['Acesso total por 7 dias']
  },
  basic: {
    name: 'Básico',
    key: 'basic',
    price: 49.90,
    duration: 30,
    description: 'Plano básico com funcionalidades essenciais',
    features: [
      'Acompanhamento de progresso',
      '3 treinos por semana',
      'Catálogo de exercícios'
    ]
  },
  pro: {
    name: 'Pro',
    key: 'pro',
    price: 89.90,
    duration: 30,
    description: 'Plano profissional com recursos completos',
    features: [
      'Treinos ilimitados',
      'Chat com personal trainer',
      'Analytics básico'
    ]
  },
  premium: {
    name: 'Premium',
    key: 'premium',
    price: 149.90,
    duration: 30,
    description: 'Plano completo com tudo liberado',
    features: [
      'Tudo do Pro',
      'Analytics avançado',
      'Conquistas e premiações'
    ]
  }
}

export interface PlanConfig {
  key: PlanKey
  name: string
  price: number
  duration: number
  description: string
  features: string[]
}

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  workouts_limit: 'Treinos por Semana',
  chat_with_trainer: 'Chat com Personal',
  progress_tracking: 'Acompanhamento de Progresso',
  analytics: 'Analytics Avançado',
  achievements: 'Conquistas'
}

export const FEATURE_REQUIREMENTS: Record<FeatureKey, PlanKey> = {
  workouts_limit: 'basic',
  chat_with_trainer: 'pro',
  progress_tracking: 'premium',
  analytics: 'premium',
  achievements: 'premium'
}

export interface PlanFeatureRow {
  id: string
  plan_id: PlanKey
  feature_key: FeatureKey
  value_boolean: boolean | null
  value_number: number | null
  created_at: string
}

export interface SubscriptionWithDetails {
  id: string
  user_id: string
  plan_id: PlanKey
  status: 'active' | 'expired' | 'cancelled'
  start_date: string
  end_date?: string
  created_at: string
  plan?: PlanConfig
}

export interface PlanRow {
  id: string
  name: string
  price: number
  features: string
  duration_days: number
  is_trial?: boolean
  created_at?: string
}

export function parsePlanFeatures(features: string | string[] | undefined | null): string[] {
  if (!features) return []
  if (Array.isArray(features)) return features
  try {
    const parsed = JSON.parse(features)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function mapPlanNameToKey(planName: string): PlanKey {
  const normalized = planName.toLowerCase().trim()
  if (normalized === 'trial') return 'trial'
  if (normalized === 'basico' || normalized === 'básico') return 'basic'
  if (normalized === 'pro') return 'pro'
  if (normalized === 'premium') return 'premium'
  return 'trial'
}