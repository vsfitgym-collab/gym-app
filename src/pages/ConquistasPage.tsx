import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trophy, Star, Target, TrendingUp, Calendar, Loader2, User, Eye, Plus, Award } from 'lucide-react'
import { achievements as templateAchievements, getUnlockedCount, getTotalXP, getProgressByCategory, type Achievement } from '../data/achievementsData'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { getPresenceStats } from '../lib/presenceManager'
import ProtectedFeature from '../components/ProtectedFeature'

const categories = [
  { value: 'all', label: 'Todas', icon: Trophy },
  { value: 'consistencia', label: 'Consistência', icon: Target },
  { value: 'volume', label: 'Volume', icon: TrendingUp },
  { value: 'evolucao', label: 'Evolução', icon: Star },
  { value: 'marco', label: 'Marcos', icon: Calendar },
]

function SkeletonCard() {
  return (
    <div className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 animate-pulse">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-full bg-white/10" />
        <div className="flex-1">
          <div className="h-4 bg-white/10 rounded w-1/2 mb-2" />
          <div className="h-3 bg-white/10 rounded w-1/4" />
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex justify-between">
          <div className="h-3 bg-white/10 rounded w-1/4" />
          <div className="h-3 bg-white/10 rounded w-1/6" />
        </div>
        <div className="h-2 bg-white/10 rounded-full w-full" />
      </div>
      <div className="flex gap-2 mt-6">
        <div className="h-10 bg-white/10 rounded-lg flex-1" />
        <div className="h-10 bg-white/10 rounded-lg flex-1" />
      </div>
    </div>
  )
}

