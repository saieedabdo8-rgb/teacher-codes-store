import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createHmac } from 'node:crypto'
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { supabase } from '../_shared/supabase.ts'
import { sanitize, validateRequired, validateUuid } from '../_shared/validation.ts'

serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const authHeader = req.headers.get('Authorization') || ''
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json()

    // --- PAYMOB WEBHOOK ---
    if (body.type === 'TRANSACTION' && body.obj?.id) {
      const hmac = body.hmac || ''
      const paymobSecret = Deno.env.get('PAYMOB_HMAC_SECRET') || ''
      const calculated = createHmac('sha512', paymobSecret)
        .update(JSON.stringify(body.obj))
        .digest('hex')
      if (hmac !== calculated) {
        await supabase.rpc('log_audit', {
          p_user_id: null, p_action: 'paymob_webhook_failed',
          p_entity: 'payment', p_details: JSON.stringify({ reason: 'HMAC mismatch' }),
        })
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const transactionId = String(body.obj.id)
      const { data: payment } = await supabase
        .from('payments')
        .select('*, order:orders(product_id)')
        .eq('id', transactionId)
        .single()

      if (payment && body.obj.success === true) {
        await supabase.from('payments').update({ status: 'approved' }).eq('id', payment.id)
        await supabase.from('orders').update({ status: 'approved' }).eq('id', payment.order_id)

        const { data: code } = await supabase
          .from('codes')
          .select('*')
          .eq('product_id', (payment as any).order.product_id)
          .eq('status', 'unused')
          .limit(1)
          .maybeSingle()

        if (code) {
          await supabase.from('codes').update({
            status: 'sold', sold_to: payment.user_id, sold_at: new Date().toISOString(),
          }).eq('id', code.id)
        }

        await supabase.rpc('log_audit', {
          p_user_id: payment.user_id, p_action: 'payment_approved',
          p_entity: 'payment', p_entity_id: payment.id,
          p_details: JSON.stringify({ amount: payment.amount }),
        })
      }
      return new Response(JSON.stringify({ received: true }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // --- CREATE PAYMENT (authenticated user) ---
    const errors = [
      validateRequired(body.order_id, 'order_id'),
      validateRequired(body.amount, 'amount'),
      validateRequired(body.method, 'method'),
      validateRequired(body.screenshot_url, 'screenshot_url'),
    ].filter(Boolean)
    if (errors.length) {
      return new Response(JSON.stringify({ error: errors.join(', ') }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data, error } = await supabase.from('payments').insert({
      order_id: sanitize(String(body.order_id)),
      user_id: user.id,
      amount: Number(body.amount),
      method: sanitize(String(body.method)),
      screenshot_url: sanitize(String(body.screenshot_url)),
    }).select().single()

    if (error) throw error

    await supabase.rpc('log_audit', {
      p_user_id: user.id, p_action: 'payment_created',
      p_entity: 'payment', p_entity_id: data.id,
      p_details: JSON.stringify({ amount: body.amount, method: body.method }),
    })

    return new Response(JSON.stringify(data), {
      status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
