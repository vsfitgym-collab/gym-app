import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import Stripe from 'https://esm.sh/stripe@14.14.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

interface PlanConfig {
  name: string
  priceId: string
  price: number
  features: string[]
}

const PLAN_CONFIG: Record<string, PlanConfig> = {
  basic: {
    name: 'Plano Essencial',
    priceId: Deno.env.get('STRIPE_BASIC_PRICE_ID') || 'price_basic_xxx',
    price: 2990,
    features: ['workouts', 'library']
  },
  pro: {
    name: 'Plano Personal',
    priceId: Deno.env.get('STRIPE_PRO_PRICE_ID') || 'price_pro_xxx',
    price: 4990,
    features: ['workouts', 'library', 'chat', 'custom_workout']
  },
  premium: {
    name: 'Plano Elite',
    priceId: Deno.env.get('STRIPE_PREMIUM_PRICE_ID') || 'price_premium_xxx',
    price: 7990,
    features: ['workouts', 'library', 'chat', 'custom_workout', 'priority']
  }
}

function getPlanFromPriceId(priceId: string): string | null {
  for (const [plan, config] of Object.entries(PLAN_CONFIG)) {
    if (config.priceId === priceId) {
      return plan
    }
  }
  return null
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseKey)

  const url = new URL(req.url)
  const path = url.pathname

  try {
    // POST /create-checkout-session
    if (req.method === 'POST' && path === '/create-checkout-session') {
      const body = await req.json()
      const { plan, userId, successUrl, cancelUrl } = body

      if (!plan || !PLAN_CONFIG[plan]) {
        return new Response(
          JSON.stringify({ error: 'Plano inválido' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const config = PLAN_CONFIG[plan]

      // Get or create Stripe customer
      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id, email, name')
        .eq('id', userId)
        .single()

      let customerId = profile?.stripe_customer_id

      if (!customerId) {
        // Create customer in Stripe
        const customer = await stripe.customers.create({
          email: profile?.email,
          name: profile?.name,
          metadata: {
            supabase_user_id: userId
          }
        })
        customerId = customer.id

        // Save customer ID to profile
        await supabase
          .from('profiles')
          .update({ stripe_customer_id: customerId })
          .eq('id', userId)
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: config.priceId,
            quantity: 1
          }
        ],
        success_url: successUrl || `${url.origin}/success?plan=${plan}`,
        cancel_url: cancelUrl || `${url.origin}/plans`,
        metadata: {
          user_id: userId,
          plan
        }
      })

      return new Response(
        JSON.stringify({ url: session.url }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST /create-portal-session
    if (req.method === 'POST' && path === '/create-portal-session') {
      const body = await req.json()
      const { customerId, returnUrl } = body

      if (!customerId) {
        return new Response(
          JSON.stringify({ error: 'Customer ID required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl || `${url.origin}/plans`
      })

      return new Response(
        JSON.stringify({ url: session.url }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})