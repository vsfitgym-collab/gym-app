import { supabase } from './supabase'

export interface WorkoutPresence {
  id: string
  user_id: string
  workout_id: string
  date: string
  created_at: string
}

export interface PresenceStats {
  todayPresent: boolean
  weekCount: number
  monthCount: number
  currentStreak: number
  longestStreak: number
  weeklyGoal: number
  weeklyProgress: number
}

export const registerWorkoutPresence = async (
  userId: string,
  workoutId: string
): Promise<{ success: boolean; message: string; alreadyRegistered?: boolean }> => {
  try {
    const today = new Date().toISOString().split('T')[0]

    const { data: existing, error: checkError } = await supabase
      .from('workout_presence')
      .select('id')
      .eq('user_id', userId)
      .eq('workout_id', workoutId)
      .eq('date', today)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError
    }

    if (existing) {
      return { success: false, message: 'Treino já registrado hoje', alreadyRegistered: true }
    }

    const { error: insertError } = await supabase
      .from('workout_presence')
      .insert({
        user_id: userId,
        workout_id: workoutId,
        date: today,
      })

    if (insertError) throw insertError

    return { success: true, message: 'Treino registrado com sucesso!' }
  } catch (error: any) {
    console.error('Erro ao registrar presença:', error)
    return { success: false, message: 'Erro ao registrar: ' + error.message }
  }
}

export const checkTodayPresence = async (
  userId: string,
  workoutId: string
): Promise<boolean> => {
  try {
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('workout_presence')
      .select('id')
      .eq('user_id', userId)
      .eq('workout_id', workoutId)
      .eq('date', today)
      .single()

    if (error && error.code !== 'PGRST116') return false
    return !!data
  } catch {
    return false
  }
}

export const getPresenceStats = async (userId: string): Promise<PresenceStats> => {
  try {
    const now = new Date()
    const today = now.toISOString().split('T')[0]

    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    const weekStartStr = weekStart.toISOString().split('T')[0]

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthStartStr = monthStart.toISOString().split('T')[0]

    const { data: presences, error } = await supabase
      .from('workout_presence')
      .select('date, workout_id')
      .eq('user_id', userId)
      .gte('date', monthStartStr)

    if (error) throw error

    const todayPresences = presences?.filter(p => p.date === today) || []
    const weekPresences = presences?.filter(p => p.date >= weekStartStr) || []

    const uniqueWeekDays = new Set(weekPresences.map(p => p.date)).size
    const uniqueMonthDays = new Set(presences.map(p => p.date)).size

    const streak = calculateStreak(presences || [], today)

    return {
      todayPresent: todayPresences.length > 0,
      weekCount: uniqueWeekDays,
      monthCount: uniqueMonthDays,
      currentStreak: streak.current,
      longestStreak: streak.longest,
      weeklyGoal: 5,
      weeklyProgress: Math.min(uniqueWeekDays / 5, 1),
    }
  } catch (error) {
    console.error('Erro ao buscar stats:', error)
    return {
      todayPresent: false,
      weekCount: 0,
      monthCount: 0,
      currentStreak: 0,
      longestStreak: 0,
      weeklyGoal: 5,
      weeklyProgress: 0,
    }
  }
}

export const calculateStreak = (
  presences: { date: string }[],
  today: string
): { current: number; longest: number } => {
  const uniqueDates = [...new Set(presences.map(p => p.date))].sort().reverse()

  if (uniqueDates.length === 0) return { current: 0, longest: 0 }

  let current = 0
  let longest = 0
  let tempStreak = 0

  const todayDate = new Date(today)

  for (let i = 0; i <= 365; i++) {
    const checkDate = new Date(todayDate)
    checkDate.setDate(todayDate.getDate() - i)
    const dateStr = checkDate.toISOString().split('T')[0]

    if (uniqueDates.includes(dateStr)) {
      tempStreak++
      if (i === 0) current = tempStreak
    } else {
      if (i === 0) return { current: 0, longest: Math.max(longest, tempStreak) }
      break
    }
  }

  const allDates = [...new Set(presences.map(p => p.date))].sort()
  let maxStreak = 0
  let currentCalc = 0

  for (let i = 0; i < allDates.length; i++) {
    if (i === 0) {
      currentCalc = 1
    } else {
      const prev = new Date(allDates[i - 1])
      const curr = new Date(allDates[i])
      const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)

      if (diff === 1) {
        currentCalc++
      } else {
        maxStreak = Math.max(maxStreak, currentCalc)
        currentCalc = 1
      }
    }
  }
  maxStreak = Math.max(maxStreak, currentCalc)

  return { current, longest: maxStreak }
}

export const getWeeklyPresence = async (userId: string): Promise<{ date: string; present: boolean }[]> => {
  try {
    const now = new Date()
    const days = []

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(now.getDate() - i)
      days.push(date.toISOString().split('T')[0])
    }

    const { data, error } = await supabase
      .from('workout_presence')
      .select('date')
      .eq('user_id', userId)
      .in('date', days)

    if (error) throw error

    const presentDates = new Set(data?.map(p => p.date) || [])

    return days.map(date => ({
      date,
      present: presentDates.has(date),
    }))
  } catch {
    return []
  }
}
