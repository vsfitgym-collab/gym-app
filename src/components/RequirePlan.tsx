import { ReactNode, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlan } from '../context/PlanContext'
import { Lock, Crown } from 'lucide-react'

interface RequirePlanProps {
  feature: string
  children: ReactNode
  fallback?: ReactNode
}

export function RequirePlan({ feature, children, fallback }: RequirePlanProps) {
  const { canAccess, userPlan, loading } = usePlan()
  const navigate = useNavigate()

  const hasAccess = canAccess(feature)

  if (loading) {
    return (
      <div className="animate-pulse bg-white/5 rounded-xl h-32">
        <div className="h-full w-full flex items-center justify-center">
          <span className="text-white/40">Verificando acesso...</span>
        </div>
      </div>
    )
  }

  if (hasAccess) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  return (
    <div className="relative overflow-hidden rounded-xl">
      <div className="absolute inset-0 filter blur-md opacity-30 pointer-events-none">
        {children}
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-black/80 to-slate-900/90 flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm">
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500/20 to-purple-500/20 flex items-center justify-center mb-4 border border-amber-500/30">
          <Lock className="text-amber-400" size={28} />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">
          Recurso Exclusivo
        </h3>
        <p className="text-sm text-slate-300 mb-6 max-w-[250px]">
          Este recurso está disponível no Plano Personal ou superior.
        </p>
        <button
          onClick={() => navigate('/planos')}
          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold rounded-xl shadow-lg transition-all hover:scale-105"
        >
          <Crown size={16} />
          Ver Planos
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
  const navigate = useNavigate()

  if (loading) return null
  if (!userPlan) return null

  const badgeConfig = getBadgeConfig(userPlan.plan)

  return (
    <button
      onClick={() => navigate('/planos')}
      className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${badgeConfig.className} ${className}`}
    >
      <Crown size={12} />
      {badgeConfig.label}
    </button>
  )
}

function getBadgeConfig(plan: string): { label: string; className: string } {
  switch (plan) {
    case 'TRIAL':
      return { label: 'Teste Premium', className: 'bg-gradient-to-r from-amber-500/20 to-purple-500/20 text-amber-300 border border-amber-500/30' }
    case 'personal':
      return { label: 'Personal', className: 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 border border-blue-500/30' }
    case 'premium':
      return { label: 'Elite', className: 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/30' }
    case 'pro':
      return { label: 'Personal', className: 'bg-gradient-to-r from-violet-500/20 to-indigo-500/20 text-violet-300 border border-violet-500/30' }
    case 'basic':
      return { label: 'Essencial', className: 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/30' }
    default:
      return { label: 'Free', className: 'bg-white/10 text-white/60 border border-white/20' }
  }
}

export function TrialBanner() {
  const { userPlan, loading } = usePlan()

  if (loading || !userPlan || !userPlan.isTrial) return null

  const daysLeft = userPlan.trialDaysRemaining

  return (
    <div className="bg-gradient-to-r from-amber-500/10 to-purple-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
        <Crown className="text-amber-400" size={20} />
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-amber-300">Teste Premium Ativo!</h4>
        <p className="text-sm text-white/70">
          Você tem {daysLeft} dia{daysLeft !== 1 ? 's' : ''} restantes para aproveitar todos os recursos.
        </p>
      </div>
    </div>
  )
}

export function UpgradePrompt({ feature }: { feature: string }) {
  const navigate = useNavigate()

  return (
    <div className="bg-slate-800/50 rounded-xl p-6 text-center">
      <Lock className="w-12 h-12 mx-auto mb-4 text-amber-400" />
      <h3 className="text-lg font-bold text-white mb-2">
        Desbloqueie {getFeatureName(feature)}
      </h3>
      <p className="text-sm text-slate-400 mb-4">
        Esse recurso está disponível no Plano Personal.
      </p>
      <div className="flex gap-3 justify-center">
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 text-sm text-slate-400 hover:text-white"
        >
          Voltar
        </button>
        <button
          onClick={() => navigate('/planos')}
          className="px-4 py-2 text-sm bg-amber-500 hover:bg-amber-400 text-white rounded-lg font-medium"
        >
          Ver Planos
        </button>
      </div>
    </div>
  )
}

function getFeatureName(feature: string): string {
  const names: Record<string, string> = {
    chat: 'o Chat',
    custom_workout: 'Treinos Personalizados',
    priority: 'Atendimento Prioritário',
    analytics: 'Relatórios Avançados',
  }
  return names[feature] || 'este recurso'
}