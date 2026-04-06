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
import { workouts, getLevelColor, getLevelLabel, type Workout } from '../data/workoutsData'
import { supabase } from '../lib/supabase'
import { registerWorkoutPresence, checkTodayPresence } from '../lib/presenceManager'
import { useState, useEffect } from 'react'
import CardBloqueio from '../components/CardBloqueio'
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

interface WorkoutCardProps {
  treino: Workout
  index: number
}

function WorkoutCard({ treino, index }: WorkoutCardProps) {
  return (
    <div className="workout-card" style={{ animationDelay: `${index * 60}ms` }}>
      <div className="workout-card-header">
        <div className="workout-icon" style={{ background: getLevelColor(treino.level) + '15', color: getLevelColor(treino.level) }}>
          <Dumbbell size={20} />
        </div>
        <span className="workout-level" style={{ background: getLevelColor(treino.level) + '20', color: getLevelColor(treino.level) }}>
          {getLevelLabel(treino.level)}
        </span>
      </div>
      <div className="workout-card-body">
        <h4>{treino.name}</h4>
        <p className="workout-desc">{treino.description}</p>
      </div>
      <div className="workout-card-footer">
        <div className="workout-meta">
          <Clock size={14} />
          <span>{treino.duration_minutes} min</span>
        </div>
        <div className="workout-meta">
          <Target size={14} />
          <span>{treino.exercises_count} exercícios</span>
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

  const activeWorkouts: Workout[] = workouts.slice(0, 4)

  useEffect(() => {
    if (showPresenceModal && user) {
      loadWorkouts()
    }
  }, [showPresenceModal, user])

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
          value={12}
          trend="+18%"
          trendUp={true}
          delay={100}
        />
        <StatCard
          icon={<Clock size={20} />}
          label="Horas treinadas"
          value="48h"
          trend="+12%"
          trendUp={true}
          delay={150}
        />
        <StatCard
          icon={<Zap size={20} />}
          label="Calorias queimadas"
          value="8.4k"
          trend="+24%"
          trendUp={true}
          delay={200}
        />
        <StatCard
          icon={<Calendar size={20} />}
          label="Dias consecutivos"
          value={4}
          delay={250}
        />
      </div>

      {/* Main Content */}
      <div className="dashboard-main-grid">
        {/* Workouts */}
        <div className="dashboard-card dashboard-card-wide">
          <div className="card-header">
            <div className="card-title">
              <h2>Treinos Ativos</h2>
              <span>{activeWorkouts.length} treinos disponíveis</span>
            </div>
            <button className="card-action" onClick={() => navigate('/treinos')}>
              Ver todos
              <ArrowUpRight size={16} />
            </button>
          </div>
          <div className="workouts-grid">
            {activeWorkouts.map((treino, index) => (
              <WorkoutCard key={treino.id} treino={treino} index={index} />
            ))}
          </div>
        </div>

        {/* Weekly Progress */}
        <div className="dashboard-card">
          <WorkoutCalendar />
        </div>

        {/* Chart - Premium only */}
        {isPremium ? (
          <div className="dashboard-card dashboard-card-full">
            <div className="card-header">
              <div className="card-title">
                <h2>Evolução de Treinos</h2>
                <span>Últimas 4 semanas</span>
              </div>
            </div>
            <GraficoEvolucao />
          </div>
        ) : (
          <CardBloqueio feature="gráficos e analytics avançados" />
        )}

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
