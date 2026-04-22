export function isPremium(plan?: string): boolean {
  if (!plan) return false
  return plan === 'premium' || plan === 'pro'
}

export function isBasic(plan?: string): boolean {
  if (!plan) return false
  return plan === 'basic'
}

export function isFree(plan?: string): boolean {
  if (!plan) return true
  return plan === 'free' || (!isPremium(plan) && !isBasic(plan))
}

export function isPlanActive(expiresAt?: string | null): boolean {
  if (!expiresAt) return true
  return new Date(expiresAt) > new Date()
}

export function getPlanLabel(plan?: string): string {
  switch (plan) {
    case 'premium':
      return 'Premium'
    case 'pro':
      return 'Pro'
    case 'basic':
      return 'Básico'
    case 'free':
      return 'Gratuito'
    default:
      return 'Plano'
  }
}