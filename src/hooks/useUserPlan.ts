import { usePlan, PLAN_FEATURES, PLAN_PRICES, PLAN_DESCRIPTIONS } from '../context/PlanContext'

export { usePlan, PLAN_FEATURES, PLAN_PRICES, PLAN_DESCRIPTIONS }

export function useCanAccess() {
  const { canAccess, userPlan, loading } = usePlan()

  return {
    canAccess,
    loading,
    plan: userPlan?.plan || 'FREE_LIMITED',
    isTrial: userPlan?.isTrial || false,
    isPersonal: userPlan?.plan === 'personal',
    isFree: userPlan?.plan === 'FREE_LIMITED',

    canAccessChat: () => canAccess('chat'),
    canAccessCustomWorkout: () => canAccess('custom_workout'),
    canAccessPriority: () => canAccess('priority'),
    canAccessAnalytics: () => canAccess('analytics'),
  }
}