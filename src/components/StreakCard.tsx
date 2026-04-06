import { memo, useState, useEffect } from 'react'
import { Flame, Trophy, Calendar, TrendingUp } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getPresenceStats, type PresenceStats } from '../lib/presenceManager'
import './StreakCard.css'

const StreakCard = memo(function StreakCard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<PresenceStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadStats()
    }
  }, [user])

  const loadStats = async () => {
    if (!user) return
    setLoading(true)
    try {
      const presenceStats = await getPresenceStats(user.id)
      setStats(presenceStats)
    } catch (error) {
      console.error('Error loading streak stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !stats) {
    return (
      <div className="streak-card streak-loading">
        <div className="spinner" />
        <span>Carregando streak...</span>
      </div>
    )
  }

  const level = getStreakLevel(stats.currentStreak)
  const message = getStreakMessage(stats.currentStreak)

  const levelColors: Record<string, { bg: string; text: string; border: string; glow: string }> = {
    iniciante: { bg: 'rgba(156, 163, 175, 0.1)', text: '#9ca3af', border: 'rgba(156, 163, 175, 0.2)', glow: 'rgba(156, 163, 175, 0.15)' },
    dedicado: { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6', border: 'rgba(59, 130, 246, 0.2)', glow: 'rgba(59, 130, 246, 0.15)' },
    forte: { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981', border: 'rgba(16, 185, 129, 0.2)', glow: 'rgba(16, 185, 129, 0.15)' },
    elite: { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.2)', glow: 'rgba(245, 158, 11, 0.15)' },
    lendario: { bg: 'rgba(139, 92, 246, 0.1)', text: '#8b5cf6', border: 'rgba(139, 92, 246, 0.2)', glow: 'rgba(139, 92, 246, 0.15)' },
  }

  const colors = levelColors[level]

  return (
    <div className="streak-card" style={{ borderColor: colors.border }}>
      <div className="streak-glow" style={{ background: colors.glow }} />
      
      <div className="streak-header">
        <div className="streak-fire">
          <Flame size={28} className={stats.currentStreak > 0 ? 'active' : ''} />
        </div>
        <div className="streak-title-section">
          <h3>Seu Streak</h3>
          <span className="streak-level" style={{ color: colors.text, background: colors.bg }}>
            {level.charAt(0).toUpperCase() + level.slice(1)}
          </span>
        </div>
      </div>

      <div className="streak-main">
        <div className="streak-number">
          <span className="streak-count" style={{ color: colors.text }}>{stats.currentStreak}</span>
          <span className="streak-label">dias seguidos</span>
        </div>
        <p className="streak-message" style={{ color: colors.text }}>{message}</p>
      </div>

      <div className="streak-stats">
        <div className="streak-stat">
          <Trophy size={14} />
          <div className="stat-info">
            <span className="stat-value">{stats.longestStreak}</span>
            <span className="stat-label">Recorde</span>
          </div>
        </div>
        <div className="streak-stat">
          <Calendar size={14} />
          <div className="stat-info">
            <span className="stat-value">{stats.weekCount}</span>
            <span className="stat-label">Esta Semana</span>
          </div>
        </div>
        <div className="streak-stat">
          <TrendingUp size={14} />
          <div className="stat-info">
            <span className="stat-value">{stats.monthCount}</span>
            <span className="stat-label">Este Mês</span>
          </div>
        </div>
      </div>
    </div>
  )
})

function getStreakMessage(streak: number): string {
  if (streak === 0) return 'Comece hoje!'
  if (streak === 1) return 'Primeiro dia!'
  if (streak < 3) return 'Bom começo!'
  if (streak < 7) return 'Continue assim!'
  if (streak === 7) return 'Semana completa!'
  if (streak < 14) return 'Imparável!'
  if (streak < 30) return 'Em chamas!'
  if (streak === 30) return 'Mês de ferro!'
  return 'Lendário!'
}

function getStreakLevel(streak: number): string {
  if (streak === 0) return 'iniciante'
  if (streak < 3) return 'iniciante'
  if (streak < 7) return 'dedicado'
  if (streak < 14) return 'forte'
  if (streak < 30) return 'elite'
  return 'lendario'
}

export default StreakCard
