import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  Search,
  Users,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  UserPlus,
  Eye,
  Crown,
  Zap,
  ArrowUpDown,
  Filter,
} from 'lucide-react'
import './Alunos.css'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Aluno {
  id: string
  name: string
  email: string
  plan: string
  planStatus: 'active' | 'expired' | 'trial'
  planLabel: string
  created_at: string
  status: 'ativo' | 'inativo'
  lastWorkoutDate: string | null
  lastWorkoutName: string | null
  daysSince: number | null
  needsAttention: boolean
  trainedToday: boolean
}

type FilterTab = 'all' | 'ativo' | 'inativo' | 'atencao'
type SortKey = 'name' | 'lastWorkout' | 'plan' | 'status'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#8b5cf6,#6366f1)',
  'linear-gradient(135deg,#06b6d4,#0284c7)',
  'linear-gradient(135deg,#10b981,#059669)',
  'linear-gradient(135deg,#f59e0b,#d97706)',
  'linear-gradient(135deg,#ec4899,#db2777)',
  'linear-gradient(135deg,#6366f1,#8b5cf6)',
]

function avatarGradient(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_GRADIENTS[Math.abs(h) % AVATAR_GRADIENTS.length]
}

function getPlanChipClass(plan: string) {
  const p = plan.toLowerCase()
  if (p.includes('premium')) return 'al-chip-plan-premium'
  if (p.includes('basic') || p.includes('básic')) return 'al-chip-plan-basic'
  if (p.includes('trial') || p.includes('trial')) return 'al-chip-plan-trial'
  return 'al-chip-plan-free'
}

