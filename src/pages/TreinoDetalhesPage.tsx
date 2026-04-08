import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, Dumbbell, FileText, Clock, Play } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

interface TreinoDetalhe {
  id: string
  name: string
  description?: string
  duration_minutes?: number
  plans: {
    id: string
    sets: number
    reps: string
    rest_seconds: number
    order_index: number
    exercises: {
      id: string
      name: string
      muscle_group: string
      gif_url: string | null
    } | null
  }[]
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
        plans: pData || []
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
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 text-white flex flex-col gap-6" style={{ animation: 'fadeIn 0.4s ease' }}>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      
      {/* Voltar */}
      <button 
        onClick={() => navigate('/treinos')}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors w-fit"
      >
        <ArrowLeft size={16} />
        Voltar para Treinos
      </button>

      {/* Header do Treino */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Dumbbell size={32} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{treino.name}</h1>
              <span className="text-xs uppercase tracking-wider font-semibold text-purple-400">Nível Intermediário</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {role === 'personal' ? (
              <>
                <button 
                  onClick={() => navigate(`/treinos/editar/${treino.id}`)}
                  style={{ paddingLeft: '32px', paddingRight: '32px' }}
                  className="flex items-center justify-center gap-2 h-11 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm font-medium whitespace-nowrap"
                >
                  Editar Treino
                </button>
                <button 
                  onClick={async () => {
                    if (!confirm('Tem certeza que deseja excluir este treino? Esta ação não pode ser desfeita.')) return
                    try {
                      const { supabase: sb } = await import('../lib/supabase')
                      await sb.from('workout_plans').delete().eq('workout_id', treino.id)
                      await sb.from('workouts').delete().eq('id', treino.id)
                      navigate('/treinos')
                    } catch (err) {
                      console.error('Erro ao excluir treino:', err)
                      alert('Erro ao excluir treino. Tente novamente.')
                    }
                  }}
                  style={{ paddingLeft: '32px', paddingRight: '32px' }}
                  className="flex items-center justify-center gap-2 h-11 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 transition-all text-sm font-medium text-red-400 whitespace-nowrap"
                >
                  Excluir Treino
                </button>
              </>
            ) : (
              <button 
                onClick={() => navigate(`/treinos/executar/${treino.id}`)}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:scale-[1.02] shadow-lg shadow-emerald-500/20 transition-all text-sm font-semibold"
              >
                <Play size={16} className="fill-white" />
                Iniciar Treino
              </button>
            )}
          </div>
        </div>

        {treino.description && (
          <p className="text-gray-400 text-sm md:text-base leading-relaxed">
            {treino.description}
          </p>
        )}

        <div className="flex flex-wrap gap-4 pt-2">
          <div className="flex items-center gap-2 text-sm text-gray-400 bg-white/5 py-2 px-4 rounded-lg">
            <FileText size={16} className="text-purple-400" />
            <span>{treino.plans.length} exercícios</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400 bg-white/5 py-2 px-4 rounded-lg">
            <Clock size={16} className="text-purple-400" />
            <span>{treino.duration_minutes || 45} mins aprox.</span>
          </div>
        </div>
      </div>

      {/* Lista de Exercícios */}
      <div>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          Visão Geral dos Exercícios
        </h3>
        <div className="flex flex-col gap-3">
          {treino.plans.map((plan, i) => (
            <div key={plan.id} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 md:p-5 flex items-center gap-4 hover:border-white/20 transition-colors">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 font-bold shrink-0">
                {i + 1}
              </div>
              
              <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col">
                  <span className="text-xs text-purple-400 font-medium mb-1 uppercase tracking-wider">{plan.exercises?.muscle_group}</span>
                  <h4 className="font-bold text-white leading-tight">{plan.exercises?.name}</h4>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 md:gap-6 text-sm text-gray-300">
                  <div className="flex flex-col items-center min-w-[60px] bg-white/5 rounded-lg py-1.5 px-3">
                    <span className="text-xs text-gray-500">Séries</span>
                    <span className="font-semibold text-white">{plan.sets}</span>
                  </div>
                  <div className="text-gray-600 text-lg">×</div>
                  <div className="flex flex-col items-center min-w-[60px] bg-white/5 rounded-lg py-1.5 px-3">
                    <span className="text-xs text-gray-500">Reps</span>
                    <span className="font-semibold text-white">{plan.reps}</span>
                  </div>
                  <div className="text-gray-600 hidden md:block">|</div>
                  <div className="flex items-center gap-2 min-w-[80px]">
                    <Clock size={14} className="text-gray-500" />
                    <span className="font-medium text-white">{plan.rest_seconds}s</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {treino.plans.length === 0 && (
            <div className="text-center py-10 bg-white/5 border border-white/10 text-gray-400 rounded-2xl">
              Nenhum exercício cadastrado neste treino.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
