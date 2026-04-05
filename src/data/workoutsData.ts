export interface Workout {
  id: string
  name: string
  description: string
  duration_minutes: number
  exercises_count: number
  level: 'iniciante' | 'intermediario' | 'avancado'
  icon: string
}

export const workouts: Workout[] = [
  {
    id: '1',
    name: 'Treino A - Superior',
    description: 'Peito, costas e ombros',
    duration_minutes: 45,
    exercises_count: 8,
    level: 'intermediario',
    icon: '💪'
  },
  {
    id: '2',
    name: 'Treino B - Inferior',
    description: 'Quadríceps, posterior e panturrilhas',
    duration_minutes: 50,
    exercises_count: 10,
    level: 'avancado',
    icon: '🦵'
  },
  {
    id: '3',
    name: 'Treino C - Cardio',
    description: 'Cardio e resistência',
    duration_minutes: 30,
    exercises_count: 6,
    level: 'iniciante',
    icon: '❤️'
  },
  {
    id: '4',
    name: 'Treino D - Full Body',
    description: 'Treino completo para todo corpo',
    duration_minutes: 55,
    exercises_count: 12,
    level: 'intermediario',
    icon: '🔥'
  }
]

export const getLevelColor = (level: string): string => {
  const colors: Record<string, string> = {
    iniciante: '#10b981',
    intermediario: '#f59e0b',
    avancado: '#ef4444'
  }
  return colors[level] || '#6366f1'
}

export const getLevelLabel = (level: string): string => {
  const labels: Record<string, string> = {
    iniciante: 'Iniciante',
    intermediario: 'Intermediário',
    avancado: 'Avançado'
  }
  return labels[level] || level
}
