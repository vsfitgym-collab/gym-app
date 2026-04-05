import React from 'react'
import { Lock, Crown, Sparkles } from 'lucide-react'
import './PremiumGate.css'

interface PremiumGateProps {
  isPremium: boolean
  trialDaysRemaining?: number
  children: React.ReactNode
  feature?: string
  onUpgrade?: () => void
}

export default function PremiumGate({
  isPremium,
  trialDaysRemaining = 0,
  children,
  feature = 'esta funcionalidade',
  onUpgrade,
}: PremiumGateProps) {
  if (isPremium) {
    return <>{children}</>
  }

  return (
    <div className="premium-gate">
      <div className="gate-overlay" />
      <div className="gate-content">
        <div className="gate-icon">
          <Lock size={32} />
        </div>
        
        {trialDaysRemaining > 0 && (
          <div className="gate-trial-badge">
            <Sparkles size={14} />
            <span>{trialDaysRemaining} dias de trial restantes</span>
          </div>
        )}

        <h3 className="gate-title">
          <Crown size={18} />
          Premium
        </h3>
        
        <p className="gate-description">
          {feature} está disponível apenas no plano Premium
        </p>

        <div className="gate-features">
          <div className="gate-feature">
            <span className="gate-feature-check">✓</span>
            <span>Treinos ilimitados</span>
          </div>
          <div className="gate-feature">
            <span className="gate-feature-check">✓</span>
            <span>Gráficos e analytics</span>
          </div>
          <div className="gate-feature">
            <span className="gate-feature-check">✓</span>
            <span>Controle financeiro</span>
          </div>
          <div className="gate-feature">
            <span className="gate-feature-check">✓</span>
            <span>Histórico completo</span>
          </div>
        </div>

        <button className="gate-upgrade-btn" onClick={onUpgrade}>
          <Crown size={16} />
          Fazer Upgrade
        </button>

        {trialDaysRemaining > 0 && (
          <p className="gate-trial-text">
            Ou aproveite seus {trialDaysRemaining} dias grátis
          </p>
        )}
      </div>
    </div>
  )
}