function getPlanIcon(plan: string) {
  const p = plan.toLowerCase()
  if (p.includes('premium')) return <Crown size={10} />
  if (p.includes('basic') || p.includes('básic')) return <Zap size={10} />
  return null
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <>
      {[...Array(6)].map((_, i) => (
        <tr key={i} className="al-skel-row">
          <td>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
              <div className="al-skel" style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div className="al-skel" style={{ height: 12, width: 120 }} />
                <div className="al-skel" style={{ height: 10, width: 80 }} />
              </div>
            </div>
          </td>
          <td><div className="al-skel" style={{ height: 22, width: 60, borderRadius: 999 }} /></td>
          <td className="col-plan"><div className="al-skel" style={{ height: 22, width: 70, borderRadius: 999 }} /></td>
          <td className="col-workout">
            <div className="al-skel" style={{ height: 12, width: 100, marginBottom: 4 }} />
            <div className="al-skel" style={{ height: 9, width: 60 }} />
          </td>
          <td className="col-date"><div className="al-skel" style={{ height: 12, width: 80 }} /></td>
          <td />
        </tr>
      ))}
    </>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AlunosPage() {
  const navigate = useNavigate()

  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [sortKey, setSortKey] = useState<SortKey>('name')

  // ── Load ────────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('id, name, email, plan, plan_expires_at, created_at')
        .eq('role', 'aluno')
        .order('name', { ascending: true })

      if (pErr) throw pErr
      if (!profiles?.length) { setAlunos([]); setLoading(false); return }

      const now = new Date()
      const todayStr = now.toISOString().split('T')[0]
      const ids = profiles.map(p => p.id)

      // Fetch presence (last workout dates)
      const { data: presence } = await supabase
        .from('workout_presence')
        .select('user_id, date, workout_id')
        .in('user_id', ids)
        .order('date', { ascending: false })

      // Fetch workout names for last session
      const workoutIds = [...new Set((presence || []).map(p => p.workout_id).filter(Boolean))]
      let workoutNameMap = new Map<string, string>()
      if (workoutIds.length > 0) {
        const { data: wNames } = await supabase
          .from('workouts')
          .select('id, name')
          .in('id', workoutIds)
        for (const w of wNames || []) workoutNameMap.set(w.id, w.name)
      }

      // Map last workout per student
      const lastWorkoutDate = new Map<string, string>()
      const lastWorkoutId   = new Map<string, string>()
      const trainedTodaySet = new Set<string>()

      for (const p of presence || []) {
        if (!lastWorkoutDate.has(p.user_id)) {
          lastWorkoutDate.set(p.user_id, p.date)
          lastWorkoutId.set(p.user_id, p.workout_id)
        }
        if (p.date === todayStr) trainedTodaySet.add(p.user_id)
      }

      // Plan label map
      const { data: dbPlans } = await supabase.from('planos').select('nome')
      const plansMap = new Map((dbPlans || []).map(p => [p.nome.toLowerCase(), p.nome]))

      const formatted: Aluno[] = profiles.map(profile => {
        const planStr = profile.plan || 'free'
        const planDisplayName = plansMap.get(planStr.toLowerCase()) || (planStr === 'free' ? 'Free' : planStr)

        const planStatus: 'active' | 'expired' | 'trial' = profile.plan_expires_at
          ? (new Date(profile.plan_expires_at) > now ? 'active' : 'expired')
          : 'active'

        const status: 'ativo' | 'inativo' = planStatus === 'expired' ? 'inativo' : 'ativo'

        const lastD = lastWorkoutDate.get(profile.id) ?? null
        const lastWId = lastWorkoutId.get(profile.id) ?? null
        const lastWName = lastWId ? (workoutNameMap.get(lastWId) ?? null) : null

        let daysSince: number | null = null
        if (lastD) daysSince = Math.floor((now.getTime() - new Date(lastD).getTime()) / 86400000)

        return {
          id: profile.id,
          name: profile.name || 'Aluno',
          email: profile.email || '',
          plan: planStr,
          planStatus,
          planLabel: planDisplayName,
          created_at: profile.created_at,
          status,
          lastWorkoutDate: lastD,
          lastWorkoutName: lastWName,
          daysSince,
          needsAttention: daysSince !== null && daysSince > 7,
          trainedToday: trainedTodaySet.has(profile.id),
        }
      })

      setAlunos(formatted)
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar alunos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // ── Computed metrics ────────────────────────────────────────────────────────

  const totalActive    = alunos.filter(a => a.status === 'ativo').length
  const trainedToday   = alunos.filter(a => a.trainedToday).length
  const needAttention  = alunos.filter(a => a.needsAttention).length

  // ── Filter + sort ───────────────────────────────────────────────────────────

  const filtered = alunos
    .filter(a => {
      const q = searchQuery.toLowerCase()
      const matchQ = a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q)
      const matchTab =
        activeTab === 'all'     ||
        (activeTab === 'atencao'  && a.needsAttention) ||
        a.status === activeTab
      return matchQ && matchTab
    })
    .sort((a, b) => {
      if (sortKey === 'name')        return a.name.localeCompare(b.name, 'pt-BR')
      if (sortKey === 'lastWorkout') return (b.daysSince ?? 9999) - (a.daysSince ?? 9999)
      if (sortKey === 'status')      return a.status.localeCompare(b.status)
      return 0
    })

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="alunos-page">

      {/* PAGE HEADER */}
      <div className="alunos-page-header">
        <div className="alunos-page-title">
          <h1>Meus <span>Alunos</span></h1>
          <p>{loading ? 'Carregando...' : `${alunos.length} aluno${alunos.length !== 1 ? 's' : ''} cadastrados`}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.625rem' }}>
          <button className="al-btn al-btn-ghost" onClick={() => navigate('/')}>
            Dashboard
          </button>
          <button className="al-btn al-btn-violet" onClick={() => navigate('/chat')}>
            <UserPlus size={15} />
            Convidar Aluno
          </button>
        </div>
      </div>

      {/* KPI STRIP */}
      <div className="alunos-kpi-strip">
        <div
          className="alunos-kpi-card"
          style={{ '--kc': 'rgba(139,92,246,0.3)', '--kglow': 'rgba(139,92,246,0.1)', '--ki-bg': 'rgba(139,92,246,0.12)', '--ki-color': '#a78bfa' } as React.CSSProperties}
        >
          <div className="al-kpi-icon"><Users size={22} /></div>
          <div className="al-kpi-data">
            <div className="al-kpi-value">{loading ? '—' : alunos.length}</div>
            <div className="al-kpi-label">Total de alunos</div>
          </div>
        </div>

        <div
          className="alunos-kpi-card"
          style={{ '--kc': 'rgba(16,185,129,0.3)', '--kglow': 'rgba(16,185,129,0.08)', '--ki-bg': 'rgba(16,185,129,0.12)', '--ki-color': '#34d399' } as React.CSSProperties}
        >
          <div className="al-kpi-icon"><CheckCircle2 size={22} /></div>
          <div className="al-kpi-data">
            <div className="al-kpi-value">{loading ? '—' : totalActive}</div>
            <div className="al-kpi-label">Alunos ativos</div>
          </div>
        </div>

        <div
          className="alunos-kpi-card"
          style={{ '--kc': 'rgba(6,182,212,0.3)', '--kglow': 'rgba(6,182,212,0.08)', '--ki-bg': 'rgba(6,182,212,0.12)', '--ki-color': '#22d3ee' } as React.CSSProperties}
        >
          <div className="al-kpi-icon"><Activity size={22} /></div>
          <div className="al-kpi-data">
            <div className="al-kpi-value">{loading ? '—' : trainedToday}</div>
            <div className="al-kpi-label">Treinaram hoje</div>
          </div>
        </div>

        <div
          className="alunos-kpi-card"
          style={{ '--kc': 'rgba(245,158,11,0.3)', '--kglow': 'rgba(245,158,11,0.08)', '--ki-bg': 'rgba(245,158,11,0.12)', '--ki-color': '#fbbf24' } as React.CSSProperties}
        >
          <div className="al-kpi-icon"><AlertTriangle size={22} /></div>
          <div className="al-kpi-data">
            <div className="al-kpi-value">{loading ? '—' : needAttention}</div>
            <div className="al-kpi-label">Precisam de atenção</div>
          </div>
        </div>
      </div>

      {/* ATTENTION BANNER */}
      {!loading && needAttention > 0 && (
        <div className="alunos-alert-banner">
          <AlertTriangle size={18} />
          <div>
            <strong>{needAttention} aluno{needAttention !== 1 ? 's' : ''}</strong>{' '}
            <span>sem treinar há mais de 7 dias. Considere entrar em contato.</span>
          </div>
        </div>
      )}

      {/* MAIN TABLE CARD */}
      <div className="alunos-main-card">

        {/* TOOLBAR */}
        <div className="alunos-toolbar">
          <div className="alunos-toolbar-left">
            <h2>Lista de Alunos</h2>
            {!loading && <span>{filtered.length} de {alunos.length} exibidos</span>}
          </div>
          <div className="alunos-toolbar-right">
            {/* Search */}
            <div className="al-search">
              <Search size={14} />
              <input
                placeholder="Buscar por nome..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filter tabs */}
            <div className="al-filter-tabs">
              {([
                ['all',     'Todos'],
                ['ativo',   'Ativos'],
                ['inativo', 'Inativos'],
                ['atencao', '⚡ Atenção'],
              ] as [FilterTab, string][]).map(([tab, label]) => (
                <button
                  key={tab}
                  className={`al-filter-tab ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Sort */}
            <select
              className="al-sort-select"
              value={sortKey}
              onChange={e => setSortKey(e.target.value as SortKey)}
            >
              <option value="name">↑ Nome</option>
              <option value="lastWorkout">Último treino</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>

        {/* TABLE */}
        <div className="alunos-table-wrap">
          <table className="alunos-table">
            <thead>
              <tr>
                <th>Aluno</th>
                <th>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Filter size={11} /> Status
                  </span>
                </th>
                <th className="col-plan">
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Crown size={11} /> Plano
                  </span>
                </th>
                <th className="col-workout">
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <ArrowUpDown size={11} /> Último treino
                  </span>
                </th>
                <th className="col-date">
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={11} /> Cadastro
                  </span>
                </th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <TableSkeleton />
              ) : error ? (
                <tr>
                  <td colSpan={6}>
                    <div className="alunos-empty-state">
                      <AlertTriangle size={36} />
                      <p>Erro ao carregar alunos</p>
                      <small>{error}</small>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="alunos-empty-state">
                      <Users size={40} />
                      <p>{searchQuery ? 'Nenhum aluno encontrado' : 'Nenhum aluno cadastrado'}</p>
                      <small>{searchQuery ? 'Tente outro nome ou ajuste o filtro.' : 'Convide alunos para começar.'}</small>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(aluno => (
                  <tr
                    key={aluno.id}
                    className={aluno.needsAttention ? 'row-attention' : ''}
                    onClick={() => navigate(`/alunos/${aluno.id}`)}
                  >
                    {/* Identity */}
                    <td>
                      <div className="al-student-identity">
                        <div
                          className={`al-avatar${aluno.trainedToday ? ' al-avatar-online' : ''}${aluno.needsAttention ? ' al-avatar-warn' : ''}`}
                          style={{ background: avatarGradient(aluno.name) }}
                        >
                          {aluno.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="al-student-info">
                          <div className="al-student-name">{aluno.name}</div>
                          <div className="al-student-sub">
                            {aluno.email || 'Sem e-mail'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td>
                      {aluno.needsAttention ? (
                        <span className="al-chip al-chip-warn">
                          <AlertTriangle size={9} />
                          Sem treinar {aluno.daysSince}d
                        </span>
                      ) : aluno.trainedToday ? (
                        <span className="al-chip al-chip-active">
                          <CheckCircle2 size={9} />
                          Treinou hoje
                        </span>
                      ) : (
                        <span className={`al-chip ${aluno.status === 'ativo' ? 'al-chip-active' : 'al-chip-inactive'}`}>
                          {aluno.status === 'ativo' ? 'Ativo' : 'Inativo'}
                        </span>
                      )}
                    </td>

                    {/* Plan */}
                    <td className="col-plan">
                      <span className={`al-chip ${getPlanChipClass(aluno.plan)}`}>
                        {getPlanIcon(aluno.plan)}
                        {aluno.planLabel}
                      </span>
                    </td>

                    {/* Last workout */}
                    <td className="col-workout">
                      {aluno.lastWorkoutDate ? (
                        <div className="al-last-workout">
                          <div className="al-last-workout-name">
                            {aluno.lastWorkoutName || 'Treino'}
                          </div>
                          <div className="al-last-workout-date">
                            {aluno.daysSince === 0
                              ? 'hoje'
                              : aluno.daysSince === 1
                              ? 'ontem'
                              : `há ${aluno.daysSince} dias`}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.8rem' }}>
                          Sem histórico
                        </span>
                      )}
                    </td>

                    {/* Created at */}
                    <td className="col-date" style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem' }}>
                      {formatDate(aluno.created_at)}
                    </td>

                    {/* Actions */}
                    <td onClick={e => e.stopPropagation()}>
                      <div className="al-row-actions">
                        <button
                          className="al-btn al-btn-ghost al-btn-sm"
                          onClick={() => navigate('/chat')}
                          title="Abrir chat"
                        >
                          Chat
                        </button>
                        <button
                          className="al-btn al-btn-violet al-btn-sm"
                          onClick={() => navigate(`/alunos/${aluno.id}`)}
                          title="Ver ficha do aluno"
                        >
                          <Eye size={12} />
                          Ver ficha
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* TABLE FOOTER */}
        {!loading && filtered.length > 0 && (
          <div className="alunos-footer">
            <span>Mostrando {filtered.length} de {alunos.length} alunos</span>
            <span>
              {trainedToday} treinaram hoje ·{' '}
              {needAttention > 0 && (
                <span style={{ color: '#fbbf24' }}>{needAttention} precisam de atenção</span>
              )}
            </span>
          </div>
        )}

      </div>
    </div>
  )
}
