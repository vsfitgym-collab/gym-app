import type { User, Session } from '@supabase/supabase-js'

export type UserRole = 'aluno' | 'personal'

export type Plan = 'free' | 'basic' | 'pro' | 'premium'

export interface UserPermissions {
  canCreateWorkout: boolean
  canEditWorkout: boolean
  canDeleteWorkout: boolean
  canViewAnalytics: boolean
  canManageExercises: boolean
  canManageStudents: boolean
  canViewFinance: boolean
  canManagePayments: boolean
  maxWorkouts: number
  maxExercises: number
}

export interface Profile {
  id: string
  name: string
  email?: string
  role: UserRole
  created_at?: string
}

export interface Workout {
  id: string
  name: string
  created_by?: string
  created_at?: string
}

export interface Exercise {
  id: string
  workout_id: string
  name: string
  muscle_group?: string
  created_at?: string
}

export interface WorkoutPlan {
  id: string
  workout_id: string
  exercise_id: string
  sets: number
  reps: string
  rest_seconds: number
  order_index: number
}

export interface WorkoutWithDetails extends Workout {
  exercises: (Exercise & { plan: WorkoutPlan })[]
}

export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
  read_at: string | null
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

export interface SubscriptionPlan {
  id: string
  name: string
  description?: string
  price: number
  duration_days: number
  features?: string[]
}

export type SubscriptionStatus = 'active' | 'ativa' | 'cancelled' | 'cancelada' | 'expired' | 'expirada' | 'trial' | 'pending' | 'pendente'

export interface Subscription {
  id: string
  user_id: string
  plan: Plan
  plan_id?: string
  status: SubscriptionStatus
  started_at?: string
  start_date?: string
  expires_at?: string
  end_date?: string | null
  trial_ends_at?: string | null
  created_at?: string
  updated_at?: string
}

export interface AuthContextType {
  user: User | null
  session: Session | null
  role: UserRole
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null; cleanMessage: string | null }>
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null; cleanMessage: string | null }>
  signOut: () => Promise<void>
}

export interface UserProfile {
  id: string
  role: UserRole
  plan: Plan
  name: string
  email?: string
}
