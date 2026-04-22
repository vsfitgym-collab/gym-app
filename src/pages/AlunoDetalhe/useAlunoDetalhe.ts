import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

interface Aluno {
  id: string
  name: string
  email: string
  phone: string
  status: 'active' | 'inactive'
  plano?: string
  created_at: string
  observacoes?: string
}

interface Treino {
  id: string
  nome: string
  data: string
  duracao: number
  concluido: boolean
}

interface Progresso {
  id: string
  data: string
  peso: number | null
  gordura: number | null
  massa_muscular: number | null
}

interface Stats {
  totalTreinos: number
  frequenciaSemanal: number
  ultimoTreino: string | null
  evolucao: number
}

interface AlunoDetalheData {
  aluno: Aluno | null
  treinos: Treino[]
  progresso: Progresso[]
  stats: Stats
  loading: boolean
  error: string | null
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('pt-BR')
}

function calculateFrequenciaSemanal(treinos: Treino[]): number {
  const now = new Date()
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  
  const treinosSemana = treinos.filter(t => {
    const dataTreino = new Date(t.data)
    return dataTreino >= oneWeekAgo && t.concluido
  })
  
  return treinosSemana.length
}

export function useAlunoDetalhe(alunoId: string | undefined): AlunoDetalheData {
  const [aluno, setAluno] = useState<Aluno | null>(null)
  const [treinos, setTreinos] = useState<Treino[]>([])
  const [progresso, setProgresso] = useState<Progresso[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!alunoId) {
      setLoading(false)
      setError('ID do aluno não fornecido')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const [alunoResult, treinosResult, progressoResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('id', alunoId)
          .single(),
        supabase
          .from('workout_sessions')
          .select('id, started_at, completed_at, status, workout_id')
          .eq('user_id', alunoId)
          .order('started_at', { ascending: false })
          .limit(20),
        supabase
          .from('aluno_progresso')
          .select('*')
          .eq('aluno_id', alunoId)
          .order('data', { ascending: true })
      ])

      if (alunoResult.error) {
        console.error('Erro ao carregar aluno:', alunoResult.error)
        setError('Erro ao carregar dados do aluno')
      } else if (alunoResult.data) {
        const a = alunoResult.data
        setAluno({
          id: a.id,
          name: a.name || a.full_name || 'Aluno',
          email: a.email || '',
          phone: a.phone || '',
          status: a.status === 'active' ? 'active' : 'inactive',
          plano: a.plano,
          created_at: a.created_at,
          observacoes: a.observacoes
        })
      }

      let treinosData: Treino[] = []
      if (treinosResult.data && treinosResult.data.length > 0) {
        const workoutIds = [...new Set(treinosResult.data.map(t => t.workout_id).filter(Boolean))]
        const { data: workoutsData } = await supabase
          .from('workouts')
          .select('id, name')
          .in('id', workoutIds)

        const workoutMap = new Map(workoutsData?.map(w => [w.id, w.name]) || [])

        treinosData = treinosResult.data.map(t => {
          const startedAt = t.started_at ? new Date(t.started_at) : null
          const completedAt = t.completed_at ? new Date(t.completed_at) : null
          const duracao = startedAt && completedAt 
            ? Math.round((completedAt.getTime() - startedAt.getTime()) / 60000)
            : 0

          return {
            id: t.id,
            nome: workoutMap.get(t.workout_id) || 'Treino',
            data: t.started_at || '',
            duracao,
            concluido: t.status === 'completed'
          }
        })
      }
      setTreinos(treinosData)

      if (progressoResult.data) {
        setProgresso(progressoResult.data)
      }

    } catch (err) {
      console.error('Erro geral:', err)
      setError('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [alunoId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const stats: Stats = {
    totalTreinos: treinos.filter(t => t.concluido).length,
    frequenciaSemanal: calculateFrequenciaSemanal(treinos),
    ultimoTreino: treinos.find(t => t.concluido)?.data || null,
    evolucao: progresso.length > 1 
      ? Math.round(((progresso[progresso.length - 1]?.peso || 0) - (progresso[0]?.peso || 0)) * 10) / 10
      : 0
  }

  return {
    aluno,
    treinos,
    progresso,
    stats,
    loading,
    error
  }
}