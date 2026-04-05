import { supabase } from './supabase'

export interface WorkoutSession {
  id: string
  user_id: string
  workout_id: string
  status: 'in_progress' | 'completed' | 'abandoned'
  current_exercise_index: number
  current_set: number
  started_at: string
  completed_at: string | null
}

export interface CompletedSet {
  id?: string
  session_id: string
  exercise_id: string
  set_number: number
  reps_completed: number
  weight_kg?: number
}

export const createSession = async (
  userId: string,
  workoutId: string
): Promise<WorkoutSession | null> => {
  try {
    const { data, error } = await supabase
      .from('workout_sessions')
      .insert({
        user_id: userId,
        workout_id: workoutId,
        status: 'in_progress',
        current_exercise_index: 0,
        current_set: 1,
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Erro ao criar sessão:', error)
    return null
  }
}

export const updateSessionProgress = async (
  sessionId: string,
  exerciseIndex: number,
  setNumber: number
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('workout_sessions')
      .update({
        current_exercise_index: exerciseIndex,
        current_set: setNumber,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Erro ao atualizar progresso:', error)
    return false
  }
}

export const completeSession = async (sessionId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('workout_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Erro ao completar sessão:', error)
    return false
  }
}

export const abandonSession = async (sessionId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('workout_sessions')
      .update({
        status: 'abandoned',
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Erro ao abandonar sessão:', error)
    return false
  }
}

export const saveCompletedSet = async (set: CompletedSet): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('workout_sets')
      .insert({
        session_id: set.session_id,
        exercise_id: set.exercise_id,
        set_number: set.set_number,
        reps_completed: set.reps_completed,
        weight_kg: set.weight_kg,
      })

    if (error) throw error
    return true
  } catch (error) {
    console.error('Erro ao salvar série:', error)
    return false
  }
}

export const getActiveSession = async (
  userId: string,
  workoutId: string
): Promise<WorkoutSession | null> => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data, error } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('workout_id', workoutId)
      .eq('status', 'in_progress')
      .gte('started_at', today.toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  } catch (error) {
    console.error('Erro ao buscar sessão ativa:', error)
    return null
  }
}

export const getCompletedSets = async (sessionId: string): Promise<CompletedSet[]> => {
  try {
    const { data, error } = await supabase
      .from('workout_sets')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Erro ao buscar séries:', error)
    return []
  }
}
