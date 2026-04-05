import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { CheckCircle2, AlertCircle, Sparkles, Flame } from 'lucide-react'
import { registerWorkoutPresence, checkTodayPresence, getPresenceStats, type PresenceStats } from '../lib/presenceManager'
import './PresenceCheckIn.css'

interface PresenceCheckInProps {
  workoutId: string
  workoutName: string
  onRegister?: () => void
}

export default function PresenceCheckIn({ workoutId, workoutName, onRegister }: PresenceCheckInProps) {
  const { user } = useAuth()
  const [registered, setRegistered] = useState(false)
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null)
  const [stats, setStats] = useState<PresenceStats | null>(null)

  useEffect(() => {
    if (user) {
      checkStatus()
    }
  }, [user, workoutId])

  const checkStatus = async () => {
    if (!user) return
    setLoading(true)
    try {
      const isRegistered = await checkTodayPresence(user.id, workoutId)
      setRegistered(isRegistered)

      const presenceStats = await getPresenceStats(user.id)
      setStats(presenceStats)
    } catch (error) {
      console.error('Erro ao verificar status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckIn = useCallback(async () => {
    if (!user || registered) return

    setRegistering(true)
    const result = await registerWorkoutPresence(user.id, workoutId)

    if (result.success) {
      setRegistered(true)
      setShowConfetti(true)
      setToast({ message: result.message, type: 'success' })
      onRegister?.()

      const presenceStats = await getPresenceStats(user.id)
      setStats(presenceStats)

      setTimeout(() => setShowConfetti(false), 3000)
    } else {
      setToast({
        message: result.alreadyRegistered ? 'Treino já registrado hoje' : result.message,
        type: result.alreadyRegistered ? 'info' : 'error',
      })
    }

    setRegistering(false)
    setTimeout(() => setToast(null), 3000)
  }, [user, registered, workoutId, onRegister])

  if (loading) {
    return <div className="presence-loading"><div className="spinner" /></div>
  }

  return (
    <div className="presence-checkin">
      {/* Toast */}
      {toast && (
        <div className={`presence-toast ${toast.type}`}>
          {toast.type === 'success' && <CheckCircle2 size={16} />}
          {toast.type === 'info' && <AlertCircle size={16} />}
          {toast.type === 'error' && <AlertCircle size={16} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Confetti */}
      {showConfetti && <ConfettiAnimation />}

      {/* Main Button */}
      {registered ? (
        <div className="presence-registered">
          <CheckCircle2 size={24} className="registered-icon" />
          <div className="registered-info">
            <span className="registered-title">Treino concluído!</span>
            <span className="registered-subtitle">{workoutName} registrado hoje</span>
          </div>
        </div>
      ) : (
        <button
          className="presence-btn"
          onClick={handleCheckIn}
          disabled={registering}
        >
          {registering ? (
            <>
              <div className="spinner" />
              Registrando...
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Registrar Treino
            </>
          )}
        </button>
      )}

      {/* Stats */}
      {stats && (
        <div className="presence-stats">
          <div className="presence-stat">
            <Flame size={16} className={stats.currentStreak > 0 ? 'streak-active' : ''} />
            <div className="presence-stat-info">
              <span className="presence-stat-value">{stats.currentStreak}</span>
              <span className="presence-stat-label">Dias seguidos</span>
            </div>
          </div>
          <div className="presence-stat">
            <div className="presence-stat-info">
              <span className="presence-stat-value">{stats.weekCount}/{stats.weeklyGoal}</span>
              <span className="presence-stat-label">Esta semana</span>
            </div>
            <div className="presence-progress-bar">
              <div
                className="presence-progress-fill"
                style={{ width: `${stats.weeklyProgress * 100}%` }}
              />
            </div>
          </div>
          <div className="presence-stat">
            <div className="presence-stat-info">
              <span className="presence-stat-value">{stats.monthCount}</span>
              <span className="presence-stat-label">Este mês</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ConfettiAnimation() {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 1.5 + Math.random() * 1,
    color: ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'][Math.floor(Math.random() * 6)],
    size: 4 + Math.random() * 6,
  }))

  return (
    <div className="confetti-container">
      {particles.map(p => (
        <div
          key={p.id}
          className="confetti-particle"
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            background: p.color,
            width: `${p.size}px`,
            height: `${p.size}px`,
          }}
        />
      ))}
    </div>
  )
}
