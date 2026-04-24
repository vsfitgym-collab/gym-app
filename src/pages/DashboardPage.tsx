import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSubscription } from '../hooks/useSubscription'
import {
  Dumbbell,
  Clock,
  Check,
  Plus,
  Users,
  BarChart3,
  Calendar,
  Target,
  Zap,
  ArrowUpRight,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import GraficoEvolucao from '../components/GraficoEvolucao'
import StreakCard from '../components/StreakCard'
import WorkoutCalendar from '../components/WorkoutCalendar'
import { supabase } from '../lib/supabase'
import { registerWorkoutPresence, checkTodayPresence, getPresenceStats } from '../lib/presenceManager'
import { useState, useEffect } from 'react'
import CardBloqueio from '../components/CardBloqueio'
import ProtectedFeature from '../components/ProtectedFeature'
import { normalizePlanKey, getWorkoutSystem } from '../lib/permissions'
import { useStudentProfile } from '../hooks/useStudentProfile'
import './Dashboard.css'

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
  { id: '1', label: 'Novo Treino', icon: Plus, cor: '#8b5cf6', path: '/treinos/criar' },
  { id: '2', label: 'Registrar Presença', icon: Check, cor: '#10b981', action: 'presenca' },
  { id: '3', label: 'Ver Alunos', icon: Users, cor: '#f59e0b', path: '/alunos' },
  { id: '4', label: 'Relatórios', icon: BarChart3, cor: '#06b6d4', path: '/financeiro' },
]

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  trend?: string
  trendUp?: boolean
  delay: number
}

function StatCard({ icon, label, value, trend, trendUp, delay }: StatCardProps) {
  return (
    <div className="stat-card" style={{ animationDelay: `${delay}ms` }}>
      <div className="stat-card-header">
        <div className="stat-icon">{icon}</div>
        {trend && (
          <span className={`stat-trend ${trendUp ? 'up' : 'down'}`}>
            <ArrowUpRight size={12} />
            {trend}
          </span>
        )}
      </div>
      <div className="stat-card-content">
        <span className="stat-value">{value}</span>
        <span className="stat-label">{label}</span>
      </div>
    </div>
  )
}

interface DbWorkoutCard {
  id: string
  name: string
  exercises_count: number
  created_at: string
}

