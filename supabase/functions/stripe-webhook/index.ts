import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import Stripe from 'https://esm.sh/stripe@14.14.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

const PLAN_PRICE_MAP: Record<string, string> = {
  [Deno.env.get('STRIPE_BASIC_PRICE_ID') || '']: 'basic',
  [Deno.env.get('STRIPE_PRO_PRICE_ID') || '']: 'pro',
  [Deno.env.get('STRIPE_PREMIUM_PRICE_ID') || '']: 'premium'
}

const PLAN_PRICES: Record<string, number> = {
  'basic': 29.90,
  'pro': 49.90,
  'premium': 79.90
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

function logStructured(event: Stripe.Event, data: Record<string, unknown>) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    event_type: event.type,
    ...data
  }))
}

function logUserEvent(supabase: any, userId: string, eventType: string, metadata: Record<string> = {}) {
  supabase.from('user_events').insert({ user_id: userId, event_type: eventType, metadata })
}

function getPlanFromSubscription(subscription: Stripe.Subscription): string | null {
  const items = subscription.items.data
  if (items.length === 0) return null
  const priceId = items[0].price?.id
  if (!priceId) return null
  return PLAN_PRICE_MAP[priceId] || null
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseKey)

  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return new Response(
      JSON.stringify({ error: 'Invalid signature' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // ===== IDEMPOTENCY CHECK =====
  const { data: existingEvent } = await supabase
    .from('stripe_events')
    .select('id')
    .eq('id', event.id)
    .single()

  if (existingEvent) {
    logStructured(event, { status: 'duplicate', event_id: event.id })
    return new Response(
      JSON.stringify({ received: true, status: 'duplicate' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Save event first
  await supabase
    .from('stripe_events')
    .insert({
      id: event.id,
      type: event.type,
      created_at: new Date().toISOString()
    })

  logStructured(event, { status: 'processing', event_id: event.id })

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        let userId = session.metadata?.user_id
        const customerId = session.customer as string
        const subscriptionId = session.subscription as string

        if (!userId && customerId) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('stripe_customer_id', customerId)
            .single()
          
          if (profile) {
            userId = profile.id
          }
        }

        if (!userId) {
          logStructured(event, { error: 'no_user_id', session_id: session.id })
          break
        }

        // Save customer info
        await supabase
          .from('profiles')
          .update({
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            last_stripe_event_ts: event.created
          })
          .eq('id', userId)

        logUserEvent(supabase, userId, 'checkout_completed', { customer_id: customerId })
        logStructured(event, { user_id: userId, action: 'customer_saved' })
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        
        const customerId = invoice.customer as string
        const subscriptionId = invoice.subscription as string

        if (!subscriptionId) break

        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const plan = getPlanFromSubscription(subscription)
        
        if (!plan) {
          logStructured(event, { error: 'unknown_plan', subscription_id: subscriptionId })
          break
        }

        const periodEnd = new Date(subscription.current_period_end * 1000)

        let userId = (invoice as any).metadata?.user_id

        if (!userId) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('stripe_customer_id', customerId)
            .single()
          
          if (profile) {
            userId = profile.id
          }
        }

        if (!userId) {
          logStructured(event, { error: 'user_not_found', customer_id: customerId })
          break
        }

        // Update profile with subscription (with locking)
        await supabase
          .from('profiles')
          .update({
            plan: plan,
            plan_expires_at: periodEnd.toISOString(),
            stripe_subscription_id: subscriptionId,
            subscription_status: 'active',
            is_trial_active: false,
            last_stripe_event_ts: event.created
          })
          .eq('id', userId)

        await supabase
          .from('subscriptions')
          .upsert({
            user_id: profile.id,
            plan: plan,
            status: 'active',
            start_date: new Date().toISOString(),
            end_date: periodEnd.toISOString(),
            external_subscription_id: subscriptionId,
            stripe_customer_id: customerId
          })

        logUserEvent(supabase, profile.id, 'payment_success', { plan, amount: invoice.amount_paid })
        logStructured(event, { user_id: profile.id, plan, action: 'subscription_activated' })
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const subscriptionId = subscription.id

        const plan = getPlanFromSubscription(subscription)
        const periodEnd = new Date(subscription.current_period_end * 1000)
        
        const statusMap: Record<string, string> = {
          'active': 'active',
          'past_due': 'past_due',
          'canceled': 'canceled',
          'incomplete': 'incomplete',
          'trialing': 'trialing'
        }
        const newStatus = statusMap[subscription.status] || 'pending'

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_subscription_id', subscriptionId)
          .single()

        if (!profile) {
          logStructured(event, { error: 'profile_not_found', subscription_id: subscriptionId })
          break
        }

        // Handle grace period for past_due
        let gracePeriod = null
        if (subscription.status === 'past_due') {
          gracePeriod = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
        }

        await supabase
          .from('profiles')
          .update({
            plan: plan,
            plan_expires_at: periodEnd.toISOString(),
            subscription_status: newStatus,
            grace_period_until: gracePeriod,
            last_stripe_event_ts: event.created
          })
          .eq('id', profile.id)

        await supabase
          .from('subscriptions')
          .update({
            plan: plan,
            status: newStatus,
            end_date: periodEnd.toISOString()
          })
          .eq('external_subscription_id', subscriptionId)

        logUserEvent(supabase, profile.id, 'subscription_updated', { plan, status: newStatus })
        logStructured(event, { user_id: profile.id, plan, status: newStatus })
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const subscriptionId = subscription.id

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_subscription_id', subscriptionId)
          .single()

        if (!profile) {
          logStructured(event, { error: 'profile_not_found', subscription_id: subscriptionId })
          break
        }

        // Check cancel_at_period_end
        const shouldCancelNow = !subscription.cancel_at_period_end

        if (shouldCancelNow) {
          await supabase
            .from('profiles')
            .update({
              plan: null,
              plan_expires_at: new Date().toISOString(),
              stripe_subscription_id: null,
              subscription_status: 'canceled',
              is_trial_active: false,
              last_stripe_event_ts: event.created
            })
            .eq('id', profile.id)
        } else {
          // Will cancel at period end - don't remove access yet
          await supabase
            .from('profiles')
            .update({
              subscription_status: 'canceled',
              last_stripe_event_ts: event.created
            })
            .eq('id', profile.id)
        }

        await supabase
          .from('subscriptions')
          .update({ status: 'canceled' })
          .eq('external_subscription_id', subscriptionId)

        logUserEvent(supabase, profile.id, 'subscription_canceled', { immediate: shouldCancelNow })
        logStructured(event, { user_id: profile.id, action: 'subscription_canceled' })
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        // Try metadata first, then fallback to customer lookup
        let userId = (invoice as any).metadata?.user_id

        if (!userId && customerId) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('stripe_customer_id', customerId)
            .single()
          
          if (profile) {
            userId = profile.id
          }
        }

        if (userId) {
          await supabase
            .from('profiles')
            .update({
              subscription_status: 'past_due',
              grace_period_until: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
              last_stripe_event_ts: event.created
            })
            .eq('id', userId)

          logUserEvent(supabase, userId, 'payment_failed', { invoice_id: invoice.id })
        }

        logStructured(event, { customer_id: customerId, action: 'payment_failed_alert' })
        break
      }

      default:
        logStructured(event, { status: 'unhandled' })
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})