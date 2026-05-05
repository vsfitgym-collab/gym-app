import { Crown, Sparkles, Star, Zap, Calendar } from 'lucide-react'
import { PLANS, type PlanKey } from '@/lib/supabase'

interface CurrentPlanBadgeProps {
  planId: PlanKey | null | undefined
  endDate?: string | null
  showEndDate?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const planIcons: Record<PlanKey, typeof Zap> = {
  trial: Zap,
  basic: Star,
  pro: Crown,
  premium: Sparkles,
}

const planColors: Record<PlanKey, string> = {
  trial: 'from-blue-500 to-cyan-500',
  basic: 'from-purple-500 to-pink-500',
  pro: 'from-amber-500 to-orange-500',
  premium: 'from-emerald-500 to-teal-500',
}

const planBgColors: Record<PlanKey, string> = {
  trial: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  basic: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  pro: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  premium: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
}

function normalizePlanKey(plan: string | undefined | null): PlanKey | null {
  if (!plan) return null
  const normalized = plan.toLowerCase() as PlanKey
  if (normalized === 'trial' || normalized === 'basic' || normalized === 'pro' || normalized === 'premium') {
    return normalized
  }
  if (normalized === 'basico') return 'basic'
  return null
}

export function CurrentPlanBadge({ 
  planId, 
  endDate, 
  showEndDate = true,
  size = 'md' 
}: CurrentPlanBadgeProps) {
  if (!planId) return null

  const normalizedPlanKey = normalizePlanKey(planId)
  if (!normalizedPlanKey) return null

  const plan = PLANS[normalizedPlanKey]
  const Icon = planIcons[normalizedPlanKey]
  const colorClass = planColors[normalizedPlanKey]
  const bgClass = planBgColors[normalizedPlanKey]

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }

  const formatEndDate = (date: string) => {
    const d = new Date(date)
    const now = new Date()
    const diffTime = d.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays <= 0) return 'Expirado'
    if (diffDays === 1) return 'Expira amanhã'
    if (diffDays <= 7) return `Expira em ${diffDays} dias`
    
    return d.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className={`flex items-center gap-2 rounded-full border ${bgClass} ${sizeClasses[size]}`}>
        <div className={`rounded-full bg-gradient-to-br ${colorClass} p-1`}>
          <Icon className={`text-white ${iconSizes[size]}`} />
        </div>
        <span className="font-semibold">{plan.name}</span>
      </div>

      {showEndDate && endDate && (
        <div className={`flex items-center gap-1 text-xs text-muted-foreground ${size === 'sm' ? 'text-[10px]' : ''}`}>
          <Calendar className="w-3 h-3" />
          <span>{formatEndDate(endDate)}</span>
        </div>
      )}
    </div>
  )
}