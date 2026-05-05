import { Check, X, Zap, Star, Crown, Sparkles } from 'lucide-react'
import { PLANS, type PlanKey, type FeatureKey, FEATURE_LABELS } from '@/lib/supabase'

interface PlanComparisonTableProps {
  currentPlan?: PlanKey | null
  onSelectPlan?: (plan: PlanKey) => void
}

interface FeatureConfig {
  key: FeatureKey
  label: string
  basic: boolean | string
  pro: boolean | string
  premium: boolean | string
}

const comparisonFeatures: FeatureConfig[] = [
  { 
    key: 'workouts_limit', 
    label: 'Treinos por semana', 
    basic: '3', 
    pro: 'Ilimitado', 
    premium: 'Ilimitado' 
  },
  { 
    key: 'progress_tracking', 
    label: 'Acompanhamento de Progresso', 
    basic: true, 
    pro: true, 
    premium: true 
  },
  { 
    key: 'analytics', 
    label: 'Analytics Avançado', 
    basic: false, 
    pro: false, 
    premium: true 
  },
  { 
    key: 'chat_with_trainer', 
    label: 'Chat com Personal', 
    basic: false, 
    pro: true, 
    premium: true 
  },
  
  { 
    key: 'achievements', 
    label: 'Conquistas', 
    basic: false, 
    pro: true, 
    premium: true 
  },
]

const planIcons = {
  trial: Zap,
  basic: Star,
  pro: Crown,
  premium: Sparkles,
}

const planColors = {
  trial: 'text-blue-500',
  basic: 'text-purple-500',
  pro: 'text-amber-500',
  premium: 'text-emerald-500',
}

export function PlanComparisonTable({ currentPlan, onSelectPlan }: PlanComparisonTableProps) {
  const renderValue = (value: boolean | string) => {
    if (typeof value === 'string') {
      return <span className="text-sm font-medium">{value}</span>
    }
    return value ? (
      <Check className="w-5 h-5 text-emerald-500" />
    ) : (
      <X className="w-5 h-5 text-muted-foreground/40" />
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px]">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-4 px-4 font-medium text-muted-foreground">Recursos</th>
            {(['trial', 'basic', 'pro', 'premium'] as PlanKey[]).map((planKey) => {
              const plan = PLANS[planKey]
              const Icon = planIcons[planKey]
              const isCurrent = currentPlan === planKey
              
              return (
                <th 
                  key={planKey} 
                  className={`text-center py-4 px-4 ${isCurrent ? 'bg-primary/5' : ''}`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Icon className={`w-6 h-6 ${planColors[planKey]}`} />
                    <span className="font-semibold">{plan.name}</span>
                    {isCurrent && (
                      <span className="text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-full">
                        Atual
                      </span>
                    )}
                    <span className="text-lg font-bold">
                      {plan.price === 0 ? 'Grátis' : `R$${plan.price}`}
                    </span>
                  </div>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {comparisonFeatures.map((feature, idx) => (
            <tr 
              key={feature.key} 
              className={`border-b border-border/50 ${idx % 2 === 0 ? 'bg-background' : 'bg-background/50'}`}
            >
              <td className="py-3 px-4 font-medium">{feature.label}</td>
              <td className="text-center py-3 px-4">
                {renderValue(feature.basic === true ? false : feature.basic === '3' ? true : feature.basic)}
              </td>
              <td className="text-center py-3 px-4">
                {renderValue(feature.basic === true ? true : feature.basic === '3' ? false : feature.pro)}
              </td>
              <td className="text-center py-3 px-4">
                {renderValue(feature.premium)}
              </td>
              <td className="text-center py-3 px-4 bg-primary/5">
                {renderValue(feature.premium)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td className="py-4 px-4"></td>
            {(['trial', 'basic', 'pro', 'premium'] as PlanKey[]).map((planKey) => {
              const isCurrent = currentPlan === planKey
              return (
                <td key={planKey} className={`text-center py-4 px-4 ${isCurrent ? 'bg-primary/5' : ''}`}>
                  {isCurrent ? (
                    <span className="text-sm text-muted-foreground">Plano ativo</span>
                  ) : (
                    <button
                      onClick={() => onSelectPlan?.(planKey)}
                      className="text-sm text-primary hover:underline"
                    >
                      {planKey === 'trial' ? 'Experimentar' : 'Assinar'}
                    </button>
                  )}
                </td>
              )
            })}
          </tr>
        </tfoot>
      </table>
    </div>
  )
}