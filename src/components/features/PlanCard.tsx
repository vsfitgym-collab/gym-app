import { LucideIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Check, Zap, Star, Crown, Sparkles } from 'lucide-react'
import { PLANS, type PlanKey, type FeatureKey } from '@/lib/supabase'

interface PlanCardProps {
  planKey: PlanKey
  isCurrentPlan: boolean
  isPopular?: boolean
  onSelect: (planKey: PlanKey) => void
  features?: FeatureKey[]
}

const planIcons: Record<PlanKey, LucideIcon> = {
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

export function PlanCard({ 
  planKey, 
  isCurrentPlan, 
  isPopular = false,
  onSelect,
  features 
}: PlanCardProps) {
  const plan = PLANS[planKey]
  const Icon = planIcons[planKey]
  const colorClass = planColors[planKey]

  const displayFeatures = features 
    ? features.map(f => {
        const featureMap: Partial<Record<FeatureKey, string>> = {
          workouts_limit: '3 Treinos por Semana',
          analytics: 'Analytics Avançado',
          chat_with_trainer: 'Chat com Personal',
          progress_tracking: 'Acompanhamento de Progresso',
          achievements: 'Conquistas',
        }
        return featureMap[f] || f
      })
    : plan.features

  return (
    <Card 
      variant={isPopular ? "default" : "glass"}
      className={`relative h-full flex flex-col ${isPopular ? 'border-primary/50 shadow-lg shadow-primary/10' : ''}`}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-medium rounded-full shadow-md">
          Mais Popular
        </div>
      )}

      {isCurrentPlan && (
        <div className="absolute -top-3 right-4 px-3 py-1 bg-emerald-500 text-white text-xs font-medium rounded-full">
          Plano Atual
        </div>
      )}

      <CardHeader className="text-center pb-4">
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${colorClass} flex items-center justify-center mx-auto mb-4 shadow-lg`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
        <CardTitle className="text-xl">{plan.name}</CardTitle>
        <CardDescription className="text-xs mt-1 px-4">
          {plan.description}
        </CardDescription>
        <div className="mt-3">
          {plan.price === 0 ? (
            <span className="text-3xl font-bold">Grátis</span>
          ) : (
            <>
              <span className="text-3xl font-bold">R$ {plan.price.toFixed(2)}</span>
              <span className="text-sm text-muted-foreground">/mês</span>
            </>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        <ul className="space-y-3">
          {displayFeatures.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm">
              <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter className="pt-4">
        <Button 
          className="w-full" 
          variant={isCurrentPlan ? "outline" : isPopular ? "gradient" : "default"}
          onClick={() => onSelect(planKey)}
          disabled={isCurrentPlan}
        >
          {isCurrentPlan 
            ? 'Plano Ativo' 
            : planKey === 'trial' 
              ? 'Experimentar Grátis' 
              : 'Assinar'
          }
        </Button>
      </CardFooter>
    </Card>
  )
}