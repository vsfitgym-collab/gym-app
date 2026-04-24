import { supabase } from './supabase'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const STRIPE_FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`

interface CheckoutRequest {
  plan: 'basic' | 'pro' | 'premium'
  userId: string
  successUrl?: string
  cancelUrl?: string
}

interface PortalRequest {
  customerId: string
  returnUrl?: string
}

export async function createCheckoutSession(request: CheckoutRequest): Promise<string> {
  const response = await fetch(`${STRIPE_FUNCTIONS_URL}/stripe-checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(request),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Failed to create checkout session')
  }

  return data.url
}

export async function createPortalSession(request: PortalRequest): Promise<string> {
  const response = await fetch(`${STRIPE_FUNCTIONS_URL}/stripe-checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(request),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Failed to create portal session')
  }

  return data.url
}

export async function syncSubscription(userId: string): Promise<{
  success: boolean
  plan: string | null
  status: string
  expires_at: string | null
}> {
  const response = await fetch(`${STRIPE_FUNCTIONS_URL}/stripe-sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ userId }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Failed to sync subscription')
  }

  return data
}

export async function getSubscriptionStatus(userId: string): Promise<{
  plan: string | null
  trial: boolean
  active: boolean
  status: string
  expires_at: string | null
}> {
  const response = await fetch(`${STRIPE_FUNCTIONS_URL}/stripe-sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ userId }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Failed to get subscription status')
  }

  return data
}

export async function getStripeCustomerId(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single()

  if (error || !data) {
    return null
  }

  return data.stripe_customer_id
}

export interface PlanDetails {
  id: string
  name: string
  price: number
  priceId: string
  features: string[]
}

export const PLAN_DETAILS: Record<string, PlanDetails> = {
  basic: {
    id: 'basic',
    name: 'Plano Essencial',
    price: 29.9,
    priceId: import.meta.env.VITE_STRIPE_BASIC_PRICE_ID || 'price_basic',
    features: ['Treinos prontos', 'Biblioteca de exercícios']
  },
  pro: {
    id: 'pro',
    name: 'Plano Personal',
    price: 49.9,
    priceId: import.meta.env.VITE_STRIPE_PRO_PRICE_ID || 'price_pro',
    features: ['Treino personalizado', 'Chat com personal', 'Ajustes contínuos']
  },
  premium: {
    id: 'premium',
    name: 'Plano Elite',
    price: 79.9,
    priceId: import.meta.env.VITE_STRIPE_PREMIUM_PRICE_ID || 'price_premium',
    features: ['Tudo do Personal', 'Prioridade no atendimento', 'Ajustes mais frequentes']
  }
}