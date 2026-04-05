import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // GET - Check payment status (frontend polling)
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const paymentId = url.searchParams.get('payment_id');

    if (!paymentId) {
      return new Response(JSON.stringify({ error: 'payment_id required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    try {
      const accessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (!mpResponse.ok) {
        return new Response(JSON.stringify({ error: 'Payment not found' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        });
      }

      const paymentData = await mpResponse.json();
      
      // Find subscription by payment ID and activate if approved
      if (paymentData.status === 'approved') {
        const { data: payment } = await supabase
          .from('pending_payments')
          .select('user_id, plan')
          .eq('mp_payment_id', paymentId)
          .single();

        if (payment) {
          const now = new Date();
          const endDate = new Date(now);
          endDate.setMonth(endDate.getMonth() + 1); // 1 month

          // Update profiles table (for quick access)
          await supabase
            .from('profiles')
            .update({
              plan: payment.plan,
              plan_expires_at: endDate.toISOString(),
              plan_activated_at: now.toISOString(),
            })
            .eq('id', payment.user_id);

          // Update subscriptions table
          await supabase.from('subscriptions').upsert({
            user_id: payment.user_id,
            plan: payment.plan,
            status: 'active',
            start_date: now.toISOString(),
            end_date: endDate.toISOString(),
            external_payment_id: paymentId.toString(),
            updated_at: now.toISOString(),
          }, {
            onConflict: 'user_id',
          });

          // Update pending payment
          await supabase
            .from('pending_payments')
            .update({
              status: 'approved',
              reviewed_at: now.toISOString(),
            })
            .eq('mp_payment_id', paymentId);

          console.log(`✅ Plan '${payment.plan}' activated for user: ${payment.user_id}`);
        }
      }

      return new Response(JSON.stringify({
        status: paymentData.status,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }
  }

  // POST - Webhook from Mercado Pago
  if (req.method === 'POST') {
    try {
      const payload = await req.json();
      console.log('Webhook Received:', payload);

      if (payload.type === 'payment' && payload.data?.id) {
        const paymentId = payload.data.id;
        const accessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');

        const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (!mpResponse.ok) throw new Error('Failed to fetch payment details from MP');
        
        const paymentData = await mpResponse.json();
        const status = paymentData.status;

        // Update payment record
        await supabase
          .from('pending_payments')
          .update({ status })
          .eq('mp_payment_id', paymentId);

        if (status === 'approved') {
          const { data: payment } = await supabase
            .from('pending_payments')
            .select('user_id, plan')
            .eq('mp_payment_id', paymentId)
            .single();

          if (payment) {
            const now = new Date();
            const endDate = new Date(now);
            endDate.setMonth(endDate.getMonth() + 1); // 1 month

            // Update profiles table (for quick access)
            await supabase
              .from('profiles')
              .update({
                plan: payment.plan,
                plan_expires_at: endDate.toISOString(),
                plan_activated_at: now.toISOString(),
              })
              .eq('id', payment.user_id);

            // Update subscriptions table
            await supabase.from('subscriptions').upsert({
              user_id: payment.user_id,
              plan: payment.plan,
              status: 'active',
              start_date: now.toISOString(),
              end_date: endDate.toISOString(),
              external_payment_id: paymentId.toString(),
              updated_at: now.toISOString(),
            }, {
              onConflict: 'user_id',
            });

            console.log(`✅ Plan '${payment.plan}' activated for user: ${payment.user_id}`);
          }
        }
      }

      return new Response('ok', { headers: corsHeaders, status: 200 });
    } catch (error: any) {
      console.error('Webhook Error:', error.message);
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
  }

  return new Response('Method not allowed', { headers: corsHeaders, status: 405 });
});
