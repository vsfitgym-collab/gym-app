import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, Dumbbell, FileText, Clock, Play } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

interface Exercise {
  id: string
  name: string
  muscle_group: string
  gif_url: string | null
}

interface Plan {
  id: string
  sets: number
  reps: string
  rest_seconds: number
  order_index: number
  exercises: Exercise[] | null
}

interface TreinoDetalhe {
  id: string
  name: string
  description?: string
  duration_minutes?: number
  plans: Plan[]
}

export default function TreinoDetalhesPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { role } = useAuth()

  const [treino, setTreino] = useState<TreinoDetalhe | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) carregarTreino(id)
  }, [id])

  const carregarTreino = async (treinoId: string) => {
    try {
      const { data: wData, error: wErr } = await supabase
        .from('workouts')
        .select('*')
        .eq('id', treinoId)
        .single()

      if (wErr || !wData) throw new Error('Treino não encontrado')

      const { data: pData } = await supabase
        .from('workout_plans')
        .select(`
          id, sets, reps, rest_seconds, order_index,
          exercises:exercise_id (id, name, muscle_group, gif_url)
        `)
        .eq('workout_id', treinoId)
        .order('order_index', { ascending: true })

      setTreino({
        id: wData.id,
        name: wData.name,
        description: wData.description || undefined,
        duration_minutes: wData.duration_minutes || undefined,
        plans: (pData as Plan[]) || []
      })
    } catch (err) {
      console.error(err)
      navigate('/treinos')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-purple-500">
        <Loader2 className="animate-spin" size={32} />
      </div>
    )
  }

  if (!treino) return null

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 text-white flex flex-col gap-6">

      <button
        onClick={() => navigate('/treinos')}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors w-fit"
      >
        <ArrowLeft size={16} />
        Voltar para Treinos
      </button>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Dumbbell size={32} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{treino.name}</h1>
              <span className="text-xs uppercase text-purple-400">Nível Intermediário</span>
            </div>
          </div>

          {role !== 'personal' && (
            <button
              onClick={() => navigate(`/treinos/executar/${treino.id}`)}
              className="flex items-center gap-2 px-6 h-11 rounded-xl bg-emerald-500 text-white"
            >
              <Play size={16} />
              Iniciar Treino
            </button>
          )}
        </div>

        {treino.description && (
          <p className="text-gray-400">{treino.description}</p>
        )}

        <div className="flex gap-4">
          <span>{treino.plans.length} exercícios</span>
          <span>{treino.duration_minutes || 45} min</span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {treino.plans.map((plan, i) => {
          const exercise = plan.exercises?.[0]

          return (
            <div key={plan.id} className="bg-white/5 border rounded-xl p-4 flex gap-4">

              <div>{i + 1}</div>

              <div className="flex-1">
                <span className="text-purple-400 text-xs">
                  {exercise?.muscle_group || '---'}
                </span>

                <h4 className="font-bold">
                  {exercise?.name || 'Exercício'}
                </h4>

                <div className="flex gap-4 text-sm mt-2">
                  <span>{plan.sets} séries</span>
                  <span>{plan.reps} reps</span>
                  <span>{plan.rest_seconds}s</span>
                </div>
              </div>

            </div>
          )
        })}
      </div>
    </div>
  )
}