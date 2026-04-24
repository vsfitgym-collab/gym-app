import React, { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Crown, Sparkles, ArrowRight } from 'lucide-react'
import { useSubscription } from '../hooks/useSubscription'
import { isPremium, isBasic, isPlanActive, isFree } from '../lib/planUtils'
import { useAuth } from '../context/AuthContext'
import './PremiumGuard.css'

interface PremiumGuardProps {
  children: React.ReactNode
  feature?: string
  fallback?: React.ReactNode
  requirePlan?: 'basic' | 'premium'
}

export const PremiumGuard = memo(function PremiumGuard({
  children,
  feature = 'esta funcionalidade',
  fallback,
  requirePlan = 'premium',
}: PremiumGuardProps) {
  const navigate = useNavigate()
  const { role } = useAuth()
  const { plan, isPremium: hookIsPremium, isBasic: hookIsBasic, subscription, loading } = useSubscription()

  if (loading) {
    return (
      <div className="premium-guard-loading">
        <div className="guard-spinner" />
        <span>Verificando plano...</span>
      </div>
    )
  }

  if (role === 'personal') {
    return <>{children}</>
  }

  const hasPlan = !!plan && plan !== 'free'
  const expiresAt = subscription?.end_date ?? null
  const isActive = hasPlan ? isPlanActive(expiresAt) : true
  
  const meetsRequirement = hasPlan && (
    requirePlan === 'basic'
      ? (hookIsBasic || hookIsPremium) && isActive
      : hookIsPremium && isActive
  )

  if (!meetsRequirement) {
    if (fallback) return <>{fallback}</>

    return (
      <div className="premium-guard">
        <div className="guard-overlay" />
        <div className="guard-content">
          <div className="guard-icon">
            <Lock size={32} />
          </div>

          <div className="guard-badge">
            <Crown size={14} />
            <span>{requirePlan === 'basic' ? 'Básico' : 'Premium'}</span>
          </div>

          <h3 className="guard-title">
            Recurso Bloqueado
          </h3>

          <p className="guard-description">
            {feature} está disponível apenas no plano <strong>{requirePlan === 'basic' ? 'Básico' : 'Premium'}</strong>.
          </p>

          {isFree(plan) && (
            <div className="guard-current-plan">
              <span>Seu plano atual:</span>
              <strong>Free</strong>
            </div>
          )}

          <div className="guard-features">
            <div className="guard-feature">
              <span className="guard-feature-check">✓</span>
              <span>Treinos ilimitados</span>
            </div>
            <div className="guard-feature">
              <span className="guard-feature-check">✓</span>
              <span>Gráficos e analytics</span>
            </div>
            <div className="guard-feature">
              <span className="guard-feature-check">✓</span>
              <span>Exercícios avançados</span>
            </div>
            <div className="guard-feature">
              <span className="guard-feature-check">✓</span>
              <span>Suporte prioritário</span>
            </div>
          </div>

          <button
            className="guard-upgrade-btn"
            onClick={() => navigate('/planos')}
          >
            <Crown size={16} />
            Fazer Upgrade
            <ArrowRight size={16} />
          </button>

          <p className="guard-trial-text">
            <Sparkles size={12} />
            Trial grátis de 7 dias disponível
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
})

// Inline blur version for cards/items within a list
export function PremiumItemBlur({
  children,
  isLocked,
  onClick,
}: {
  children: React.ReactNode
  isLocked: boolean
  onClick?: () => void
}) {
  const navigate = useNavigate()

  if (!isLocked) return <>{children}</>

  return (
    <div className="premium-item-blur" onClick={onClick || (() => navigate('/planos'))}>
      <div className="item-blur-content">
        {children}
      </div>
      <div className="item-blur-overlay">
        <div className="item-blur-lock">
          <Lock size={24} />
          <span>Premium</span>
        </div>
        <span className="item-blur-hint">Clique para desbloquear</span>
      </div>
    </div>
  )
}

// Toast notification for when user tries to access premium feature
export function showPremiumToast(feature: string) {
  const toast = document.createElement('div')
  toast.className = 'premium-toast-notification'
  toast.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
    <span><strong>${feature}</strong> é um recurso Premium</span>
    <button class="premium-toast-upgrade">Fazer Upgrade</button>
  `

  toast.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    if (target.classList.contains('premium-toast-upgrade')) {
      window.location.href = '/planos'
    }
  })

  document.body.appendChild(toast)

  setTimeout(() => {
    toast.classList.add('toast-exit')
    setTimeout(() => toast.remove(), 300)
  }, 4000)
}

export default PremiumGuard
