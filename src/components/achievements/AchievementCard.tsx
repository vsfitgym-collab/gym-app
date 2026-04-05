import { useState } from 'react'
import type { Achievement } from '../../data/achievementsData'
import { rarityColors, rarityLabels } from '../../data/achievementsData'
import './AchievementCard.css'

interface AchievementCardProps {
  achievement: Achievement
  index: number
}

export default function AchievementCard({ achievement, index }: AchievementCardProps) {
  const [expanded, setExpanded] = useState(false)
  const progressPercent = achievement.target 
    ? Math.min((achievement.progress || 0) / achievement.target * 100, 100) 
    : 0

  return (
    <div 
      className={`achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'} ${expanded ? 'expanded' : ''}`}
      style={{ animationDelay: `${index * 0.05}s` }}
      onClick={() => setExpanded(!expanded)}
    >
      <div className={`achievement-glow ${achievement.rarity}`} />
      
      <div className="achievement-header">
        <div className="achievement-icon-wrapper">
          <span className="achievement-icon">{achievement.icon}</span>
          {achievement.unlocked && (
            <div className="achievement-check">✓</div>
          )}
        </div>
        
        <div className="achievement-info">
          <div className="achievement-title-row">
            <h4 className="achievement-title">{achievement.title}</h4>
            <span 
              className="achievement-rarity"
              style={{ color: rarityColors[achievement.rarity] }}
            >
              {rarityLabels[achievement.rarity]}
            </span>
          </div>
          <p className="achievement-description">{achievement.description}</p>
        </div>
      </div>

      {!achievement.unlocked && achievement.target && (
        <div className="achievement-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ 
                width: `${progressPercent}%`,
                background: `linear-gradient(90deg, ${rarityColors[achievement.rarity]}88, ${rarityColors[achievement.rarity]})`
              }}
            />
          </div>
          <span className="progress-text">
            {achievement.progress}/{achievement.target}
          </span>
        </div>
      )}

      {expanded && (
        <div className="achievement-details">
          <div className="detail-row">
            <span>XP</span>
            <span className="detail-value">+{achievement.xp} XP</span>
          </div>
          <div className="detail-row">
            <span>Categoria</span>
            <span className="detail-value">{achievement.category}</span>
          </div>
          {achievement.unlocked && achievement.unlockedAt && (
            <div className="detail-row">
              <span>Desbloqueado em</span>
              <span className="detail-value">
                {new Date(achievement.unlockedAt).toLocaleDateString('pt-BR')}
              </span>
            </div>
          )}
          {!achievement.unlocked && (
            <div className="detail-row">
              <span>Falta</span>
              <span className="detail-value">
                {achievement.target ? achievement.target - (achievement.progress || 0) : '?'}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="achievement-xp">
        +{achievement.xp}
      </div>
    </div>
  )
}
