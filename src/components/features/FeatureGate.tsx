import { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, Crown, Sparkles, Zap, Gauge, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { usePlanAccess } from '@/hooks/usePlanAccess'
import { FEATURE_LABELS, FEATURE_DESCRIPTIONS, FEATURE_TO_PLAN_MAP } from '@/config/planFeatures'
import { cn } from '@/lib/utils'

interface FeatureGateProps {
  feature: string
  children: ReactNode
  fallback?: ReactNode
  showOverlay?: boolean
  blurContent?: boolean
}

const getFeatureIcon = (feature: string) => {
  switch (feature) {
    case 'analytics':
      return <Gauge className="w-5 h-5 text-emerald-500" />
    case 'achievements':
      return <Trophy className="w-5 h-5 text-amber-500" />
    case 'chat_with_trainer':
      return <Crown className="w-5 h-5 text-purple-500" />
    case 'progress_tracking':
      return <Zap className="w-5 h-5 text-amber-500" />
    default:
      return <Zap className="w-5 h-5 text-amber-500" />
  }
}

const getRecommendedPlan = (feature: string): string => {
  return FEATURE_TO_PLAN_MAP[feature] || 'premium'
}

export function FeatureGate({ 
  feature, 
  children, 
  fallback,
  showOverlay = true,
  blurContent = true
}: FeatureGateProps) {
  const navigate = useNavigate()
  const { canAccess, getFeatureLabel, getFeatureDescription } = usePlanAccess()
  
  const hasAccess = canAccess(feature)
  
  if (hasAccess) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  const featureLabel = getFeatureLabel(feature)
  const featureDescription = getFeatureDescription(feature)
  const requiredPlan = getRecommendedPlan(feature)
  const requiredPlanLabel = requiredPlan === 'premium' ? 'Premium' : requiredPlan === 'pro' ? 'Pro' : 'Básico'

  if (showOverlay && blurContent) {
    return (
      <div className="relative">
        <div className="filter blur-md pointer-events-none select-none opacity-50">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Card className="max-w-md w-full bg-gradient-to-br from-card to-card/80 border-primary/20">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Lock className="w-8 h-8 text-primary" />
              </div>

              <h3 className="text-xl font-bold mb-2">
                {featureLabel} Bloqueado
              </h3>
              
              <p className="text-muted-foreground mb-4">
                {featureDescription}
              </p>
              
              <p className="text-sm text-muted-foreground mb-6">
                Faça upgrade para o plano <span className="font-semibold text-primary">{requiredPlanLabel}</span> para desbloquear
              </p>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  {getFeatureIcon(feature)}
                  <span>{featureDescription}</span>
                </div>
              </div>

              <Button 
                className="w-full" 
                onClick={() => navigate('/upgrade')}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Upgrade para {requiredPlanLabel}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <Card className="max-w-md w-full bg-gradient-to-br from-card to-card/80 border-primary/20">
      <CardContent className="p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Lock className="w-8 h-8 text-primary" />
        </div>

        <h3 className="text-xl font-bold mb-2">
          {featureLabel} Bloqueado
        </h3>
        
        <p className="text-muted-foreground mb-6">
          {featureDescription}. Faça upgrade para o plano {requiredPlanLabel}.
        </p>

        <Button 
          className="w-full" 
          onClick={() => navigate('/upgrade')}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Upgrade para {requiredPlanLabel}
        </Button>
      </CardContent>
    </Card>
  )
}

interface FeatureGateWithCallbackProps extends FeatureGateProps {
  onAccessDenied?: () => void
}

export function FeatureGateWithCallback({ 
  feature, 
  children, 
  onAccessDenied
}: FeatureGateWithCallbackProps) {
  const { canAccess } = usePlanAccess()
  const hasAccess = canAccess(feature)
  
  if (!hasAccess) {
    onAccessDenied?.()
  }

  return hasAccess ? <>{children}</> : null
}