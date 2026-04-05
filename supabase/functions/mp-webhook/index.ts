// Webhook handler for Mercado Pago payment notifications
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Handle Mercado Pago webhook
    if (req.method === 'POST') {
      const body = await req.json()
      const { type, data } = body

      if (type === 'payment') {
        const paymentId = data.id

        // Fetch payment details from Mercado Pago
        const mpToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN') || ''
        const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: {
            'Authorization': `Bearer ${mpToken}`,
          },
        })

        if (mpResponse.ok) {
          const paymentData = await mpResponse.json()
          const status = paymentData.status // approved, pending, rejected

          // Update payment record
          const { data: payment, error: findError } = await supabase
            .from('payments')
            .select('*')
            .eq('mp_payment_id', paymentId)
            .single()

          if (!findError && payment) {
            await supabase
              .from('payments')
              .update({ status })
              .eq('mp_payment_id', paymentId)

            // If approved, activate subscription
            if (status === 'approved') {
              const now = new Date()
              const endDate = new Date(now)
              endDate.setMonth(endDate.getMonth() + 1)

              await supabase
                .from('subscriptions')
                .upsert({
                  user_id: payment.user_id,
                  plan: payment.plan,
                  status: 'active',
                  start_date: now.toISOString(),
                  end_date: endDate.toISOString(),
                  updated_at: now.toISOString(),
                }, {
                  onConflict: 'user_id',
                })
            }
          }
        }
      }

      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Handle payment status check (GET)
    if (req.method === 'GET') {
      const url = new URL(req.url)
      const paymentId = url.searchParams.get('payment_id')

      if (!paymentId) {
        return new Response(JSON.stringify({ error: 'payment_id required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      // Check Mercado Pago status
      const mpToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN') || ''
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${mpToken}`,
        },
      })

      if (mpResponse.ok) {
        const paymentData = await mpResponse.json()

        // Update our DB
        const { data: payment } = await supabase
          .from('payments')
          .select('*')
          .eq('mp_payment_id', paymentId)
          .single()

        if (payment && payment.status !== paymentData.status) {
          await supabase
            .from('payments')
            .update({ status: paymentData.status })
            .eq('mp_payment_id', paymentId)

          if (paymentData.status === 'approved') {
            const now = new Date()
            const endDate = new Date(now)
            endDate.setMonth(endDate.getMonth() + 1)

            await supabase
              .from('subscriptions')
              .upsert({
                user_id: payment.user_id,
                plan: payment.plan,
                status: 'active',
                start_date: now.toISOString(),
                end_date: endDate.toISOString(),
                updated_at: now.toISOString(),
              }, {
                onConflict: 'user_id',
              })
          }
        }

        return new Response(JSON.stringify({
          status: paymentData.status,
          plan: payment?.plan,
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({ error: 'Payment not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
