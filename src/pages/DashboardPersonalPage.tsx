import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import {
  Users,
  Dumbbell,
  TrendingUp,
  Activity,
  Plus,
  Search,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Clock,
  Zap,
  MessageCircle,
  Target,
  BarChart2,
  UserPlus,
} from 'lucide-react'
import './DashboardPersonal.css'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Student {
  id: string
  name: string
  email: string
  plan: string
  plan_expires_at: string | null
  created_at: string
  status: 'ativo' | 'inativo'
  lastWorkout: string | null
  daysSinceWorkout: number | null
  needsAttention: boolean
  trainedToday: boolean
}

interface WorkoutItem {
  id: string
  name: string
  level: string | null
  exerciseCount: number
  created_at: string
}

interface ActivityEntry {
  id: string
  type: 'completed' | 'started'
  studentName: string
  workoutName: string
  createdAt: string
}

interface KpiData {
  totalStudents: number
  activeStudents: number
  totalWorkouts: number
  trainedToday: number
  trainedThisWeek: number
  activePercent: number
}

type FilterTab = 'all' | 'ativo' | 'inativo' | 'atencao'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}min atrás`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h atrás`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'ontem'
  return `${days}d atrás`
}

function getLevelKey(level: string | null): 'ini' | 'int' | 'adv' {
  if (!level) return 'ini'
  const l = level.toLowerCase()
  if (l.includes('avan')) return 'adv'
  if (l.includes('inter') || l.includes('médio') || l.includes('medio')) return 'int'
  return 'ini'
}

function getLevelText(level: string | null): string {
  const k = getLevelKey(level)
  return k === 'adv' ? 'Avançado' : k === 'int' ? 'Intermediário' : 'Iniciante'
}

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #8b5cf6, #6366f1)',
  'linear-gradient(135deg, #06b6d4, #0284c7)',
  'linear-gradient(135deg, #10b981, #059669)',
  'linear-gradient(135deg, #f59e0b, #d97706)',
  'linear-gradient(135deg, #ec4899, #db2777)',
  'linear-gradient(135deg, #6366f1, #8b5cf6)',
]

function getAvatarGradient(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length]
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonStudents() {
  return (
    <>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="pt-skel-row">
          <div className="pt-skel" style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="pt-skel" style={{ height: 13, width: '50%' }} />
            <div className="pt-skel" style={{ height: 10, width: '30%' }} />
          </div>
          <div className="pt-skel" style={{ height: 24, width: 60, borderRadius: 999 }} />
        </div>
      ))}
    </>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KpiProps {
  icon: React.ReactNode
  label: string
  value: string | number
  badge?: string
  badgeType?: 'up' | 'down' | 'neutral' | 'warn'
  iconColor: string
  iconBg: string
  glowColor: string
  accentColor: string
  delay: number
}

