import { supabase } from './supabase'
import type { Plan } from '../types'

export interface UserPlan {
  plan_name: string
  plan_display_name: string
  status: 'TRIAL' | 'ACTIVE' | 'FREE_LIMITED'
  features: {
    max_workouts: number
    max_exercises_per_workout: number
    can_receive_custom: boolean
    can_create_custom: boolean
    can_export: boolean
    chat_support: boolean
    analytics: boolean
    priority_support?: boolean
    custom_nutrition?: boolean
  }
  is_trial: boolean
  expires_at: string | null
}

export interface WorkoutLimit {
  can_create: boolean
  current_count: number
  max_allowed: number
  message: string
}

export interface ExerciseLimit {
  can_add: boolean
  current_count: number
  max_allowed: number
  message: string
}

class PlanService {
  async getUserActivePlan(userId: string): Promise<UserPlan | null> {
    try {
      const { data, error } = await supabase.rpc('get_user_active_plan', {
        p_user_id: userId
      })

      if (error) throw error
      if (!data || data.length === 0) return null

      return {
        plan_name: data[0].plan_name,
        plan_display_name: data[0].plan_display_name,
        status: data[0].status,
        features: data[0].features,
        is_trial: data[0].is_trial,
        expires_at: data[0].expires_at
      }
    } catch (err) {
      console.error('Error fetching user plan:', err)
      return null
    }
  }

  async checkUserAccess(userId: string, feature: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('check_user_access', {
        p_user_id: userId,
        p_feature: feature
      })

      if (error) throw error
      return data ?? false
    } catch (err) {
      console.error('Error checking user access:', err)
      return false
    }
  }

  async isPlanActive(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('is_plan_active', {
        p_user_id: userId
      })

      if (error) throw error
      return data ?? false
    } catch (err) {
      console.error('Error checking plan active:', err)
      return false
    }
  }

  async checkWorkoutLimit(userId: string): Promise<WorkoutLimit | null> {
    try {
      const { data, error } = await supabase.rpc('check_workout_limit', {
        p_user_id: userId
      })

      if (error) throw error
      if (!data || data.length === 0) return null

      return {
        can_create: data[0].can_create,
        current_count: data[0].current_count,
        max_allowed: data[0].max_allowed,
        message: data[0].message
      }
    } catch (err) {
      console.error('Error checking workout limit:', err)
      return null
    }
  }

  async checkExerciseLimit(userId: string, exerciseCount: number): Promise<ExerciseLimit | null> {
    try {
      const { data, error } = await supabase.rpc('check_exercise_limit', {
        p_user_id: userId,
        p_exercise_count: exerciseCount
      })

      if (error) throw error
      if (!data || data.length === 0) return null

      return {
        can_add: data[0].can_add,
        current_count: data[0].current_count,
        max_allowed: data[0].max_allowed,
        message: data[0].message
      }
    } catch (err) {
      console.error('Error checking exercise limit:', err)
      return null
    }
  }

  async duplicateTemplateToUser(
    templateId: string,
    userId: string,
    customName?: string
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('duplicate_template_to_user', {
        p_template_id: templateId,
        p_user_id: userId,
        p_custom_name: customName
      })

      if (error) throw error
      return data
    } catch (err) {
      console.error('Error duplicating template:', err)
      throw err
    }
  }

  async assignDefaultWorkout(userId: string, templateId?: string): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('assign_default_workout', {
        p_user_id: userId,
        p_template_id: templateId
      })

      if (error) throw error
      return data
    } catch (err) {
      console.error('Error assigning default workout:', err)
      throw err
    }
  }

  async isUserPersonal(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('is_user_personal', {
        p_user_id: userId
      })

      if (error) throw error
      return data ?? false
    } catch (err) {
      console.error('Error checking if user is personal:', err)
      return false
    }
  }

  async canPersonalAccessStudent(personalId: string, studentId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('can_personal_access_student', {
        p_personal_id: personalId,
        p_student_id: studentId
      })

      if (error) throw error
      return data ?? false
    } catch (err) {
      console.error('Error checking personal access:', err)
      return false
    }
  }

  async getPersonalStudents(personalId: string): Promise<Array<{
    student_id: string
    student_name: string
    student_email: string
    assigned_at: string
  }>> {
    try {
      const { data, error } = await supabase.rpc('get_personal_students', {
        p_personal_id: personalId
      })

      if (error) throw error
      return data ?? []
    } catch (err) {
      console.error('Error getting personal students:', err)
      return []
    }
  }

  isTrialAccess(plan: UserPlan | null): boolean {
    return plan?.status === 'TRIAL'
  }

  isPremiumAccess(plan: UserPlan | null): boolean {
    return plan?.status === 'ACTIVE' && 
           (plan.plan_name === 'premium' || plan.plan_name === 'pro')
  }

  hasFeature(plan: UserPlan | null, feature: keyof UserPlan['features']): boolean {
    if (!plan) return false
    if (plan.status === 'TRIAL') return true
    const value = plan.features[feature]
    if (typeof value === 'boolean') return value
    if (typeof value === 'number') return value > 0
    return false
  }

  isUnlimited(plan: UserPlan | null): boolean {
    if (!plan) return false
    return plan.features.max_workouts === -1
  }
}

export const planService = new PlanService()
export default planService
