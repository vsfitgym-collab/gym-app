// Follow this setup guide to integrate the Deno runtime with your Supabase project:
// https://supabase.com/docs/guides/functions

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const MERCADO_PAGO_TOKEN = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN') || ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const planPrices: Record<string, number> = {
  basic: 14.90,
  premium: 29.90,
}

const ALLOWED_PLANS = ['basic', 'premium']
const MAX_REQUESTS_PER_MINUTE = 5

const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(identifier: string): boolean {
  const now = Date.now()
  const windowKey = Math.floor(now / 60000)
  const key = `${identifier}:${windowKey}`
  
  const record = rateLimitStore.get(key)
  
  if (!record || record.resetAt < now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + 60000 })
    return true
  }

  if (record.count >= MAX_REQUESTS_PER_MINUTE) {
    return false
  }

  record.count += 1
  return true
}

function sanitizeInput(input: string): string {
  return input.trim().slice(0, 100).replace(/[<>'"]/g, '')
}

function isValidPlan(plan: string): boolean {
  return ALLOWED_PLANS.includes(plan)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Verify authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Rate limiting by user ID
    if (!checkRateLimit(user.id)) {
      return new Response(JSON.stringify({ error: 'Too many requests. Try again later.' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Parse and validate request body
    let body: { plan?: string }
    try {
      body = await req.json()
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { plan } = body

    // Validate plan parameter
    if (!plan || typeof plan !== 'string') {
      return new Response(JSON.stringify({ error: 'Plan is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const sanitizedPlan = sanitizeInput(plan)
    
    if (!isValidPlan(sanitizedPlan)) {
      return new Response(JSON.stringify({ error: 'Invalid plan selected' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const amount = planPrices[sanitizedPlan]
    if (!amount || amount <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid plan price' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Create PIX payment via Mercado Pago
    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MERCADO_PAGO_TOKEN}`,
      },
      body: JSON.stringify({
        transaction_amount: amount,
        description: `Plano ${sanitizedPlan === 'basic' ? 'Básico' : 'Premium'} - VSFit Gym`,
        payment_method_id: 'pix',
        payer: {
          email: user.email,
        },
        notification_url: `${SUPABASE_URL}/functions/v1/mp-webhook`,
        additional_info: {
          items: [
            {
              id: sanitizedPlan,
              title: `Plano ${sanitizedPlan === 'basic' ? 'Básico' : 'Premium'} - VSFit Gym`,
              quantity: 1,
              unit_price: amount,
            },
          ],
        },
      }),
    })

    if (!mpResponse.ok) {
      const errorData = await mpResponse.json()
      console.error('Mercado Pago error:', errorData)
      return new Response(JSON.stringify({ error: 'Failed to create PIX payment' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const paymentData = await mpResponse.json()

    // Save payment record
    const { error: dbError } = await supabase
      .from('payments')
      .insert({
        user_id: user.id,
        plan: sanitizedPlan,
        amount,
        mp_payment_id: paymentData.id,
        status: 'pending',
        pix_data: {
          qr_code: paymentData.point_of_interaction?.transaction_data?.qr_code,
          qr_code_base64: paymentData.point_of_interaction?.transaction_data?.qr_code_base64,
          ticket_url: paymentData.point_of_interaction?.transaction_data?.ticket_url,
        },
      })

    if (dbError) {
      console.error('DB error:', dbError)
      return new Response(JSON.stringify({ error: 'Failed to save payment' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({
      success: true,
      payment_id: paymentData.id,
      qr_code: paymentData.point_of_interaction?.transaction_data?.qr_code,
      qr_code_base64: paymentData.point_of_interaction?.transaction_data?.qr_code_base64,
      ticket_url: paymentData.point_of_interaction?.transaction_data?.ticket_url,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
