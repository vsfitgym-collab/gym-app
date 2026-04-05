import { useState, useMemo } from 'react'
import { Trophy, Star, Target, TrendingUp, Calendar } from 'lucide-react'
import AchievementCard from '../components/achievements/AchievementCard'
import { achievements, getUnlockedCount, getTotalXP, getProgressByCategory } from '../data/achievementsData'
import './Conquistas.css'

const categories = [
  { value: 'all', label: 'Todas', icon: Trophy },
  { value: 'consistencia', label: 'Consistência', icon: Target },
  { value: 'volume', label: 'Volume', icon: TrendingUp },
  { value: 'evolucao', label: 'Evolução', icon: Star },
  { value: 'marco', label: 'Marcos', icon: Calendar },
]

export default function ConquistasPage() {
  const [filter, setFilter] = useState('all')

  const stats = useMemo(() => ({
    unlocked: getUnlockedCount(achievements),
    total: achievements.length,
    totalXP: getTotalXP(achievements),
    consistencia: getProgressByCategory(achievements, 'consistencia'),
    volume: getProgressByCategory(achievements, 'volume'),
    evolucao: getProgressByCategory(achievements, 'evolucao'),
    marco: getProgressByCategory(achievements, 'marco'),
  }), [])

  const filteredAchievements = useMemo(() => {
    if (filter === 'all') return achievements
    return achievements.filter(a => a.category === filter)
  }, [filter])

  const unlockedPercent = Math.round((stats.unlocked / stats.total) * 100)

  return (
    <div className="conquistas-page">
      <div className="conquistas-header">
        <div className="conquistas-title">
          <h2>Conquistas</h2>
          <span className="conquistas-subtitle">
            {stats.unlocked}/{stats.total} desbloqueadas
          </span>
        </div>
        <div className="conquistas-xp">
          <span className="xp-value">{stats.totalXP}</span>
          <span className="xp-label">XP Total</span>
        </div>
      </div>

      <div className="conquistas-overview">
        <div className="overview-progress">
          <div className="progress-info">
            <span>Progresso Geral</span>
            <span>{unlockedPercent}%</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${unlockedPercent}%` }}
            />
          </div>
        </div>

        <div className="overview-stats">
          <div className="overview-stat">
            <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
              <Trophy size={18} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.unlocked}</span>
              <span className="stat-label">Desbloqueadas</span>
            </div>
          </div>
          <div className="overview-stat">
            <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }}>
              <Star size={18} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.total - stats.unlocked}</span>
              <span className="stat-label">Restantes</span>
            </div>
          </div>
          <div className="overview-stat">
            <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
              <TrendingUp size={18} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.totalXP}</span>
              <span className="stat-label">XP Ganho</span>
            </div>
          </div>
        </div>
      </div>

      <div className="conquistas-categories">
        {categories.map(cat => {
          const Icon = cat.icon
          const progress = cat.value !== 'all' ? getProgressByCategory(achievements, cat.value) : null
          return (
            <button
              key={cat.value}
              className={`category-btn ${filter === cat.value ? 'active' : ''}`}
              onClick={() => setFilter(cat.value)}
            >
              <Icon size={16} />
              <span>{cat.label}</span>
              {progress && (
                <span className="category-count">
                  {progress.unlocked}/{progress.total}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="conquistas-grid">
        {filteredAchievements.map((achievement, index) => (
          <AchievementCard 
            key={achievement.id} 
            achievement={achievement} 
            index={index}
          />
        ))}
      </div>
    </div>
  )
}
