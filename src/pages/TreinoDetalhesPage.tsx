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
  exercises: Exercise | Exercise[] | null
}

interface TreinoDetalhe {
  id: string
  name: string
  description?: string
  duration_minutes: number
  is_custom_duration: boolean
  level: string
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

      const { data: plansData } = await supabase
        .from('workout_plans')
        .select('*')
        .eq('workout_id', treinoId)
        .order('order_index', { ascending: true })

      const rawPlans = plansData || []

      // explicit lookup for exercises
      const exerciseIds = rawPlans.map(p => p.exercise_id).filter(Boolean)
      const { data: exercisesData } = await supabase
        .from('exercises')
        .select('id, name, muscle_group, gif_url')
        .in('id', exerciseIds)

      const plans = rawPlans.map(plan => {
        const matchedExercise = (exercisesData || []).find(e => e.id === plan.exercise_id)
        return {
          id: plan.id,
          sets: plan.sets,
          reps: plan.reps,
          rest_seconds: plan.rest_seconds,
          order_index: plan.order_index,
          exercises: matchedExercise || null
        }
      }) as Plan[]

      let durationMinutes = 0
      if (!wData.is_custom_duration && plans.length > 0) {
        const totalSecs = plans.reduce((acc, plan) => {
          const match = String(plan.reps).match(/\d+/g)
          let reps = 12
          if (match) reps = Math.max(...match.map(Number))
          return acc + (plan.sets * (reps * 2) + plan.rest_seconds)
        }, 0)
        durationMinutes = Math.ceil(totalSecs / 60)
      }

      setTreino({
        id: wData.id,
        name: wData.name,
        description: wData.description || undefined,
        duration_minutes: wData.is_custom_duration ? (wData.duration_minutes || 0) : durationMinutes,
        is_custom_duration: wData.is_custom_duration || false,
        level: wData.level || 'intermediario',
        plans: plans
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
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-indigo-500 min-h-screen">
        <Loader2 className="animate-spin mb-4" size={40} />
        <span className="text-slate-400 font-medium">Carregando detalhes do treino...</span>
      </div>
    )
  }

  if (!treino) return null

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 text-white flex flex-col gap-6">

      <button
        onClick={() => navigate('/treinos')}
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors w-fit"
      >
        <ArrowLeft size={16} />
        Voltar para Treinos
      </button>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col gap-6 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/10">
              <Dumbbell size={32} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">{treino.name}</h1>
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">{treino.level}</span>
            </div>
          </div>

          {role !== 'personal' && treino.plans.length > 0 && (
            <button
              onClick={() => navigate(`/treinos/executar/${treino.id}`)}
              className="flex items-center justify-center gap-3 px-10 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold shadow-xl shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95 w-full md:w-auto"
            >
              <Play size={20} fill="currentColor" />
              <span className="tracking-wide">Iniciar Treino</span>
            </button>
          )}
        </div>

        {treino.description && (
          <p className="text-slate-400 relative z-10 leading-relaxed text-sm md:text-base">{treino.description}</p>
        )}

        <div className="flex gap-6 mt-2 relative z-10">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
              <FileText size={16} className="text-emerald-400" />
            </span>
            <span className="font-medium">{treino.plans.length} exercícios</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
              <Clock size={16} className="text-amber-400" />
            </span>
            <span className="font-medium">{treino.duration_minutes} min {treino.is_custom_duration ? '(fixo)' : '(estimado)'}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 mt-4">
        <h3 className="text-lg font-semibold text-white/90">Lista de Exercícios</h3>

        {treino.plans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 bg-white/5 border border-white/10 rounded-3xl text-center">
            <Dumbbell size={48} className="text-slate-600 mb-4" />
            <p className="text-lg font-medium text-slate-300">Nenhum exercício adicionado ainda</p>
            <p className="text-sm text-slate-500 mt-2">Diga ao seu personal para montar o seu plano de ação!</p>
          </div>
        ) : (
          treino.plans.map((plan, i) => {
            const exerciseArray = Array.isArray(plan.exercises) ? plan.exercises : (plan.exercises ? [plan.exercises] : []);
            const exercise = exerciseArray[0];

            return (
              <div key={plan.id} className="bg-zinc-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-5 flex items-center gap-5 hover:bg-white/5 transition-all group shadow-lg">
                <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-400 font-bold flex items-center justify-center border border-indigo-500/20 shadow-inner">
                  {i + 1}
                </div>

                <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="text-indigo-400 text-[10px] font-bold tracking-widest uppercase mb-1 block">
                      {exercise?.muscle_group || 'GERAL'}
                    </span>
                    <h4 className="font-bold text-lg text-white group-hover:text-indigo-300 transition-colors">
                      {exercise?.name || 'Exercício não definido'}
                    </h4>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2.5 px-5 ml-4 rounded-xl bg-white/5 border border-white/10 shadow-sm">
                      <span className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Séries</span>
                      <span className="text-white font-black text-base">{plan.sets}</span>
                    </div>
                    <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 shadow-sm">
                      <span className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Reps</span>
                      <span className="text-white font-black text-base">{plan.reps}</span>
                    </div>
                    <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 shadow-sm">
                      <span className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">Pausa</span>
                      <span className="text-amber-400 font-black text-base">{plan.rest_seconds}s</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}