function KpiCard({ icon, label, value, badge, badgeType = 'neutral', iconColor, iconBg, glowColor, accentColor, delay }: KpiProps) {
  return (
    <div
      className="pt-kpi-card"
      style={{
        '--card-icon-bg': iconBg,
        '--card-icon-color': iconColor,
        '--card-glow': glowColor,
        '--card-accent': accentColor,
        animationDelay: `${delay}ms`,
      } as React.CSSProperties}
    >
      <div className="pt-kpi-glow" />
      <div className="pt-kpi-top">
        <div className="pt-kpi-icon">{icon}</div>
        {badge && (
          <span className={`pt-kpi-badge ${badgeType}`}>
            {badge}
          </span>
        )}
      </div>
      <div>
        <div className="pt-kpi-value">{value}</div>
        <div className="pt-kpi-label">{label}</div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DashboardPersonalPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [kpis, setKpis] = useState<KpiData>({
    totalStudents: 0, activeStudents: 0, totalWorkouts: 0,
    trainedToday: 0, trainedThisWeek: 0, activePercent: 0,
  })
  const [students, setStudents] = useState<Student[]>([])
  const [workouts, setWorkouts] = useState<WorkoutItem[]>([])
  const [activity, setActivity] = useState<ActivityEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<FilterTab>('all')

  // ── Data loading ─────────────────────────────────────────────────────────────

  const loadStudents = useCallback(async () => {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, email, plan, plan_expires_at, created_at')
      .eq('role', 'aluno')
      .order('created_at', { ascending: false })

    if (!profiles) return

    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]
    const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString()
    const studentIds = profiles.map(p => p.id)

    const { data: allPresence } = await supabase
      .from('workout_presence')
      .select('user_id, date, created_at')
      .in('user_id', studentIds)
      .order('date', { ascending: false })

    const trainedTodaySet = new Set<string>()
    const trainedWeekSet = new Set<string>()
    const lastWorkoutMap = new Map<string, string>()

    for (const p of allPresence || []) {
      if (!lastWorkoutMap.has(p.user_id)) lastWorkoutMap.set(p.user_id, p.date)
      if (p.date === todayStr) trainedTodaySet.add(p.user_id)
      if (p.created_at >= weekAgo) trainedWeekSet.add(p.user_id)
    }

    const formatted: Student[] = profiles.map(profile => {
      const expired = profile.plan_expires_at && new Date(profile.plan_expires_at) < now
      const status: 'ativo' | 'inativo' = expired ? 'inativo' : 'ativo'
      const lastW = lastWorkoutMap.get(profile.id) ?? null
      let daysSince: number | null = null
      if (lastW) {
        daysSince = Math.floor((now.getTime() - new Date(lastW).getTime()) / 86400000)
      }

      return {
        id: profile.id,
        name: profile.name || 'Aluno',
        email: profile.email || '',
        plan: profile.plan || 'free',
        plan_expires_at: profile.plan_expires_at,
        created_at: profile.created_at,
        status,
        lastWorkout: lastW,
        daysSinceWorkout: daysSince,
        needsAttention: daysSince !== null && daysSince > 7,
        trainedToday: trainedTodaySet.has(profile.id),
      }
    })

    setStudents(formatted)

    const activeCount = formatted.filter(s => s.status === 'ativo').length
    setKpis(prev => ({
      ...prev,
      totalStudents: formatted.length,
      activeStudents: activeCount,
      trainedToday: trainedTodaySet.size,
      trainedThisWeek: trainedWeekSet.size,
      activePercent: formatted.length > 0 ? Math.round((activeCount / formatted.length) * 100) : 0,
    }))
  }, [])

  const loadWorkouts = useCallback(async () => {
    if (!user) return

    const { data: wData } = await supabase
      .from('workouts')
      .select('id, name, level, created_at')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })
      .limit(6)

    if (!wData) return

    const enriched: WorkoutItem[] = []
    for (const w of wData) {
      const { count } = await supabase
        .from('workout_plans')
        .select('*', { count: 'exact', head: true })
        .eq('workout_id', w.id)
      enriched.push({ id: w.id, name: w.name, level: w.level ?? null, exerciseCount: count ?? 0, created_at: w.created_at })
    }
    setWorkouts(enriched)

    const { count: total } = await supabase
      .from('workouts')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', user.id)
    setKpis(prev => ({ ...prev, totalWorkouts: total ?? wData.length }))
  }, [user])

  const loadActivity = useCallback(async () => {
    const { data: sessions } = await supabase
      .from('workout_sessions')
      .select('id, status, started_at, completed_at, user_id, workout_id')
      .in('status', ['completed', 'in_progress'])
      .order('started_at', { ascending: false })
      .limit(20)

    if (!sessions?.length) return

    const userIds = [...new Set(sessions.map(s => s.user_id))]
    const workoutIds = [...new Set(sessions.map(s => s.workout_id))]
    const [{ data: pData }, { data: wData }] = await Promise.all([
      supabase.from('profiles').select('id, name').in('id', userIds),
      supabase.from('workouts').select('id, name').in('id', workoutIds),
    ])

    const pm = new Map((pData || []).map(p => [p.id, p.name]))
    const wm = new Map((wData || []).map(w => [w.id, w.name]))

    setActivity(sessions.slice(0, 12).map(s => ({
      id: s.id,
      type: s.status === 'completed' ? 'completed' : 'started',
      studentName: pm.get(s.user_id) || 'Aluno',
      workoutName: wm.get(s.workout_id) || 'Treino',
      createdAt: s.completed_at || s.started_at,
    })))
  }, [])

  const loadAll = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      await Promise.all([loadStudents(), loadWorkouts(), loadActivity()])
    } finally {
      setLoading(false)
    }
  }, [user, loadStudents, loadWorkouts, loadActivity])

  useEffect(() => { loadAll() }, [loadAll])

  // ── Filtered students ─────────────────────────────────────────────────────────

  const filtered = students.filter(s => {
    const q = searchQuery.toLowerCase()
    const matchSearch = s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
    const matchTab =
      activeTab === 'all' ||
      (activeTab === 'atencao' && s.needsAttention) ||
      s.status === activeTab
    return matchSearch && matchTab
  })

  const attentionCount = students.filter(s => s.needsAttention).length

  // ─── Greeting ────────────────────────────────────────────────────────────────

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'
  const displayName = user?.email?.split('@')[0] || 'Personal'

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="pt-dashboard">

      {/* WELCOME BANNER */}
      <div className="pt-welcome">
        <div className="pt-welcome-left">
          <h1>{greeting}, <span>{displayName}</span> 👋</h1>
          <p>
            {loading
              ? 'Carregando seus dados...'
              : `Você tem ${kpis.totalStudents} aluno${kpis.totalStudents !== 1 ? 's' : ''} — ${kpis.trainedToday} treinou${kpis.trainedToday !== 1 ? 'ram' : ''} hoje.`}
          </p>
        </div>
        <div className="pt-quick-actions">
          <button className="pt-btn pt-btn-ghost" onClick={() => navigate('/alunos')}>
            <Users size={15} />
            Alunos
          </button>
          <button className="pt-btn pt-btn-violet" onClick={() => navigate('/treinos/criar')}>
            <Plus size={15} />
            Novo Treino
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="pt-kpi-grid">
        <KpiCard
          icon={<Users size={21} />}
          label="Alunos ativos"
          value={kpis.activeStudents}
          badge={`${kpis.activePercent}%`}
          badgeType={kpis.activePercent >= 70 ? 'up' : 'warn'}
          iconColor="#a78bfa"
          iconBg="rgba(139,92,246,0.12)"
          glowColor="rgba(139,92,246,0.15)"
          accentColor="rgba(139,92,246,0.3)"
          delay={0}
        />
        <KpiCard
          icon={<Dumbbell size={21} />}
          label="Treinos criados"
          value={kpis.totalWorkouts}
          iconColor="#818cf8"
          iconBg="rgba(99,102,241,0.12)"
          glowColor="rgba(99,102,241,0.15)"
          accentColor="rgba(99,102,241,0.3)"
          delay={60}
        />
        <KpiCard
          icon={<Activity size={21} />}
          label="Treinaram hoje"
          value={kpis.trainedToday}
          badge={`${kpis.trainedThisWeek} semana`}
          badgeType={kpis.trainedToday > 0 ? 'up' : 'neutral'}
          iconColor="#22d3ee"
          iconBg="rgba(6,182,212,0.12)"
          glowColor="rgba(6,182,212,0.15)"
          accentColor="rgba(6,182,212,0.3)"
          delay={120}
        />
        <KpiCard
          icon={<AlertTriangle size={21} />}
          label="Precisam de atenção"
          value={attentionCount}
          badge={attentionCount > 0 ? '+7 dias' : '—'}
          badgeType={attentionCount > 0 ? 'warn' : 'neutral'}
          iconColor="#fbbf24"
          iconBg="rgba(245,158,11,0.12)"
          glowColor="rgba(245,158,11,0.12)"
          accentColor="rgba(245,158,11,0.3)"
          delay={180}
        />
      </div>

      {/* MAIN GRID: students left, right column right */}
      <div className="pt-main-grid">

        {/* STUDENTS CARD */}
        <div className="pt-card" style={{ animationDelay: '0.1s' }}>
          <div className="pt-card-header">
            <div className="pt-card-title">
              <div className="pt-card-icon" style={{ background: 'rgba(139,92,246,0.1)', color: '#a78bfa' }}>
                <Users size={17} />
              </div>
              <div className="pt-card-title-text">
                <h2>Seus Alunos</h2>
                {!loading && <span>{filtered.length} de {students.length}</span>}
              </div>
            </div>
            <button className="pt-link-btn" onClick={() => navigate('/alunos')}>
              Ver todos <ArrowUpRight size={13} />
            </button>
          </div>

          <div className="pt-card-body">
            {/* Toolbar */}
            <div className="pt-toolbar">
              <div className="pt-searchbox">
                <Search size={14} />
                <input
                  placeholder="Buscar por nome..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="pt-filter-tabs">
                {([
                  ['all', 'Todos'],
                  ['ativo', 'Ativos'],
                  ['inativo', 'Inativos'],
                  ['atencao', '⚡ Atenção'],
                ] as [FilterTab, string][]).map(([tab, label]) => (
                  <button
                    key={tab}
                    className={`pt-filter-tab ${activeTab === tab ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="pt-student-list">
              {loading ? (
                <SkeletonStudents />
              ) : filtered.length === 0 ? (
                <div className="pt-empty">
                  <Users size={36} />
                  <p>Nenhum aluno encontrado</p>
                  <small>Ajuste a busca ou filtro</small>
                </div>
              ) : (
                filtered.map(student => (
                  <div
                    key={student.id}
                    className={`pt-student-row${student.needsAttention ? ' needs-attention' : ''}`}
                  >
                    {/* Avatar */}
                    <div
                      className={`pt-avatar${student.trainedToday ? ' pt-avatar-online' : ''}`}
                      style={{ background: getAvatarGradient(student.name) }}
                    >
                      {student.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="pt-student-info">
                      <div className="pt-student-name">{student.name}</div>
                      <div className="pt-student-sub">
                        <Clock size={11} />
                        {student.lastWorkout
                          ? student.daysSinceWorkout === 0
                            ? 'Treinou hoje'
                            : `${student.daysSinceWorkout}d sem treinar`
                          : 'Sem histórico'}
                      </div>
                    </div>

                    {/* Status + action */}
                    <div className="pt-student-actions">
                      {student.needsAttention ? (
                        <span className="pt-chip pt-chip-warn">
                          <AlertTriangle size={9} />
                          Atenção
                        </span>
                      ) : student.trainedToday ? (
                        <span className="pt-chip pt-chip-active">
                          <CheckCircle2 size={9} />
                          Hoje
                        </span>
                      ) : (
                        <span className={`pt-chip ${student.status === 'ativo' ? 'pt-chip-active' : 'pt-chip-inactive'}`}>
                          {student.status === 'ativo' ? 'Ativo' : 'Inativo'}
                        </span>
                      )}
                      <button
                        className="pt-btn pt-btn-ghost pt-btn-sm"
                        onClick={() => navigate('/alunos')}
                      >
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="pt-right-col">

          {/* ENGAGEMENT */}
          <div className="pt-card" style={{ animationDelay: '0.15s' }}>
            <div className="pt-card-header">
              <div className="pt-card-title">
                <div className="pt-card-icon" style={{ background: 'rgba(6,182,212,0.1)', color: '#22d3ee' }}>
                  <TrendingUp size={17} />
                </div>
                <div className="pt-card-title-text">
                  <h2>Engajamento</h2>
                  <span>Visão semanal</span>
                </div>
              </div>
            </div>
            <div className="pt-card-body">
              <div className="pt-engage-list">
                {/* Today */}
                <div className="pt-engage-row">
                  <div className="pt-engage-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                    <Activity size={18} />
                  </div>
                  <div className="pt-engage-info">
                    <div className="pt-engage-value" style={{ color: '#34d399' }}>{kpis.trainedToday}</div>
                    <div className="pt-engage-label">treinaram hoje</div>
                  </div>
                </div>
                {/* Week */}
                <div className="pt-engage-row">
                  <div className="pt-engage-icon" style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>
                    <Zap size={18} />
                  </div>
                  <div className="pt-engage-info">
                    <div className="pt-engage-value" style={{ color: '#818cf8' }}>{kpis.trainedThisWeek}</div>
                    <div className="pt-engage-label">sessões na semana</div>
                  </div>
                </div>
                {/* Active % */}
                <div className="pt-engage-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.625rem' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div className="pt-engage-icon" style={{ background: 'rgba(139,92,246,0.1)', color: '#a78bfa' }}>
                      <Users size={18} />
                    </div>
                    <div className="pt-engage-info">
                      <div className="pt-engage-value" style={{ color: '#a78bfa' }}>{kpis.activePercent}%</div>
                      <div className="pt-engage-label">{kpis.activeStudents}/{kpis.totalStudents} alunos ativos</div>
                    </div>
                  </div>
                  <div className="pt-progress-track">
                    <div className="pt-progress-fill" style={{ width: `${kpis.activePercent}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ACTIVITY FEED */}
          <div className="pt-card" style={{ animationDelay: '0.2s', flex: 1 }}>
            <div className="pt-card-header">
              <div className="pt-card-title">
                <div className="pt-card-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                  <Clock size={17} />
                </div>
                <div className="pt-card-title-text">
                  <h2>Atividade Recente</h2>
                  <span>Últimas ações</span>
                </div>
              </div>
            </div>
            <div className="pt-card-body">
              <div className="pt-feed">
                {loading ? (
                  [...Array(4)].map((_, i) => (
                    <div key={i} className="pt-feed-item">
                      <div className="pt-skel" style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 5 }} />
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                        <div className="pt-skel" style={{ height: 11, width: '80%' }} />
                        <div className="pt-skel" style={{ height: 9, width: '45%' }} />
                      </div>
                    </div>
                  ))
                ) : activity.length === 0 ? (
                  <div className="pt-empty" style={{ padding: '1.5rem 0' }}>
                    <Activity size={28} />
                    <p>Nenhuma atividade</p>
                  </div>
                ) : (
                  activity.map(entry => (
                    <div key={entry.id} className="pt-feed-item">
                      <div className="pt-feed-dot-col">
                        <div className={`pt-feed-dot ${entry.type}`} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="pt-feed-text">
                          <strong>{entry.studentName}</strong>{' '}
                          {entry.type === 'completed'
                            ? <span className="verb-done">concluiu </span>
                            : <span className="verb-start">iniciou </span>}
                          <strong>{entry.workoutName}</strong>
                        </div>
                        <div className="pt-feed-time">{timeAgo(entry.createdAt)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* WORKOUTS SECTION */}
      <div className="pt-card" style={{ animationDelay: '0.25s' }}>
        <div className="pt-card-header">
          <div className="pt-card-title">
            <div className="pt-card-icon" style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>
              <Dumbbell size={17} />
            </div>
            <div className="pt-card-title-text">
              <h2>Treinos Criados</h2>
              {!loading && <span>{kpis.totalWorkouts} no total</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="pt-link-btn" onClick={() => navigate('/treinos')}>
              Ver todos <ArrowUpRight size={13} />
            </button>
            <button className="pt-btn pt-btn-violet pt-btn-sm" onClick={() => navigate('/treinos/criar')}>
              <Plus size={13} /> Criar
            </button>
          </div>
        </div>

        <div className="pt-card-body">
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '0.625rem' }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="pt-skel" style={{ height: 100, borderRadius: '0.875rem' }} />
              ))}
            </div>
          ) : workouts.length === 0 ? (
            <div className="pt-empty">
              <Dumbbell size={36} />
              <p>Nenhum treino criado ainda</p>
              <button className="pt-btn pt-btn-violet" style={{ marginTop: '0.5rem' }} onClick={() => navigate('/treinos/criar')}>
                <Plus size={14} /> Criar primeiro treino
              </button>
            </div>
          ) : (
            <div className="pt-workouts-grid">
              {workouts.map(w => (
                <div
                  key={w.id}
                  className="pt-workout-card"
                  onClick={() => navigate(`/treinos/${w.id}`)}
                >
                  <div className="pt-workout-card-top">
                    <div className="pt-workout-thumb">
                      <Dumbbell size={17} />
                    </div>
                    <span className={`pt-level pt-level-${getLevelKey(w.level)}`}>
                      {getLevelText(w.level)}
                    </span>
                  </div>
                  <div className="pt-workout-name">{w.name}</div>
                  <div className="pt-workout-meta">
                    <span className="pt-workout-stat">
                      <Target size={11} />
                      {w.exerciseCount} exercício{w.exerciseCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* QUICK ACTIONS BAR */}
      <div className="pt-quick-bar">
        {([
          { label: 'Novo Aluno', icon: <UserPlus size={20} />, path: '/alunos', color: '#a78bfa', bg: 'rgba(139,92,246,0.1)' },
          { label: 'Novo Treino', icon: <Plus size={20} />, path: '/treinos/criar', color: '#818cf8', bg: 'rgba(99,102,241,0.1)' },
          { label: 'Ver Evolução', icon: <BarChart2 size={20} />, path: '/financeiro', color: '#22d3ee', bg: 'rgba(6,182,212,0.1)' },
          { label: 'Abrir Chat', icon: <MessageCircle size={20} />, path: '/chat', color: '#34d399', bg: 'rgba(16,185,129,0.1)' },
        ] as const).map(item => (
          <button
            key={item.path}
            className="pt-quick-btn"
            style={{ '--q-color': item.color, '--q-bg': item.bg } as React.CSSProperties}
            onClick={() => navigate(item.path)}
          >
            <div className="pt-quick-btn-icon">{item.icon}</div>
            <span className="pt-quick-btn-label">{item.label}</span>
          </button>
        ))}
      </div>

    </div>
  )
}
