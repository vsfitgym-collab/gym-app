import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Trophy,
  User,
  Plus,
  Loader2,
  Target,
  TrendingUp,
  Star,
  Pencil,
  Trash2,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { achievements as templateAchievements, type Achievement } from '../data/achievementsData'
import { getPresenceStats } from '../lib/presenceManager'
import ProtectedFeature from '../components/ProtectedFeature'

interface AlunoInfo {
  id: string
  name: string
  email?: string
  plan?: string
}

export default function ConquistasAlunoPage() {
  const { id: alunoId } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [aluno, setAluno] = useState<AlunoInfo | null>(null)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (alunoId) {
      loadData(alunoId)
    }
  }, [alunoId])

  const loadData = async (userId: string) => {
    try {
      // Buscar info do aluno
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, name, plan')
        .eq('id', userId)
        .single()

      if (profileData) {
        setAluno({ id: profileData.id, name: profileData.name, plan: profileData.plan })
      }

      // Calcular conquistas com dados reais
      const presence = await getPresenceStats(userId)

      const { data: sessions } = await supabase
        .from('workout_sessions')
        .select('id, created_at')
        .eq('user_id', userId)
        .eq('status', 'completed')

      const totalSessions = sessions?.length || 0

      let totalSets = 0
      if (sessions && sessions.length > 0) {
        const sessionIds = sessions.map(s => s.id)
        for (let i = 0; i < sessionIds.length; i += 100) {
          const chunk = sessionIds.slice(i, i + 100)
          const { count } = await supabase
            .from('workout_sets')
            .select('id', { count: 'exact', head: true })
            .in('session_id', chunk)
          totalSets += count || 0
        }
      }

      const { count: presencesCount } = await supabase
        .from('workout_presence')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)

      const lifetimePresences = presencesCount || presence.monthCount

      const computed = templateAchievements.map(ach => {
        let progress = 0
        switch (ach.id) {
          case 'first-workout': progress = totalSessions > 0 ? 1 : 0; break
          case 'week-streak': progress = presence.currentStreak; break
          case 'month-streak': progress = presence.currentStreak; break
          case 'first-100-series':
          case 'first-500-series':
          case 'volume-king': progress = totalSets; break
          case 'first-month': progress = lifetimePresences; break
          case 'early-bird':
            progress = sessions?.filter(s => new Date(s.created_at).getHours() < 7).length || 0
            break
          case 'weekend-warrior': {
            const wk = sessions?.filter(s => {
              const d = new Date(s.created_at).getDay()
              return d === 0 || d === 6
            }).length || 0
            progress = wk > 0 ? 2 : 0
            break
          }
          default: progress = 0
        }
        const target = ach.target || 1
        const unlocked = progress >= target
        return { ...ach, progress, unlocked, unlockedAt: unlocked ? new Date().toISOString() : undefined }
      })

      setAchievements(computed)
    } catch (err) {
      console.error('Erro ao carregar conquistas do aluno:', err)
    } finally {
      setLoading(false)
    }
  }

  const unlocked = achievements.filter(a => a.unlocked).length
  const inProgress = achievements.filter(a => !a.unlocked && (a.progress || 0) > 0).length
  const locked = achievements.filter(a => !a.unlocked && (a.progress || 0) === 0).length
  const total = achievements.length
  const rate = total > 0 ? Math.round((unlocked / total) * 100) : 0

  const getCardClasses = (a: Achievement) => {
    if (a.unlocked) return 'border-purple-500/40 bg-purple-500/10'
    if ((a.progress || 0) > 0) return 'border-yellow-500/30 bg-yellow-500/5'
    return 'border-white/10 opacity-60'
  }

  const getStatusBadge = (a: Achievement) => {
    if (a.unlocked)
      return <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">Desbloqueado</span>
    if ((a.progress || 0) > 0)
      return <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">Em progresso</span>
    return <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/10 text-gray-400">Bloqueado</span>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-purple-500">
        <Loader2 className="animate-spin" size={32} />
      </div>
    )
  }

  return (
    <ProtectedFeature feature="Gamificação e Conquistas">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 flex flex-col gap-6 text-white">

        {/* Botão voltar */}
        <button
          onClick={() => navigate('/conquistas')}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors w-fit"
        >
          <ArrowLeft size={16} />
          Voltar para Gestão de Conquistas
        </button>

        {/* Header do aluno */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shrink-0">
              {aluno?.name?.charAt(0)?.toUpperCase() ?? <User size={24} />}
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-bold text-white">{aluno?.name || 'Aluno'}</h2>
              <span className="text-sm text-gray-400">
                Plano: <span className="text-purple-400 font-medium capitalize">{aluno?.plan || 'free'}</span>
              </span>
            </div>
          </div>

          <button
            onClick={() => navigate(`/conquistas/criar?aluno=${alunoId}`)}
            className="flex items-center gap-2 w-37 h-10 px-5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium hover:scale-105 transition-all duration-300 shrink-0"
          >
            <span style={{ paddingLeft: '8px', display: 'flex', alignItems: 'center' }}>
              <Plus size={16} />
            </span>
            Criar conquista
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: total, icon: Trophy, color: 'text-gray-400' },
            { label: 'Desbloqueadas', value: unlocked, icon: Star, color: 'text-purple-400' },
            { label: 'Em progresso', value: inProgress, icon: TrendingUp, color: 'text-yellow-400' },
            { label: 'Taxa', value: `${rate}%`, icon: Target, color: 'text-emerald-400' },
          ].map(stat => (
            <div key={stat.label} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 flex flex-col items-center gap-2 text-center">
              <stat.icon size={20} className={stat.color} />
              <span className={`text-2xl font-bold ${stat.color}`}>{stat.value}</span>
              <span className="text-xs text-gray-400">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Barra de progresso geral */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Progresso geral</span>
            <span className="font-semibold text-white">{rate}%</span>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-700"
              style={{ width: `${rate}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>{unlocked} / {total} desbloqueadas</span>
            <span>{inProgress} em progresso</span>
          </div>
        </div>

        {/* Lista de conquistas */}
        <div>
          <h3 className="text-base font-semibold text-white mb-4">Conquistas do aluno</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map(ach => {
              const target = ach.target || 1
              const progress = ach.progress || 0
              const percent = Math.min((progress / target) * 100, 100)

              return (
                <div
                  key={ach.id}
                  className={`bg-white/5 backdrop-blur-xl border ${getCardClasses(ach)} rounded-2xl p-5 flex flex-col gap-3 transition-all duration-300 hover:scale-[1.02]`}
                >
                  {/* Topo */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-purple-500/20 flex items-center justify-center text-2xl shrink-0">
                        {ach.icon}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <h4 className="font-semibold text-white text-sm leading-tight">{ach.title}</h4>
                        <div className="flex items-center gap-1 mt-0.5">
                          {getStatusBadge(ach)}
                          <span className="text-xs text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded-full">+{ach.xp} XP</span>
                        </div>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-gray-400 hover:text-white">
                        <Pencil size={13} />
                      </button>
                      <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-red-500/20 transition-colors text-gray-400 hover:text-red-400">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Descrição */}
                  <p className="text-sm text-gray-400 leading-relaxed">{ach.description}</p>

                  {/* Barra de progresso */}
                  {!ach.unlocked && ach.target && (
                    <div>
                      <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                        <span>Progresso</span>
                        <span>{progress} / {target}</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Data de desbloqueio */}
                  {ach.unlocked && ach.unlockedAt && (
                    <p className="text-xs text-purple-400/70">
                      Desbloqueado em {new Date(ach.unlockedAt).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </ProtectedFeature>
  )
}
