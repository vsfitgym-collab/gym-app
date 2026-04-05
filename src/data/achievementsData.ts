export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  category: 'consistencia' | 'volume' | 'evolucao' | 'marco'
  rarity: 'comum' | 'raro' | 'epico' | 'lenda'
  unlocked: boolean
  unlockedAt?: string
  progress?: number
  target?: number
  xp: number
}

export const achievements: Achievement[] = [
  {
    id: 'first-workout',
    title: 'Primeiro Passo',
    description: 'Complete seu primeiro treino',
    icon: '🏁',
    category: 'marco',
    rarity: 'comum',
    unlocked: true,
    unlockedAt: '2026-03-15',
    xp: 50,
  },
  {
    id: 'week-streak',
    title: 'Semana Perfeita',
    description: 'Treine 7 dias seguidos',
    icon: '🔥',
    category: 'consistencia',
    rarity: 'raro',
    unlocked: false,
    progress: 5,
    target: 7,
    xp: 200,
  },
  {
    id: 'month-streak',
    title: 'Mês de Ferro',
    description: 'Treine 30 dias seguidos',
    icon: '⚡',
    category: 'consistencia',
    rarity: 'epico',
    unlocked: false,
    progress: 12,
    target: 30,
    xp: 500,
  },
  {
    id: 'first-100-series',
    title: 'Centenário',
    description: 'Complete 100 séries no total',
    icon: '💯',
    category: 'volume',
    rarity: 'comum',
    unlocked: true,
    unlockedAt: '2026-03-20',
    xp: 100,
  },
  {
    id: 'first-500-series',
    title: 'Meio Milhar',
    description: 'Complete 500 séries no total',
    icon: '🏆',
    category: 'volume',
    rarity: 'raro',
    unlocked: false,
    progress: 342,
    target: 500,
    xp: 300,
  },
  {
    id: 'load-evolution',
    title: 'Evolução de Carga',
    description: 'Aumente a carga em 20% em um exercício',
    icon: '📈',
    category: 'evolucao',
    rarity: 'raro',
    unlocked: false,
    progress: 15,
    target: 20,
    xp: 250,
  },
  {
    id: 'load-master',
    title: 'Mestre da Carga',
    description: 'Aumente a carga em 50% em um exercício',
    icon: '👑',
    category: 'evolucao',
    rarity: 'epico',
    unlocked: false,
    progress: 15,
    target: 50,
    xp: 500,
  },
  {
    id: 'early-bird',
    title: 'Madrugador',
    description: 'Complete 5 treinos antes das 7h',
    icon: '🌅',
    category: 'consistencia',
    rarity: 'raro',
    unlocked: false,
    progress: 3,
    target: 5,
    xp: 200,
  },
  {
    id: 'weekend-warrior',
    title: 'Guerreiro de Fim de Semana',
    description: 'Treine nos 2 dias do fim de semana',
    icon: '🗓️',
    category: 'consistencia',
    rarity: 'comum',
    unlocked: true,
    unlockedAt: '2026-03-22',
    xp: 100,
  },
  {
    id: 'volume-king',
    title: 'Rei do Volume',
    description: 'Complete 1000 séries no total',
    icon: '🤴',
    category: 'volume',
    rarity: 'lenda',
    unlocked: false,
    progress: 342,
    target: 1000,
    xp: 1000,
  },
  {
    id: 'first-month',
    title: 'Mês Completo',
    description: 'Complete 30 dias de treino no mês',
    icon: '📅',
    category: 'marco',
    rarity: 'epico',
    unlocked: false,
    progress: 18,
    target: 30,
    xp: 400,
  },
  {
    id: 'personal-record',
    title: 'Recorde Pessoal',
    description: 'Bata seu recorde em 3 exercícios',
    icon: '🥇',
    category: 'evolucao',
    rarity: 'epico',
    unlocked: false,
    progress: 1,
    target: 3,
    xp: 400,
  },
]

export const rarityColors: Record<string, string> = {
  comum: '#9ca3af',
  raro: '#3b82f6',
  epico: '#8b5cf6',
  lenda: '#f59e0b',
}

export const rarityLabels: Record<string, string> = {
  comum: 'Comum',
  raro: 'Raro',
  epico: 'Épico',
  lenda: 'Lendário',
}

export const categoryLabels: Record<string, string> = {
  consistencia: 'Consistência',
  volume: 'Volume',
  evolucao: 'Evolução',
  marco: 'Marco',
}

export const getUnlockedCount = (list: Achievement[]): number => {
  return list.filter(a => a.unlocked).length
}

export const getTotalXP = (list: Achievement[]): number => {
  return list.filter(a => a.unlocked).reduce((acc, a) => acc + a.xp, 0)
}

export const getProgressByCategory = (list: Achievement[], category: string): { unlocked: number; total: number } => {
  const filtered = list.filter(a => a.category === category)
  return {
    unlocked: filtered.filter(a => a.unlocked).length,
    total: filtered.length,
  }
}
