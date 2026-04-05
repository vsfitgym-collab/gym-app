import type { User, Session } from '@supabase/supabase-js'

export type UserRole = 'aluno' | 'personal'

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
}

export interface Plan {
  id: string
  name: string
  description?: string
  price: number
  duration_days: number
  features?: string[]
}

export interface Subscription {
  id: string
  user_id: string
  plan_id: string
  status: 'active' | 'cancelled' | 'expired'
  started_at: string
  expires_at?: string
}

export interface AuthContextType {
  user: User | null
  session: Session | null
  role: UserRole
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}
