import { useState, useMemo, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Trophy, Star, Target, TrendingUp, Calendar, Loader2, User,
  Eye, Plus, Award, Search, Users, CheckCircle2, BarChart2,
  Flame, ChevronRight, Filter, ArrowUpDown, Zap,
} from 'lucide-react'
import { achievements as templateAchievements, getUnlockedCount, getTotalXP, getProgressByCategory, type Achievement } from '../data/achievementsData'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { getPresenceStats } from '../lib/presenceManager'
import ProtectedFeature from '../components/ProtectedFeature'
import './ConquistasPersonal.css'

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const GRAD = [
  'linear-gradient(135deg,#8b5cf6,#6366f1)',
  'linear-gradient(135deg,#06b6d4,#0284c7)',
  'linear-gradient(135deg,#10b981,#059669)',
  'linear-gradient(135deg,#f59e0b,#d97706)',
  'linear-gradient(135deg,#ec4899,#db2777)',
]
function avatarGrad(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return GRAD[Math.abs(h) % GRAD.length]
}

type SortMode = 'name' | 'progress_desc' | 'progress_asc' | 'achievements'

interface AlunoEnhanced {
  id: string
  name: string
  plan: string
  planStatus: 'ativo' | 'inativo'
  achievementsCount: number
  totalAchievements: number
  progressPct: number
  trainedToday: boolean
  isHighlight: boolean
  weekSessions: number
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function CQSkeletonCard() {
  return (
    <div className="cq-skeleton-card">
      <div className="cq-skeleton-header">
        <div className="cq-skel" style={{ width: 56, height: 56, borderRadius: '50%', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="cq-skel" style={{ height: 14, width: '55%' }} />
          <div className="cq-skel" style={{ height: 11, width: '30%' }} />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="cq-skel" style={{ height: 10, width: '40%' }} />
        <div className="cq-skel" style={{ height: 7, width: '100%', borderRadius: 999 }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
        {[1,2,3].map(i => <div key={i} className="cq-skel" style={{ height: 54, borderRadius: '0.625rem' }} />)}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <div className="cq-skel" style={{ flex: 1, height: 40, borderRadius: '0.625rem' }} />
        <div className="cq-skel" style={{ flex: 1, height: 40, borderRadius: '0.625rem' }} />
      </div>
    </div>
  )
}

// ── Student Card ──────────────────────────────────────────────────────────────

function CQStudentCard({ aluno, navigate }: { aluno: AlunoEnhanced; navigate: ReturnType<typeof useNavigate> }) {
  return (
    <div
      className={`cq-student-card ${aluno.isHighlight ? 'card-highlight' : ''}`}
      style={{ animationDelay: '0ms' }}
    >
      {/* Header */}
      <div className="cq-card-header">
        <div className="cq-avatar-wrap">
          <div className="cq-avatar-ring" />
          <div className="cq-avatar-inner" style={{ background: avatarGrad(aluno.name) }}>
            {aluno.name.charAt(0).toUpperCase()}
          </div>
        </div>

        <div className="cq-card-identity">
          <div className="cq-card-name-row">
            <span className="cq-card-name">{aluno.name}</span>
            {aluno.isHighlight && (
              <span className="cq-badge cq-badge-star"><Trophy size={8} />Top</span>
            )}
            {aluno.trainedToday && (
              <span className="cq-badge cq-badge-hot"><Flame size={8} />Hoje</span>
            )}
          </div>
          <div className="cq-card-plan">
            <span className={`cq-badge ${aluno.planStatus === 'ativo' ? 'cq-badge-active' : 'cq-badge-inactive'}`}>
              {aluno.planStatus === 'ativo' ? 'Ativo' : 'Inativo'}
            </span>
            <span style={{ marginLeft: '0.25rem' }}>{aluno.plan}</span>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="cq-card-progress">
        <div className="cq-progress-header">
          <span className="cq-progress-label">Progresso geral</span>
          <span className="cq-progress-count">
            {aluno.achievementsCount}<span>/{aluno.totalAchievements}</span>
          </span>
        </div>
        <div className="cq-progress-bar-track">
          <div className="cq-progress-bar-fill" style={{ width: `${aluno.progressPct}%` }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <span className="cq-progress-pct">{aluno.progressPct}%</span>
        </div>
      </div>

      {/* Mini stats */}
      <div className="cq-mini-stats">
        <div className="cq-mini-stat">
          <div className="cq-mini-stat-value" style={{ color: '#a78bfa' }}>{aluno.achievementsCount}</div>
          <div className="cq-mini-stat-label">Conquistadas</div>
        </div>
        <div className="cq-mini-stat">
          <div className="cq-mini-stat-value" style={{ color: '#22d3ee' }}>{aluno.totalAchievements - aluno.achievementsCount}</div>
          <div className="cq-mini-stat-label">Restantes</div>
        </div>
        <div className="cq-mini-stat">
          <div className="cq-mini-stat-value" style={{ color: '#34d399' }}>{aluno.weekSessions}</div>
          <div className="cq-mini-stat-label">Semana</div>
        </div>
      </div>

      {/* Actions */}
      <div className="cq-card-actions">
        <button
          className="cq-btn cq-btn-ghost cq-btn-sm"
          onClick={e => { e.stopPropagation(); navigate(`/conquistas/aluno/${aluno.id}`) }}
        >
          <Eye size={14} />
          Ver progresso
        </button>
        <button
          className="cq-btn cq-btn-primary cq-btn-sm"
          onClick={e => { e.stopPropagation(); navigate(`/conquistas/criar?aluno=${aluno.id}`) }}
        >
          <Plus size={14} />
          Gerenciar
        </button>
      </div>
    </div>
  )
}

// ── Main TelaPersonal ─────────────────────────────────────────────────────────

function TelaPersonal() {
  const navigate = useNavigate()
  const [alunos, setAlunos] = useState<AlunoEnhanced[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTab, setFilterTab] = useState<'all' | 'ativo' | 'inativo'>('all')
  const [sortMode, setSortMode] = useState<SortMode>('progress_desc')

  const totalAch = templateAchievements.length

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, plan, plan_expires_at')
        .eq('role', 'aluno')

      if (!profiles?.length) { setAlunos([]); setLoading(false); return }

      const now = new Date()
      const todayStr = now.toISOString().split('T')[0]
      const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString()
      const ids = profiles.map(p => p.id)

      const [{ data: achData }, { data: presence }] = await Promise.all([
        supabase.from('achievements').select('user_id, unlocked').in('user_id', ids),
        supabase.from('workout_presence').select('user_id, date, created_at').in('user_id', ids),
      ])

      const todaySet = new Set<string>()
      const weekMap = new Map<string, number>()
      for (const p of presence || []) {
        if (p.date === todayStr) todaySet.add(p.user_id)
        if (p.created_at >= weekAgo) weekMap.set(p.user_id, (weekMap.get(p.user_id) || 0) + 1)
      }

      const formatted: AlunoEnhanced[] = profiles.map(profile => {
        const expired = profile.plan_expires_at && new Date(profile.plan_expires_at) < now
        const aCount = achData?.filter(a => a.user_id === profile.id && a.unlocked).length || 0
        const pct = totalAch > 0 ? Math.round((aCount / totalAch) * 100) : 0
        return {
          id: profile.id,
          name: profile.name || 'Aluno',
          plan: profile.plan || 'Free',
          planStatus: expired ? 'inativo' : 'ativo',
          achievementsCount: aCount,
          totalAchievements: totalAch,
          progressPct: pct,
          trainedToday: todaySet.has(profile.id),
          isHighlight: pct >= 80,
          weekSessions: weekMap.get(profile.id) || 0,
        }
      })

      setAlunos(formatted)
    } catch (err) {
      console.error('Erro ao buscar conquistas:', err)
    } finally {
      setLoading(false)
    }
  }, [totalAch])

  useEffect(() => { load() }, [load])

  // ── Computed KPIs ──────────────────────────────────────────────────────────

  const kpis = useMemo(() => ({
    totalStudents: alunos.length,
    withAchievements: alunos.filter(a => a.achievementsCount > 0).length,
    totalUnlocked: alunos.reduce((s, a) => s + a.achievementsCount, 0),
    avgProgress: alunos.length > 0
      ? Math.round(alunos.reduce((s, a) => s + a.progressPct, 0) / alunos.length)
      : 0,
  }), [alunos])

  // ── Filter + Sort ──────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = alunos.filter(a => {
      const q = searchQuery.toLowerCase()
      return a.name.toLowerCase().includes(q)
    })
    if (filterTab !== 'all') list = list.filter(a => a.planStatus === filterTab)
    list = [...list].sort((a, b) => {
      if (sortMode === 'name') return a.name.localeCompare(b.name, 'pt-BR')
      if (sortMode === 'progress_desc') return b.progressPct - a.progressPct
      if (sortMode === 'progress_asc') return a.progressPct - b.progressPct
      if (sortMode === 'achievements') return b.achievementsCount - a.achievementsCount
      return 0
    })
    return list
  }, [alunos, searchQuery, filterTab, sortMode])

  return (
    <div className="cq-page">

      {/* HERO HEADER */}
      <div className="cq-hero">
        <div className="cq-hero-left">
          <div className="cq-hero-icon">
            <Trophy size={30} />
          </div>
          <div className="cq-hero-text">
            <h1>Gestão de <span>Conquistas</span></h1>
            <p>Acompanhe e desbloqueie a evolução dos seus alunos</p>
          </div>
        </div>
        <div className="cq-hero-actions">
          <button className="cq-btn cq-btn-ghost" onClick={() => navigate('/alunos')}>
            <Users size={15} />
            Alunos
          </button>
          <button className="cq-btn cq-btn-primary" onClick={() => navigate('/conquistas/criar')}>
            <Plus size={15} />
            Nova Conquista Global
          </button>
        </div>
      </div>

      {/* KPI STRIP */}
      <div className="cq-kpi-strip">
        <div className="cq-kpi-card"
          style={{ '--k-bg': 'rgba(139,92,246,0.12)', '--k-color': '#a78bfa', '--k-color2': '#6366f1', '--k-glow': 'rgba(139,92,246,0.12)', '--k-border': 'rgba(139,92,246,0.3)' } as React.CSSProperties}>
          <div className="cq-kpi-icon"><Users size={22} /></div>
          <div>
            <div className="cq-kpi-value">{loading ? '—' : kpis.totalStudents}</div>
            <div className="cq-kpi-label">Alunos cadastrados</div>
          </div>
        </div>

        <div className="cq-kpi-card"
          style={{ '--k-bg': 'rgba(16,185,129,0.12)', '--k-color': '#34d399', '--k-color2': '#10b981', '--k-glow': 'rgba(16,185,129,0.08)', '--k-border': 'rgba(16,185,129,0.3)' } as React.CSSProperties}>
          <div className="cq-kpi-icon"><CheckCircle2 size={22} /></div>
          <div>
            <div className="cq-kpi-value">{loading ? '—' : kpis.withAchievements}</div>
            <div className="cq-kpi-label">Com conquistas ativas</div>
          </div>
        </div>

        <div className="cq-kpi-card"
          style={{ '--k-bg': 'rgba(99,102,241,0.12)', '--k-color': '#818cf8', '--k-color2': '#a78bfa', '--k-glow': 'rgba(99,102,241,0.1)', '--k-border': 'rgba(99,102,241,0.3)' } as React.CSSProperties}>
          <div className="cq-kpi-icon"><Award size={22} /></div>
          <div>
            <div className="cq-kpi-value">{loading ? '—' : kpis.totalUnlocked}</div>
            <div className="cq-kpi-label">Conquistas desbloqueadas</div>
          </div>
        </div>

        <div className="cq-kpi-card"
          style={{ '--k-bg': 'rgba(6,182,212,0.12)', '--k-color': '#22d3ee', '--k-color2': '#38bdf8', '--k-glow': 'rgba(6,182,212,0.1)', '--k-border': 'rgba(6,182,212,0.3)' } as React.CSSProperties}>
          <div className="cq-kpi-icon"><BarChart2 size={22} /></div>
          <div>
            <div className="cq-kpi-value">{loading ? '—' : `${kpis.avgProgress}%`}</div>
            <div className="cq-kpi-label">Taxa média de progresso</div>
            <div className="cq-kpi-bar-wrap">
              <div className="cq-kpi-bar-fill" style={{ width: `${loading ? 0 : kpis.avgProgress}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="cq-toolbar">
        <div className="cq-search">
          <Search size={14} />
          <input
            placeholder="Buscar aluno..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="cq-filter-tabs">
          {([['all','Todos'],['ativo','Ativos'],['inativo','Inativos']] as const).map(([tab,label]) => (
            <button
              key={tab}
              className={`cq-filter-tab ${filterTab === tab ? 'active' : ''}`}
              onClick={() => setFilterTab(tab)}
            >
              {label}
            </button>
          ))}
        </div>

        <select
          className="cq-sort-select"
          value={sortMode}
          onChange={e => setSortMode(e.target.value as SortMode)}
        >
          <option value="progress_desc">Maior progresso</option>
          <option value="progress_asc">Menor progresso</option>
          <option value="achievements">Mais conquistas</option>
          <option value="name">Nome A–Z</option>
        </select>
      </div>

      {/* STUDENT CARDS */}
      {loading ? (
        <div className="cq-students-grid">
          {[1,2,3,4,5,6].map(i => <CQSkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="cq-empty">
          <Trophy size={48} />
          <h3>{searchQuery ? 'Nenhum resultado encontrado' : 'Nenhum aluno cadastrado'}</h3>
          <p>{searchQuery ? 'Tente outro nome ou ajuste os filtros.' : 'Adicione alunos para começar a gerenciar conquistas.'}</p>
        </div>
      ) : (
        <div className="cq-students-grid">
          {filtered.map(aluno => (
            <CQStudentCard key={aluno.id} aluno={aluno} navigate={navigate} />
          ))}
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
