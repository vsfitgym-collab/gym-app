import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlan } from '../context/PlanContext'
import { useAuth } from '../context/AuthContext'
import { createCheckoutSession, PLAN_DETAILS } from '../lib/stripeService'
import { 
  Lock, 
  Crown, 
  Zap, 
  X, 
  Check, 
  Loader2,
  CreditCard,
  AlertTriangle,
  Clock
} from 'lucide-react'

interface UpgradeModalProps {
  open: boolean
  onClose: () => void
  feature?: string
  reason?: 'blocked_feature' | 'trial_expiring' | 'payment_failed'
}

export function UpgradeModal({ open, onClose, feature, reason = 'blocked_feature' }: UpgradeModalProps) {
  const navigate = useNavigate()
  const { userPlan, refreshPlan } = usePlan()
  const [loading, setLoading] = useState<string | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<string>('pro')

  if (!open) return null

  const { user } = useAuth()
  
  const handleUpgrade = async (plan: string) => {
    if (!user) return

    setLoading(plan)
    try {
      const url = await createCheckoutSession({
        plan: plan as 'basic' | 'pro' | 'premium',
        userId: user.id,
        successUrl: `${window.location.origin}/success?plan=${plan}`,
        cancelUrl: `${window.location.origin}/plans`
      })
      
      window.location.href = url
    } catch (error) {
      console.error('Checkout error:', error)
      setLoading(null)
    }
  }

  const getTitle = () => {
    switch (reason) {
      case 'trial_expiring':
        return 'Seu teste está terminando'
      case 'payment_failed':
        return 'Problema no pagamento'
      default:
        return feature ? `Desbloqueie ${feature}` : 'Faça upgrade'
    }
  }

  const getMessage = () => {
    switch (reason) {
      case 'trial_expiring':
        return 'Continue disfrutando de acesso completo com um plano!'
      case 'payment_failed':
        return 'Atualize seu método de pagamento para continuar.'
      default:
        return 'Esse recurso está disponível nos planos pagos.'
    }
  }

  const getButtonText = () => {
    switch (reason) {
      case 'trial_expiring':
        return ' Garantir minha vaga'
      case 'payment_failed':
        return ' Atualizar pagamento'
      default:
        return ' Assinar plano'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-white/10 shadow-2xl">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X size={20} />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-4 border border-amber-500/30">
            {reason === 'payment_failed' ? (
              <AlertTriangle className="text-red-400" size={32} />
            ) : reason === 'trial_expiring' ? (
              <Clock className="text-amber-400" size={32} />
            ) : (
              <Lock className="text-amber-400" size={32} />
            )}
          </div>
          
          <h2 className="text-xl font-bold text-white mb-2">
            {getTitle()}
          </h2>
          
          <p className="text-slate-400">
            {getMessage()}
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {Object.entries(PLAN_DETAILS).map(([id, plan]) => (
            <button
              key={id}
              onClick={() => setSelectedPlan(id)}
              disabled={loading !== null}
              className={`w-full p-4 rounded-xl border transition-all flex items-center justify-between ${
                selectedPlan === id 
                  ? 'border-amber-500 bg-amber-500/10' 
                  : 'border-white/10 hover:border-white/20'
              } ${loading === id ? 'opacity-50' : ''}`}
            >
              <div className="text-left">
                <div className="font-bold text-white">{plan.name}</div>
                <div className="text-sm text-slate-400">
                  {plan.features.slice(0, 2).join(', ')}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-white">
                  R$ {plan.price.toFixed(2).replace('.', ',')}
                </div>
                <div className="text-xs text-slate-500">/mês</div>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={() => handleUpgrade(selectedPlan)}
          disabled={loading !== null}
          className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
        >
          {loading === selectedPlan ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <>
              <CreditCard size={18} />
              {getButtonText()}
            </>
          )}
        </button>

        <button
          onClick={() => navigate('/planos')}
          className="w-full mt-3 py-2 text-sm text-slate-400 hover:text-white"
        >
          Ver todos os planos
        </button>
      </div>
    </div>
  )
}

interface PlanBadgeProps {
  className?: string
}

export function PlanBadge({ className = '' }: PlanBadgeProps) {
  const { userPlan, loading } = usePlan()

  if (loading || !userPlan) return null

  const config = getBadgeConfig(userPlan.plan)

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.className} ${className}`}>
      <Crown size={12} />
      {userPlan.planName}
    </span>
  )
}

function getBadgeConfig(plan: string): { label: string; className: string } {
  switch (plan) {
    case 'TRIAL':
      return { label: 'Teste', className: 'bg-amber-500/20 text-amber-300 border border-amber-500/30' }
    case 'personal':
      return { label: 'Personal', className: 'bg-blue-500/20 text-blue-300 border border-blue-500/30' }
    case 'premium':
      return { label: 'Elite', className: 'bg-purple-500/20 text-purple-300 border border-purple-500/30' }
    case 'pro':
      return { label: 'Personal', className: 'bg-violet-500/20 text-violet-300 border border-violet-500/30' }
    case 'basic':
      return { label: 'Essencial', className: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' }
    default:
      return { label: 'Free', className: 'bg-white/10 text-white/60 border border-white/20' }
  }
}

interface TrialBannerProps {
  className?: string
}

export function TrialBanner({ className = '' }: TrialBannerProps) {
  const { userPlan, loading } = usePlan()

  if (loading || !userPlan || !userPlan.isTrial) return null

  const daysLeft = userPlan.trialDaysRemaining

  return (
    <div className={`bg-gradient-to-r from-amber-500/10 to-purple-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center gap-3 ${className}`}>
      <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
        <Crown className="text-amber-400" size={20} />
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-amber-300">Teste Premium Ativo!</h4>
        <p className="text-sm text-white/70">
          Você tem {daysLeft} dia{daysLeft !== 1 ? 's' : ''} restantes.
        </p>
      </div>
    </div>
  )
}

interface UseConversionReturn {
  shouldShowUpgrade: boolean
  upgradeReason: 'blocked_feature' | 'trial_expiring' | 'payment_failed' | null
  feature: string | null
  dismissUpgrade: () => void
}

export function useConversion(): UseConversionReturn {
  const { userPlan, loading, canAccess } = usePlan()
  const [upgradeReason, setUpgradeReason] = useState<'blocked_feature' | 'trial_expiring' | 'payment_failed' | null>(null)
  const [feature, setFeature] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState(false)

  const dismissUpgrade = () => {
    setDismissed(true)
    setUpgradeReason(null)
  }

  if (loading || dismissed || !userPlan) {
    return {
      shouldShowUpgrade: false,
      upgradeReason: null,
      feature: null,
      dismissUpgrade
    }
  }

  // Check trial expiring
  if (userPlan.isTrial && userPlan.trialDaysRemaining <= 2 && userPlan.trialDaysRemaining > 0) {
    setUpgradeReason('trial_expiring')
    return {
      shouldShowUpgrade: true,
      upgradeReason: 'trial_expiring',
      feature: null,
      dismissUpgrade
    }
  }

  return {
    shouldShowUpgrade: !!upgradeReason,
    upgradeReason,
    feature,
    dismissUpgrade
  }
}