function WorkoutCard({ treino, index }: { treino: DbWorkoutCard; index: number }) {
  return (
    <div className="workout-card" style={{ animationDelay: `${index * 60}ms` }}>
      <div className="workout-card-header">
        <div className="workout-icon" style={{ background: '#8b5cf615', color: '#8b5cf6' }}>
          <Dumbbell size={20} />
        </div>
        <span className="workout-level" style={{ background: '#8b5cf620', color: '#8b5cf6' }}>
          {treino.exercises_count > 8 ? 'Avançado' : treino.exercises_count > 4 ? 'Intermediário' : 'Iniciante'}
        </span>
      </div>
      <div className="workout-card-body">
        <h4>{treino.name}</h4>
      </div>
      <div className="workout-card-footer">
        <div className="workout-meta">
          <Target size={14} />
          <span>{treino.exercises_count} exercício{treino.exercises_count !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user, role } = useAuth()
  const { isPremium } = useSubscription()
  const [showPresenceModal, setShowPresenceModal] = useState(false)
  const [dbWorkouts, setDbWorkouts] = useState<{ id: string; name: string }[]>([])
  const [presenceStatus, setPresenceStatus] = useState<Record<string, boolean>>({})
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null)
  const [dashStats, setDashStats] = useState({ workoutsMonth: 0, hoursTraining: 0, calories: 0, streak: 0 })
  const [prevMonthCount, setPrevMonthCount] = useState(0)
  const [activeWorkouts, setActiveWorkouts] = useState<DbWorkoutCard[]>([])
  const [workoutSystem, setWorkoutSystem] = useState<'free' | 'custom'>('free')
  
  const { profile: studentProfile, hasProfile, isAwaitingProgram } = useStudentProfile()

  useEffect(() => {
    if (showPresenceModal && user) {
      loadWorkouts()
    }
  }, [showPresenceModal, user])

  useEffect(() => {
    if (user) {
      loadDashStats()
      loadActiveWorkouts()
    }
  }, [user])

  const loadActiveWorkouts = async () => {
    if (!user) return
    try {
      if (role === 'personal') {
        // Personal trainer sees latest 4 created workouts
        const { data: pWorkouts } = await supabase
          .from('workouts')
          .select('id, name, created_at')
          .eq('created_by', user.id)
          .order('created_at', { ascending: false })
          .limit(4)
        await enrichAndSetWorkouts(pWorkouts)
        return
      }

      // Detect plan and system
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('plan, status')
        .eq('user_id', user.id)
        .in('status', ['ativa', 'trial'])
        .maybeSingle()

      const planKey = normalizePlanKey(subData?.plan)
      const system = getWorkoutSystem(planKey)
      setWorkoutSystem(system)

      if (system === 'custom') {
        // For custom, load up to 4 assigned workouts
        const { data: customWorkouts } = await supabase
          .from('workouts')
          .select('id, name, created_at')
          .eq('workout_type', 'custom')
          .eq('assigned_to', user.id)
          .order('created_at', { ascending: false })
          .limit(4)
        
        await enrichAndSetWorkouts(customWorkouts)
      } else {
        // For FREE, load today's scheduled workout
        const today = new Date().getDay()
        const { data: schedule } = await supabase
          .from('free_workout_schedule')
          .select('workout_id')
          .eq('day_of_week', today)
          .maybeSingle()
          
        if (schedule?.workout_id) {
          const { data: freeWorkout } = await supabase
            .from('workouts')
            .select('id, name, created_at')
            .eq('id', schedule.workout_id)
          await enrichAndSetWorkouts(freeWorkout)
        } else {
          setActiveWorkouts([])
        }
      }
    } catch (error) {
      console.error('Erro ao carregar treinos ativos:', error)
    }
  }

  const enrichAndSetWorkouts = async (data: any[] | null) => {
    if (!data || data.length === 0) {
      setActiveWorkouts([])
      return
    }

    const enriched: DbWorkoutCard[] = []
    for (const w of data) {
      const { count } = await supabase
        .from('workout_plans')
        .select('*', { count: 'exact', head: true })
        .eq('workout_id', w.id)
        
      enriched.push({
        id: w.id,
        name: w.name,
        exercises_count: count ?? 0,
        created_at: w.created_at,
      })
    }
    setActiveWorkouts(enriched)
  }

  const loadDashStats = async () => {
    if (!user) return
    try {
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]
      const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]

      // Treinos este mês (dias únicos com presença)
      const { data: monthPresences } = await supabase
        .from('workout_presence')
        .select('date')
        .eq('user_id', user.id)
        .gte('date', monthStart)
      const workoutsMonth = new Set(monthPresences?.map(p => p.date)).size

      // Mês anterior (para calcular trend)
      const { data: prevPresences } = await supabase
        .from('workout_presence')
        .select('date')
        .eq('user_id', user.id)
        .gte('date', prevMonthStart)
        .lte('date', prevMonthEnd)
      const prevCount = new Set(prevPresences?.map(p => p.date)).size
      setPrevMonthCount(prevCount)

      // Horas treinadas (baseado em sessões completadas)
      const { data: sessions } = await supabase
        .from('workout_sessions')
        .select('started_at, completed_at')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .not('completed_at', 'is', null)
      let totalMinutes = 0
      if (sessions) {
        for (const s of sessions) {
          if (s.started_at && s.completed_at) {
            const diff = new Date(s.completed_at).getTime() - new Date(s.started_at).getTime()
            totalMinutes += diff / (1000 * 60)
          }
        }
      }
      // Se não houver sessões completas, estimar 45min por presença
      const { data: allPresences } = await supabase
        .from('workout_presence')
        .select('date')
        .eq('user_id', user.id)
      const totalPresenceDays = new Set(allPresences?.map(p => p.date)).size
      const hoursTraining = totalMinutes > 0
        ? Math.round(totalMinutes / 60 * 10) / 10
        : Math.round(totalPresenceDays * 0.75 * 10) / 10 // ~45min por treino

      // Calorias (estimativa: ~350 cal por treino)
      const calories = totalPresenceDays * 350

      // Streak atual
      const presenceStats = await getPresenceStats(user.id)

      setDashStats({
        workoutsMonth,
        hoursTraining,
        calories,
        streak: presenceStats.currentStreak,
      })
    } catch (error) {
      console.error('Erro ao carregar stats do dashboard:', error)
    }
  }

  const loadWorkouts = async () => {
    if (!user) return
    try {
      const { data } = await supabase
        .from('workouts')
        .select('id, name')
        .order('created_at', { ascending: false })
        .limit(10)

      if (data) {
        setDbWorkouts(data)
        const status: Record<string, boolean> = {}
        for (const w of data) {
          status[w.id] = await checkTodayPresence(user.id, w.id)
        }
        setPresenceStatus(status)
      }
    } catch (error) {
      console.error('Erro ao carregar treinos:', error)
    }
  }

  const handleCheckIn = async (workoutId: string, workoutName: string) => {
    if (!user) return
    const result = await registerWorkoutPresence(user.id, workoutId)
    
    if (result.success) {
      setPresenceStatus(prev => ({ ...prev, [workoutId]: true }))
      setToast({ message: `✅ ${workoutName} registrado!`, type: 'success' })
    } else {
      setToast({
        message: result.alreadyRegistered ? 'Treino já registrado hoje' : result.message,
        type: result.alreadyRegistered ? 'info' : 'error',
      })
    }
    
    setTimeout(() => setToast(null), 3000)
  }

  const handleShortcutClick = (atalho: typeof shortcuts[0]) => {
    if (atalho.path) {
      navigate(atalho.path)
    } else if (atalho.action === 'presenca') {
      setShowPresenceModal(true)
    }
  }

  return (
    <div className="dashboard-page">
      {/* Toast */}
      {toast && (
        <div className={`dashboard-toast ${toast.type}`}>
          {toast.type === 'success' && <CheckCircle2 size={16} />}
          {toast.type === 'info' && <AlertCircle size={16} />}
          {toast.type === 'error' && <AlertCircle size={16} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Presence Modal */}
      {showPresenceModal && (
        <div className="presence-modal-overlay" onClick={() => setShowPresenceModal(false)}>
          <div className="presence-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Registrar Presença</h3>
              <button className="modal-close" onClick={() => setShowPresenceModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-subtitle">Selecione o treino que você concluiu hoje:</p>
              {dbWorkouts.length === 0 ? (
                <div className="modal-empty">
                  <Dumbbell size={32} />
                  <span>Nenhum treino encontrado</span>
                </div>
              ) : (
                <div className="modal-workouts">
                  {dbWorkouts.map((workout) => (
                    <button
                      key={workout.id}
                      className={`modal-workout-btn ${presenceStatus[workout.id] ? 'registered' : ''}`}
                      onClick={() => handleCheckIn(workout.id, workout.name)}
                      disabled={presenceStatus[workout.id]}
                    >
                      <div className="workout-btn-info">
                        <span className="workout-btn-name">{workout.name}</span>
                        {presenceStatus[workout.id] && (
                          <span className="workout-btn-badge">
                            <CheckCircle2 size={12} />
                            Registrado
                          </span>
                        )}
                      </div>
                      {presenceStatus[workout.id] ? (
                        <CheckCircle2 size={20} className="btn-icon-success" />
                      ) : (
                        <ArrowUpRight size={16} className="btn-icon-arrow" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="dashboard-header">
        <div className="header-info">
          <h1>Dashboard</h1>
          <p>Visão geral do seu progresso</p>
        </div>
        {role === 'personal' && (
          <div className="header-actions">
            <button className="btn-primary" onClick={() => navigate('/treinos/criar')}>
              <Plus size={16} />
              <span>Novo Treino</span>
            </button>
          </div>
        )}
      </div>

      {/* Streak */}
      <div className="dashboard-section">
        <StreakCard />
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard
          icon={<Dumbbell size={20} />}
          label="Treinos este mês"
          value={dashStats.workoutsMonth}
          trend={prevMonthCount > 0 ? `${dashStats.workoutsMonth >= prevMonthCount ? '+' : ''}${prevMonthCount > 0 ? Math.round(((dashStats.workoutsMonth - prevMonthCount) / prevMonthCount) * 100) : 0}%` : undefined}
          trendUp={dashStats.workoutsMonth >= prevMonthCount}
          delay={100}
        />
        <StatCard
          icon={<Clock size={20} />}
          label="Horas treinadas"
          value={`${dashStats.hoursTraining}h`}
          delay={150}
        />
        <StatCard
          icon={<Zap size={20} />}
          label="Calorias queimadas"
          value={dashStats.calories >= 1000 ? `${(dashStats.calories / 1000).toFixed(1)}k` : String(dashStats.calories)}
          delay={200}
        />
        <StatCard
          icon={<Calendar size={20} />}
          label="Dias consecutivos"
          value={dashStats.streak}
          delay={250}
        />
      </div>

      {/* Main Content */}
      <div className="dashboard-main-grid">
        {/* Workouts */}
        <ProtectedFeature feature="Treinos Ativos">
          <div className="dashboard-card dashboard-card-wide">
            <div className="card-header">
              <div className="card-title">
                <h2>{role === 'personal' ? 'Últimos Treinos Criados' : workoutSystem === 'free' ? 'Treino de Hoje' : 'Seus Treinos'}</h2>
                <span>{activeWorkouts.length} treino{activeWorkouts.length !== 1 ? 's' : ''} disponível{activeWorkouts.length !== 1 ? 'is' : ''}</span>
              </div>
              <button className="card-action" onClick={() => navigate('/treinos')}>
                Ver todos
                <ArrowUpRight size={16} />
              </button>
            </div>
            <div className="workouts-grid">
              {workoutSystem === 'custom' && !hasProfile && role !== 'personal' ? (
                <div className="col-span-full bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                  <div className="mx-auto w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 mb-3">
                    <Target size={24} />
                  </div>
                  <h3 className="font-bold text-white mb-1">Preencha sua Ficha</h3>
                  <p className="text-sm text-slate-400 mb-4">Para receber seus treinos personalizados, você precisa preencher sua ficha técnica.</p>
                  <button onClick={() => navigate('/treinos')} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg text-sm transition-colors cursor-pointer">
                    Preencher Agora
                  </button>
                </div>
              ) : workoutSystem === 'custom' && isAwaitingProgram && role !== 'personal' ? (
                <div className="col-span-full bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 text-center">
                  <h3 className="font-bold text-amber-300 mb-1">Aguardando Personal</h3>
                  <p className="text-sm text-slate-400">Sua ficha foi enviada. O personal está montando seu treino.</p>
                </div>
              ) : workoutSystem === 'free' && activeWorkouts.length === 0 ? (
                <div className="col-span-full bg-white/5 border border-white/10 rounded-2xl p-6 text-center text-slate-400">
                  Dia de descanso! Não há treino agendado para hoje.
                </div>
              ) : activeWorkouts.length === 0 ? (
                 <div className="col-span-full bg-white/5 border border-white/10 rounded-2xl p-6 text-center text-slate-400">
                  Você não tem treinos ativos no momento.
                </div>
              ) : (
                activeWorkouts.map((treino, index) => (
                  <div key={treino.id} onClick={() => navigate(`/treinos/${treino.id}`)} className="cursor-pointer">
                    <WorkoutCard treino={treino} index={index} />
                  </div>
                ))
              )}
            </div>
          </div>
        </ProtectedFeature>

        {/* Weekly Progress */}
        <div className="dashboard-card">
          <WorkoutCalendar />
        </div>

        {/* Chart */}
        <ProtectedFeature feature="Gráficos e Analytics">
          <div className="dashboard-card dashboard-card-full">
            <div className="card-header">
              <div className="card-title">
                <h2>Evolução de Treinos</h2>
                <span>Últimas 4 semanas</span>
              </div>
            </div>
            <GraficoEvolucao />
          </div>
        </ProtectedFeature>

        {/* Shortcuts (Personal only) */}
        {role === 'personal' && (
          <div className="dashboard-card dashboard-card-wide">
            <div className="card-header">
              <div className="card-title">
                <h2>Atalhos Rápidos</h2>
                <span>Acesso rápido às principais funções</span>
              </div>
            </div>
            <div className="shortcuts-grid">
              {shortcuts.map((atalho) => (
                <button
                  key={atalho.id}
                  className="shortcut-btn"
                  style={{ '--accent': atalho.cor } as React.CSSProperties}
                  onClick={() => handleShortcutClick(atalho)}
                >
                  <div className="shortcut-icon" style={{ background: `${atalho.cor}15`, color: atalho.cor }}>
                    <atalho.icon size={20} />
                  </div>
                  <span className="shortcut-label">{atalho.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