function StudentAchievementCard({ aluno, navigate }: { aluno: any, navigate: any }) {
  const totalAchievements = templateAchievements.length
  const unlocked = aluno.achievementsCount || 0
  const progress = Math.round((unlocked / totalAchievements) * 100)

  return (
    <div className="group relative bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[24px] p-6 transition-all duration-500 hover:bg-white/[0.08] hover:border-purple-500/30 hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(139,92,246,0.15)] overflow-hidden">
      {/* Glow Effect on Hover */}
      <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/0 to-indigo-600/0 rounded-[25px] opacity-0 group-hover:opacity-10 group-hover:from-purple-600/20 group-hover:to-indigo-600/20 blur transition-all duration-500" />

      <div className="relative flex items-center gap-4 mb-6">
        {/* Avatar with Gradient Border */}
        <div className="relative shrink-0">
          <div className="absolute -inset-0.5 bg-gradient-to-tr from-purple-500 to-indigo-500 rounded-full animate-spin-slow opacity-70 group-hover:opacity-100" />
          <div className="relative w-14 h-14 rounded-full bg-[#0a0a0a] flex items-center justify-center overflow-hidden border-2 border-transparent">
            {aluno.avatar_url ? (
              <img src={aluno.avatar_url} alt={aluno.name} className="w-full h-full object-cover" />
            ) : (
              <User size={28} className="text-purple-400/70" />
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-white truncate group-hover:text-purple-300 transition-colors uppercase tracking-tight">
              {aluno.name || 'Aluno'}
            </h3>
            {progress >= 80 && <Award size={16} className="text-amber-400 shrink-0 animate-bounce" />}
          </div>
          <div className="flex items-center gap-2">
            <span className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${aluno.status === 'ativo'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
              }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${aluno.status === 'ativo' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-amber-400 animate-pulse'}`} />
              {aluno.status === 'ativo' ? 'Ativo' : 'Baixa atividade'}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-6">
        <div className="flex justify-between items-end">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Progresso do Aluno</span>
          <span className="text-sm font-black text-white">{unlocked}<span className="text-gray-500 font-medium">/{totalAchievements}</span></span>
        </div>
        <div className="relative h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-600 via-indigo-500 to-blue-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(139,92,246,0.3)]"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute top-0 right-0 w-8 h-full bg-white/20 blur-sm" />
          </div>
        </div>
      </div>

      <div className="flex gap-2 relative">
        <button
          onClick={() => navigate(`/conquistas/aluno/${aluno.id}`)}
          className="flex-1 h-11 px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 hover:text-white transition-all duration-300 active:scale-95"
        >
          <Eye size={16} />
          Ver
        </button>
        <button
          onClick={() => navigate(`/conquistas/criar?aluno=${aluno.id}`)}
          className="flex-2 h-11 px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_4px_15px_-5px_rgba(139,92,246,0.5)] hover:shadow-[0_8px_25px_-5px_rgba(139,92,246,0.6)] hover:scale-[1.03] transition-all duration-300 active:scale-95"
        >
          <Plus size={16} />
          Criar
        </button>
      </div>
    </div>
  )
}

function ModernAchievementCard({ achievement }: { achievement: Achievement }) {
  const isUnlocked = achievement.unlocked
  const target = achievement.target || 1
  const progress = achievement.progress || 0
  const percent = Math.min((progress / target) * 100, 100)

  return (
    <div className={`bg-white/5 backdrop-blur-xl border ${isUnlocked ? 'border-purple-500/40 bg-purple-500/10' : 'border-white/10 opacity-60'} rounded-2xl p-5 flex flex-col gap-3 transition-all duration-300 hover:scale-[1.02]`}>
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 shrink-0 flex items-center justify-center rounded-xl bg-purple-500/20 text-2xl">
          {achievement.icon}
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h4 className="font-semibold text-white">{achievement.title}</h4>
            <span className="text-xs font-medium text-purple-400 bg-purple-400/10 px-2 py-1 rounded-lg">
              +{achievement.xp} XP
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-1">{achievement.description}</p>
        </div>
      </div>

      {!isUnlocked && achievement.target && (
        <div className="mt-2">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Progresso</span>
            <span>{progress}/{target}</span>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function TelaAluno({ user }: { user: any }) {
  const [filter, setFilter] = useState('all')
  const [activeAchievements, setActiveAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUserAchievements = async () => {
      try {
        if (!user) return

        const presence = await getPresenceStats(user.id)

        const { data: sessions } = await supabase
          .from('workout_sessions')
          .select('id, created_at')
          .eq('user_id', user.id)
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

            totalSets += (count || 0)
          }
        }

        const { count: presencesCount } = await supabase
          .from('workout_presence')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)

        const lifetimePresences = presencesCount || presence.monthCount

        const realAchievements = templateAchievements.map(ach => {
          let progress = 0

          switch (ach.id) {
            case 'first-workout': progress = totalSessions > 0 ? 1 : 0; break;
            case 'week-streak': progress = presence.currentStreak; break;
            case 'month-streak': progress = presence.currentStreak; break;
            case 'first-100-series':
            case 'first-500-series':
            case 'volume-king': progress = totalSets; break;
            case 'first-month': progress = lifetimePresences; break;
            case 'early-bird':
              progress = sessions?.filter(s => new Date(s.created_at).getHours() < 7).length || 0
              break
            case 'weekend-warrior':
              const weekendSessions = sessions?.filter(s => {
                const day = new Date(s.created_at).getDay()
                return day === 0 || day === 6
              }).length || 0
              progress = weekendSessions > 0 ? 2 : 0
              break
            default: progress = 0
          }

          const target = ach.target || 1
          const unlocked = progress >= target

          return {
            ...ach,
            progress,
            unlocked,
            unlockedAt: unlocked ? new Date().toISOString() : undefined
          }
        })

        setActiveAchievements(realAchievements)
      } catch (err) {
        console.error("Erro ao carregar conquistas reais:", err)
        setActiveAchievements(templateAchievements)
      } finally {
        setLoading(false)
      }
    }

    if (user) loadUserAchievements()
  }, [user])

  const stats = useMemo(() => ({
    unlocked: getUnlockedCount(activeAchievements),
    total: activeAchievements.length,
    totalXP: getTotalXP(activeAchievements),
  }), [activeAchievements])

  const filteredAchievements = useMemo(() => {
    if (filter === 'all') return activeAchievements
    return activeAchievements.filter(a => a.category === filter)
  }, [filter, activeAchievements])

  const unlockedPercent = stats.total > 0 ? Math.round((stats.unlocked / stats.total) * 100) : 0

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-purple-500">
        <Loader2 className="animate-spin" size={32} />
      </div>
    )
  }

  return (
    <ProtectedFeature feature="Gamificação e Conquistas">
      <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-1">Conquistas</h2>
            <span className="text-gray-400 text-sm">
              {stats.unlocked}/{stats.total} desbloqueadas
            </span>
          </div>
          <div className="flex flex-col items-center px-6 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl">
            <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">{stats.totalXP}</span>
            <span className="text-[10px] md:text-xs text-gray-400 uppercase tracking-wider">XP Total</span>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 md:p-6 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-sm text-gray-400">
              <span>Progresso Geral</span>
              <span className="font-semibold text-white">{unlockedPercent}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500"
                style={{ width: `${unlockedPercent}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Trophy size={20} />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-white leading-tight text-lg">{stats.unlocked}</span>
                <span className="text-[10px] md:text-xs text-gray-400">Desbloqueadas</span>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                <Star size={20} />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-white leading-tight text-lg">{stats.total - stats.unlocked}</span>
                <span className="text-[10px] md:text-xs text-gray-400">Restantes</span>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <TrendingUp size={20} />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-white leading-tight text-lg">{stats.totalXP}</span>
                <span className="text-[10px] md:text-xs text-gray-400">XP Ganho</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none snap-x">
          {categories.map(cat => {
            const Icon = cat.icon
            const progress = cat.value !== 'all' ? getProgressByCategory(activeAchievements, cat.value) : null
            const isActive = filter === cat.value
            return (
              <button
                key={cat.value}
                className={`flex items-center gap-2 px-4 py-2 mb-5 rounded-full text-sm font-medium transition-all whitespace-nowrap snap-start ${isActive ? 'bg-purple-600 text-white border-transparent' : 'bg-white/5 text-gray-400 border border-white/10 hover:border-purple-500/50 hover:text-white'}`}
                onClick={() => setFilter(cat.value)}
              >
                <Icon size={16} />
                <span>{cat.label}</span>
                {progress && (
                  <span className="text-xs opacity-70 ml-1">
                    {progress.unlocked}/{progress.total}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAchievements.map((achievement) => (
            <ModernAchievementCard
              key={achievement.id}
              achievement={achievement}
            />
          ))}
        </div>
      </div>
    </ProtectedFeature >
  )
}

function TelaPersonal() {
  const navigate = useNavigate()
  const [alunos, setAlunos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAlunos = async () => {
      try {
        setLoading(true)
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, avatar_url, plan_expires_at')
          .eq('role', 'aluno')

        if (profiles) {
          // Fetch achievements counts for each student
          const { data: achievementsData } = await supabase
            .from('achievements')
            .select('user_id, unlocked')
            .in('user_id', profiles.map(p => p.id))

          const formatted = profiles.map(aluno => {
            const isExpired = aluno.plan_expires_at && new Date(aluno.plan_expires_at) < new Date()
            const alunoAchievements = achievementsData?.filter(a => a.user_id === aluno.id && a.unlocked) || []
            return {
              ...aluno,
              status: isExpired ? 'baixa_atividade' : 'ativo',
              achievementsCount: alunoAchievements.length
            }
          })
          setAlunos(formatted)
        }
      } catch (error) {
        console.error('Erro ao buscar alunos e conquistas:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchAlunos()
  }, [])

  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-0 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-[0_8px_20px_-5px_rgba(139,92,246,0.4)]">
            <Trophy size={32} className="text-white" />
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white uppercase italic">
              Gestão de <span className="text-purple-500">Conquistas</span>
            </h2>
            <p className="text-gray-400 font-medium tracking-wide">Monitore e celebre a evolução dos seus atletas</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/conquistas/criar')}
          className="flex items-center gap-3 px-6 h-14 rounded-2xl bg-white/5 border border-white/10 text-white font-bold uppercase tracking-widest hover:bg-white/10 transition-all duration-300 active:scale-95 group"
        >
          <Award size={20} className="text-purple-400 group-hover:scale-110 transition-transform" />
          <span>Nova conquista global</span>
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {alunos.map(aluno => (
            <StudentAchievementCard
              key={aluno.id}
              aluno={aluno}
              navigate={navigate}
            />
          ))}
          {alunos.length === 0 && (
            <div className="col-span-full py-20 text-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px]">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <User size={40} className="text-gray-600" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 uppercase italic tracking-wider">Nenhum Atleta Encontrado</h3>
              <p className="text-gray-500 max-w-xs mx-auto">Adicione novos alunos para começar a gerenciar suas conquistas personalizadas.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ConquistasPage() {
  const { user, role } = useAuth()
  const isPersonal = role === 'personal'
  const isAluno = role === 'aluno'

  return (
    <div className="text-white">
      {isAluno && <TelaAluno user={user} />}
      {isPersonal && <TelaPersonal />}
      {!isAluno && !isPersonal && (
        <div className="text-center text-gray-400 pt-10">Acesso restrito</div>
      )}
    </div>
  )
}
