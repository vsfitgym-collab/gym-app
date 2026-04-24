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

  // ===== POST /sync-subscription =====
  if (req.method === 'POST' && path === '/sync-subscription') {
    try {
      const body = await req.json()
      const { userId } = body

      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'userId required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError || !profile) {
        return new Response(
          JSON.stringify({ error: 'Profile not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // If no Stripe customer, just return current state
      if (!profile.stripe_customer_id) {
        return new Response(
          JSON.stringify({
            success: true,
            plan: profile.plan,
            status: profile.is_trial_active && profile.trial_ends_at > new Date() ? 'trial' : 
                  profile.plan && profile.plan_expires_at > new Date() ? 'active' : 'free',
            expires_at: profile.plan_expires_at
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get active subscription from Stripe
      const subscriptions = await stripe.subscriptions.list({
        customer: profile.stripe_customer_id,
        status: 'active',
        limit: 1
      })

      if (subscriptions.data.length === 0) {
        // No active subscription - could be cancelled
        return new Response(
          JSON.stringify({
            success: true,
            plan: null,
            status: profile.plan ? 'expired' : 'free',
            expires_at: null
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const subscription = subscriptions.data[0]
      const plan = PLAN_PRICE_MAP[subscription.items.data[0]?.price?.id || ''] || null
      const periodEnd = new Date(subscription.current_period_end * 1000)

      // Update profile
      await supabase
        .from('profiles')
        .update({
          plan: plan,
          plan_expires_at: periodEnd.toISOString(),
          stripe_subscription_id: subscription.id
        })
        .eq('id', userId)

      return new Response(
        JSON.stringify({
          success: true,
          plan: plan,
          status: 'active',
          expires_at: periodEnd.toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } catch (error) {
      console.error('Sync error:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  }

  // ===== POST /get-subscription-status =====
  if (req.method === 'POST' && path === '/get-subscription-status') {
    try {
      const body = await req.json()
      const { userId } = body

      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'userId required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('plan, plan_expires_at, is_trial_active, trial_ends_at')
        .eq('id', userId)
        .single()

      if (!profile) {
        return new Response(
          JSON.stringify({ 
            plan: null,
            trial: false,
            active: false,
            status: 'not_found'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const now = new Date()
      const trialActive = profile.is_trial_active && profile.trial_ends_at && new Date(profile.trial_ends_at) > now
      const planActive = profile.plan && profile.plan_expires_at && new Date(profile.plan_expires_at) > now

      return new Response(
        JSON.stringify({
          plan: profile.plan,
          trial: trialActive,
          active: trialActive || planActive,
          status: trialActive ? 'trial' : planActive ? 'active' : 'free',
          expires_at: trialActive ? profile.trial_ends_at : profile.plan_expires_at
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } catch (error) {
      console.error('Status error:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  }

  return new Response(
    JSON.stringify({ error: 'Not found' }),
    { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})