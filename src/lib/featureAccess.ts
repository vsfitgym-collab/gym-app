import { useAuth } from '../context/AuthContext'
import { useSubscription } from '../hooks/useSubscription'

export type UserRole = 'aluno' | 'personal'

export interface FeatureAccessContext {
  role: UserRole
  plan: string
  isPremium: boolean
  isPersonal: boolean
}

export function hasFeatureAccess(
  role: UserRole,
  plan?: string,
  requirePlan: 'basic' | 'premium' = 'premium'
): boolean {
  if (role === 'personal') {
    return true
  }

  if (plan === 'premium' || plan === 'pro') {
    return true
  }

  if (requirePlan === 'basic' && plan === 'basic') {
    return true
  }

  return false
}

export function useFeatureAccess() {
  const { role } = useAuth()
  const { isPremium, plan } = useSubscription()

  return {
    role,
    plan,
    isPremium,
    isPersonal: role === 'personal',
    hasAccess: (requirePlan: 'basic' | 'premium' = 'premium') =>
      hasFeatureAccess(role, plan, requirePlan),
  }
}

export function useCanAccessFeature(feature: 'chat' | 'finance' | 'export' | 'analytics') {
  const { role } = useAuth()
  const { plan } = useSubscription()

  if (role === 'personal') {
    return true
  }

  switch (feature) {
    case 'chat':
      return true
    case 'finance':
    case 'export':
    case 'analytics':
      return hasFeatureAccess('aluno', plan, 'premium')
    default:
      return false
  }
}

export function canPersonalAccessAll(): boolean {
  return true
}