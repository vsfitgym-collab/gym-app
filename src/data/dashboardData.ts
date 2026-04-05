export interface Workout {
  id: string
  nome: string
  duracao: string
  dificuldade: 'iniciante' | 'intermediario' | 'avancado'
  exercicios: number
  icon: string
}

export const workoutsActive: Workout[] = [
  { id: '1', nome: 'Treino A - Superior', duracao: '45min', dificuldade: 'intermediario', exercicios: 8, icon: '💪' },
  { id: '2', nome: 'Treino B - Inferior', duracao: '50min', dificuldade: 'avancado', exercicios: 10, icon: '🦵' },
  { id: '3', nome: 'Treino C - Cardio', duracao: '30min', dificuldade: 'iniciante', exercicios: 6, icon: '❤️' },
]

export const weeklyProgress = [
  { dia: 'Seg', treino: true, data: '2026-04-06' },
  { dia: 'Ter', treino: false, data: '2026-04-07' },
  { dia: 'Qua', treino: true, data: '2026-04-08' },
  { dia: 'Qui', treino: true, data: '2026-04-09' },
  { dia: 'Sex', treino: false, data: '2026-04-10' },
  { dia: 'Sáb', treino: true, data: '2026-04-11' },
  { dia: 'Dom', treino: false, data: '2026-04-12' },
]

export const shortcuts = [
  { id: '1', label: 'Novo Treino', icon: '➕', cor: '#4361ee' },
  { id: '2', label: 'Registrar Presença', icon: '✅', cor: '#10b981' },
  { id: '3', label: 'Ver Alunos', icon: '👥', cor: '#f59e0b' },
  { id: '4', label: 'Relatórios', icon: '📊', cor: '#8b5cf6' },
]