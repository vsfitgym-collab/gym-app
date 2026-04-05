import { Flame, Trophy, Calendar, TrendingUp } from 'lucide-react'
import { getStreakData, getStreakMessage, getStreakLevel } from '../lib/streakManager'
import './StreakCard.css'

export default function StreakCard() {
  const streakData = getStreakData()
  const level = getStreakLevel(streakData.currentStreak)
  const message = getStreakMessage(streakData.currentStreak)

  const levelColors: Record<string, { bg: string; text: string; border: string; glow: string }> = {
    iniciante: { bg: 'rgba(156, 163, 175, 0.1)', text: '#9ca3af', border: 'rgba(156, 163, 175, 0.2)', glow: 'rgba(156, 163, 175, 0.15)' },
    dedicado: { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6', border: 'rgba(59, 130, 246, 0.2)', glow: 'rgba(59, 130, 246, 0.15)' },
    forte: { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981', border: 'rgba(16, 185, 129, 0.2)', glow: 'rgba(16, 185, 129, 0.15)' },
    elite: { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.2)', glow: 'rgba(245, 158, 11, 0.15)' },
    lendario: { bg: 'rgba(139, 92, 246, 0.1)', text: '#8b5cf6', border: 'rgba(139, 92, 246, 0.2)', glow: 'rgba(139, 92, 246, 0.15)' },
  }

  const colors = levelColors[level]

  const last7Days = streakData.streakHistory.slice(-7)

  return (
    <div className="streak-card" style={{ borderColor: colors.border }}>
      <div className="streak-glow" style={{ background: colors.glow }} />
      
      <div className="streak-header">
        <div className="streak-fire">
          <Flame size={28} className={streakData.currentStreak > 0 ? 'active' : ''} />
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
          <span className="streak-count" style={{ color: colors.text }}>{streakData.currentStreak}</span>
          <span className="streak-label">dias seguidos</span>
        </div>
        <p className="streak-message" style={{ color: colors.text }}>{message}</p>
      </div>

      <div className="streak-week">
        {last7Days.map((day, index) => {
          const dayName = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][new Date(day.date).getDay()]
          return (
            <div key={index} className={`streak-day ${day.completed ? 'completed' : ''}`}>
              <span className="day-name">{dayName}</span>
              <div className="day-dot" style={day.completed ? { background: colors.text } : {}} />
            </div>
          )
        })}
      </div>

      <div className="streak-stats">
        <div className="streak-stat">
          <Trophy size={14} />
          <div className="stat-info">
            <span className="stat-value">{streakData.longestStreak}</span>
            <span className="stat-label">Recorde</span>
          </div>
        </div>
        <div className="streak-stat">
          <Calendar size={14} />
          <div className="stat-info">
            <span className="stat-value">{streakData.totalWorkouts}</span>
            <span className="stat-label">Total</span>
          </div>
        </div>
        <div className="streak-stat">
          <TrendingUp size={14} />
          <div className="stat-info">
            <span className="stat-value">{streakData.thisWeekWorkouts}</span>
            <span className="stat-label">Semana</span>
          </div>
        </div>
      </div>
    </div>
  )
}
