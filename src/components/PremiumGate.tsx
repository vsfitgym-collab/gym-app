import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Crown, Sparkles, ArrowRight, X } from 'lucide-react'
import './PremiumGate.css'

interface PremiumGateProps {
  isPremium: boolean
  trialDaysRemaining?: number
  children?: React.ReactNode
  feature?: string
  onUpgrade?: () => void
  onClose?: () => void
  limitMessage?: string
  requiredPlan?: 'basic' | 'premium'
  showAllBenefits?: boolean
}

export default function PremiumGate({
  isPremium,
  trialDaysRemaining = 0,
  children,
  feature = 'esta funcionalidade',
  onUpgrade,
  onClose,
  limitMessage,
  requiredPlan = 'premium',
  showAllBenefits = false,
}: PremiumGateProps) {
  const navigate = useNavigate()

  if (isPremium) {
    return <>{children}</>
  }

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade()
    } else {
      navigate('/planos')
    }
  }

  const benefits = showAllBenefits 
    ? [
        { label: 'Treinos ilimitados', included: requiredPlan === 'premium' },
        { label: 'Analytics completo', included: true },
        { label: 'Controle financeiro', included: true },
        { label: 'Histórico detalhado', included: true },
        { label: 'Exercícios avançados', included: true },
        { label: 'Exportação de dados', included: true },
      ]
    : [
        { label: 'Treinos ilimitados', included: true },
        { label: 'Gráficos e analytics', included: true },
        { label: 'Controle financeiro', included: true },
        { label: 'Histórico completo', included: true },
      ]

  return (
    <div className="premium-gate">
      <div className="gate-content">
        {onClose && (
          <button className="gate-close" onClick={onClose}>
            <X size={20} />
          </button>
        )}
        
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
          {requiredPlan === 'premium' ? 'Premium' : 'Básico'}
        </h3>

        {limitMessage && (
          <p className="gate-limit-message">
            {limitMessage}
          </p>
        )}
        
        <p className="gate-description">
          {feature} {requiredPlan === 'premium' ? 'é um recurso Premium' : 'requer o plano Básico'}
        </p>

        <div className="gate-features">
          {benefits.map((benefit, index) => (
            <div 
              key={index} 
              className={`gate-feature ${benefit.included ? 'included' : 'locked'}`}
            >
              <span className="gate-feature-check">
                {benefit.included ? '✓' : '🔒'}
              </span>
              <span className={benefit.included ? '' : 'text-muted'}>
                {benefit.label}
              </span>
            </div>
          ))}
        </div>

        <button className="gate-upgrade-btn" onClick={handleUpgrade}>
          <Crown size={16} />
          Fazer Upgrade
          <ArrowRight size={16} />
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

export function UpgradeButton({ 
  onClick, 
  children,
  className = '',
}: { 
  onClick?: () => void
  children?: React.ReactNode
  className?: string 
}) {
  const navigate = useNavigate()
  
  return (
    <button 
      className={`upgrade-btn ${className}`}
      onClick={onClick || (() => navigate('/planos'))}
    >
      <Crown size={16} />
      {children || 'Fazer Upgrade'}
    </button>
  )
}

export function LimitReachedBadge({ 
  limit, 
  current 
}: { 
  limit: number 
  current: number 
}) {
  return (
    <div className="limit-badge">
      <span className="limit-current">{current}</span>
      <span className="limit-separator">/</span>
      <span className="limit-max">{limit}</span>
    </div>
  )
}
