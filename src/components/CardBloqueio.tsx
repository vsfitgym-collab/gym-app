import { useNavigate } from 'react-router-dom'
import { Lock, Crown, ArrowRight } from 'lucide-react'
import './CardBloqueio.css'

interface CardBloqueioProps {
  feature?: string
  requiredPlan?: 'basic' | 'premium'
  compact?: boolean
}

export default function CardBloqueio({
  feature = 'esta funcionalidade',
  requiredPlan = 'premium',
  compact = false,
}: CardBloqueioProps) {
  const navigate = useNavigate()

  const handleUpgrade = () => {
    navigate('/planos')
  }

  if (compact) {
    return (
      <div className="card-bloqueio card-bloqueio--compact">
        <div className="card-bloqueio__icon">
          <Lock size={16} />
        </div>
        <div className="card-bloqueio__content">
          <span className="card-bloqueio__title">
            {requiredPlan === 'premium' ? 'Premium' : 'Básico'}
          </span>
          <span className="card-bloqueio__feature">{feature}</span>
        </div>
        <button className="card-bloqueio__btn" onClick={handleUpgrade}>
          <Crown size={14} />
          <span>Upgrade</span>
          <ArrowRight size={14} />
        </button>
      </div>
    )
  }

  return (
    <div className="card-bloqueio">
      <div className="card-bloqueio__header">
        <div className="card-bloqueio__icon-lg">
          <Lock size={24} />
        </div>
        <div className="card-bloqueio__badge">
          <Crown size={12} />
          <span>{requiredPlan === 'premium' ? 'Premium' : 'Básico'}</span>
        </div>
      </div>
      <div className="card-bloqueio__body">
        <p className="card-bloqueio__desc">
          {feature} é um recurso {requiredPlan === 'premium' ? 'Premium' : 'do Plano Básico'}
        </p>
        <button className="card-bloqueio__cta" onClick={handleUpgrade}>
          <Crown size={16} />
          <span>Fazer Upgrade</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}