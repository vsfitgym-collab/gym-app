import { supabase } from "@/lib/supabase"

export type AchievementType = 'workouts_completed' | 'streak_days' | 'total_time' | 'weekly_frequency' | 'special'

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  type: AchievementType
  target_value: number
  xp_reward: number
}

interface UserAchievement {
  achievement_id: string
  progress: number
  completed: boolean
  completed_at: string | null
  achievement?: Achievement
}

export async function initializeUserStats(userId: string) {
  try {
    const { data: existing } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (!existing) {
      const { error } = await supabase.from('user_stats').insert({
        user_id: userId,
        total_xp: 0,
        level: 1,
        current_streak: 0,
        best_streak: 0,
        total_workouts: 0,
        total_minutes: 0,
      })
      
      if (error && error.code !== '23505') { // Ignore duplicate key errors
        console.error('Error initializing user stats:', error)
      }
    }
  } catch (error) {
    console.error('Error in initializeUserStats:', error)
  }
}

export async function addXP(userId: string, xp: number) {
  const { data: stats } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (stats) {
    const newXP = stats.total_xp + xp
    const newLevel = Math.floor(newXP / 100) + 1

    await supabase.from('user_stats').update({
      total_xp: newXP,
      level: newLevel,
      updated_at: new Date().toISOString(),
    }).eq('user_id', userId)

    return { newXP, newLevel }
  }
  return null
}

export async function updateWorkoutProgress(userId: string, durationMinutes: number) {
  try {
    const { data: stats, error: fetchError } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single()

  if (fetchError || !stats) {
    await initializeUserStats(userId)
    return
  }

  const today = new Date().toISOString().split('T')[0]
  const lastWorkout = stats.updated_at ? stats.updated_at.split('T')[0] : null

  let newStreak = stats.current_streak
  if (lastWorkout !== today) {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    
    if (lastWorkout === yesterdayStr) {
      newStreak += 1
    } else if (lastWorkout !== today) {
      newStreak = 1
    }
  }

  const newBestStreak = Math.max(newStreak, stats.best_streak)
  const newTotalWorkouts = stats.total_workouts + 1
  const newTotalMinutes = stats.total_minutes + durationMinutes

  await supabase.from('user_stats').update({
    current_streak: newStreak,
    best_streak: newBestStreak,
    total_workouts: newTotalWorkouts,
    total_minutes: newTotalMinutes,
    updated_at: new Date().toISOString(),
  }).eq('user_id', userId)

  // Atualizar conquistas baseadas em treinos
  await checkAchievements(userId, 'workouts_completed', newTotalWorkouts)
  await checkAchievements(userId, 'streak_days', newStreak)
  await checkAchievements(userId, 'total_time', newTotalMinutes)

  // Adicionar XP do treino
  await addXP(userId, 25)
  } catch (error) {
    console.error('Error updating workout progress:', error)
  }
}

async function checkAchievements(userId: string, type: string, value: number) {
  const { data: achievements } = await supabase
    .from('achievements')
    .select('*')
    .eq('type', type)

  if (!achievements) return

  for (const achievement of achievements) {
    const { data: existing } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId)
      .eq('achievement_id', achievement.id)
      .single()

    if (existing) {
      if (!existing.completed && value >= achievement.target_value) {
        await supabase.from('user_achievements').update({
          progress: achievement.target_value,
          completed: true,
          completed_at: new Date().toISOString(),
        }).eq('id', existing.id)

        await addXP(userId, achievement.xp_reward)
      } else if (!existing.completed) {
        await supabase.from('user_achievements').update({
          progress: value,
        }).eq('id', existing.id)
      }
    } else {
      const isCompleted = value >= achievement.target_value
      await supabase.from('user_achievements').insert({
        user_id: userId,
        achievement_id: achievement.id,
        progress: Math.min(value, achievement.target_value),
        completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null,
      })

      if (isCompleted) {
        await addXP(userId, achievement.xp_reward)
      }
    }
  }
}

export async function getUserStats(userId: string) {
  const { data: stats } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .single()

  return stats
}

export async function getUserAchievements(userId: string) {
  const { data } = await supabase
    .from('user_achievements')
    .select(`
      *,
      achievement:achievements(*)
    `)
    .eq('user_id', userId)
    .order('completed', { ascending: false })

  return data || []
}