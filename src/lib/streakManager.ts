export interface StreakData {
  currentStreak: number
  longestStreak: number
  lastWorkoutDate: string | null
  totalWorkouts: number
  thisWeekWorkouts: number
  streakHistory: { date: string; completed: boolean }[]
}

const STREAK_KEY = 'gym_streak_data'

export const getTodayKey = (): string => {
  return new Date().toISOString().split('T')[0]
}

export const getStreakData = (): StreakData => {
  const stored = localStorage.getItem(STREAK_KEY)
  if (stored) {
    return JSON.parse(stored)
  }
  return {
    currentStreak: 0,
    longestStreak: 0,
    lastWorkoutDate: null,
    totalWorkouts: 0,
    thisWeekWorkouts: 0,
    streakHistory: getLast30Days(),
  }
}

export const getLast30Days = (): { date: string; completed: boolean }[] => {
  const days: { date: string; completed: boolean }[] = []
  for (let i = 29; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    days.push({
      date: date.toISOString().split('T')[0],
      completed: false,
    })
  }
  return days
}

export const recordWorkout = (): StreakData => {
  const data = getStreakData()
  const today = getTodayKey()

  if (data.lastWorkoutDate === today) {
    return data
  }

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayKey = yesterday.toISOString().split('T')[0]

  if (data.lastWorkoutDate === yesterdayKey || data.lastWorkoutDate === null) {
    data.currentStreak += 1
  } else {
    data.currentStreak = 1
  }

  if (data.currentStreak > data.longestStreak) {
    data.longestStreak = data.currentStreak
  }

  data.lastWorkoutDate = today
  data.totalWorkouts += 1

  const historyIndex = data.streakHistory.findIndex(h => h.date === today)
  if (historyIndex >= 0) {
    data.streakHistory[historyIndex].completed = true
  }

  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  data.thisWeekWorkouts = data.streakHistory.filter(h => {
    const hDate = new Date(h.date)
    return hDate >= weekStart && h.completed
  }).length

  localStorage.setItem(STREAK_KEY, JSON.stringify(data))
  return data
}

export const getStreakMessage = (streak: number): string => {
  if (streak === 0) return 'Comece hoje!'
  if (streak === 1) return 'Primeiro dia! 🔥'
  if (streak < 3) return 'Bom começo!'
  if (streak < 7) return 'Continue assim!'
  if (streak === 7) return '🏆 Semana completa!'
  if (streak < 14) return 'Imparável!'
  if (streak < 30) return '🔥 Em chamas!'
  if (streak === 30) return '👑 Mês de ferro!'
  return '💎 Lendário!'
}

export const getStreakLevel = (streak: number): string => {
  if (streak === 0) return 'iniciante'
  if (streak < 3) return 'iniciante'
  if (streak < 7) return 'dedicado'
  if (streak < 14) return 'forte'
  if (streak < 30) return 'elite'
  return 'lendario'
}
