import { ReactNode } from 'react'
import { useFeatureAccess, useWorkoutsLimitCheck } from '@/hooks/useFeatureAccess'
import { LockedScreen } from './LockedScreen'
import { Loading } from '@/components/ui/Loading'
import { type FeatureKey } from '@/lib/supabase'
import { FEATURE_CONFIG } from '@/lib/featureGating'

interface FeatureGuardProps {
  feature: FeatureKey
  children: ReactNode
  fallback?: ReactNode
  title?: string
  description?: string
  recommendedPlan?: 'basic' | 'pro' | 'premium'
  showLimitInfo?: boolean
}

export function FeatureGuard({
  feature,
  children,
  fallback,
  title,
  description,
}: FeatureGuardProps) {
  const { hasAccess, loading } = useFeatureAccess(feature)
  const { canDoWorkout } = useWorkoutsLimitCheck()

  if (loading) {
    return <Loading />
  }

  const shouldShowPaywall = feature === 'workouts_limit' 
    ? !canDoWorkout 
    : !hasAccess

  if (shouldShowPaywall) {
    if (fallback) {
      return <>{fallback}</>
    }

    const featureLabel = FEATURE_CONFIG[feature]?.label

    return (
      <LockedScreen 
        featureName={featureLabel}
        title={title || 'Recurso bloqueado'}
        message={description || `Esse recurso está disponível apenas em planos superiores`}
      />
    )
  }

  return <>{children}</>
}

interface FeatureGuardWithCallbackProps extends FeatureGuardProps {
  onAccessDenied?: () => void
}

export function FeatureGuardWithCallback({
  feature,
  children,
  fallback,
  title,
  description,
  onAccessDenied
}: FeatureGuardWithCallbackProps) {
  const { hasAccess, loading } = useFeatureAccess(feature)
  const { canDoWorkout } = useWorkoutsLimitCheck()

  if (loading) {
    return <Loading />
  }

  const shouldShowPaywall = feature === 'workouts_limit' 
    ? !canDoWorkout 
    : !hasAccess

  if (shouldShowPaywall) {
    if (fallback) {
      return <>{fallback}</>
    }

    onAccessDenied?.()

    const featureLabel = FEATURE_CONFIG[feature]?.label

    return (
      <LockedScreen 
        featureName={featureLabel}
        title={title || 'Recurso bloqueado'}
        message={description || `Esse recurso está disponível apenas em planos superiores`}
      />
    )
  }

  return <>{children}</>
}