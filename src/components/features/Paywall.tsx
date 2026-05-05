import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, Crown, Sparkles, Zap, Gauge, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { PLANS, type FeatureKey, type PlanKey } from '@/lib/supabase'
import { FEATURE_LABELS, FEATURE_TO_PLAN_MAP } from '@/lib/featureGating'

interface PaywallProps {
  feature: FeatureKey
  title?: string
  description?: string
  recommendedPlan?: PlanKey
  showLimitInfo?: boolean
  limitInfo?: {
    remaining: number
    isUnlimited: boolean
  }
}

export function Paywall({ 
  feature, 
  title, 
  description, 
  recommendedPlan = FEATURE_TO_PLAN_MAP[feature] || 'pro',
  showLimitInfo,
  limitInfo
}: PaywallProps) {
  const navigate = useNavigate()
  const featureLabel = FEATURE_LABELS[feature]
  const plan = PLANS[recommendedPlan]

  const getFeatureIcon = () => {
    switch (feature) {
      case 'analytics':
        return <Gauge className="w-5 h-5 text-emerald-500" />
      case 'achievements':
        return <Trophy className="w-5 h-5 text-amber-500" />
      case 'chat_with_trainer':
        return <Crown className="w-5 h-5 text-purple-500" />
      default:
        return <Zap className="w-5 h-5 text-amber-500" />
    }
  }

  const getDefaultTitle = () => {
    if (showLimitInfo && limitInfo && !limitInfo.isUnlimited) {
      return 'Limite de Treinos Atingido'
    }
    return 'Recurso Bloqueado'
  }

  const getDefaultDescription = () => {
    if (showLimitInfo && limitInfo && !limitInfo.isUnlimited) {
      return `Você usou todos os seus ${limitInfo.remaining === 0 ? '' : 'treinos desta semana'}. `
    }
    return `Para acessar "${featureLabel}", faça upgrade para o plano ${plan.name}.`
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center justify-center min-h-[400px] p-6"
    >
      <Card className="max-w-md w-full bg-gradient-to-br from-card to-card/80 border-primary/20">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-primary" />
          </div>

          <h3 className="text-xl font-bold mb-2">
            {title || getDefaultTitle()}
          </h3>
          
          <p className="text-muted-foreground mb-6">
            {description || getDefaultDescription()}
          </p>

          {showLimitInfo && limitInfo && (
            <div className="bg-amber-500/10 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center gap-2 text-amber-600">
                <Gauge className="w-5 h-5" />
                <span className="font-medium">
                  {limitInfo.isUnlimited 
                    ? 'Treinos Ilimitados' 
                    : `${limitInfo.remaining} treinos restantes`}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-3 mb-6">
            {plan.features.slice(0, 2).map((f, idx) => (
              <div key={idx} className="flex items-center gap-3 text-sm text-muted-foreground">
                {getFeatureIcon()}
                <span>{f}</span>
              </div>
            ))}
          </div>

          <Button 
            className="w-full" 
            onClick={() => navigate('/upgrade')}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            fazer Upgrade para {plan.name}
          </Button>

          <p className="text-xs text-muted-foreground mt-4">
            A partir de R$ {plan.price.toFixed(2)}/mês
          </p>
        </CardContent>
      </Card>
    </motion.div>
  )
}