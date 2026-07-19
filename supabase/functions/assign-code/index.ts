import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { supabase } from '../_shared/supabase.ts'
import { validateRequired } from '../_shared/validation.ts'

serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const authHeader = req.headers.get('Authorization') || ''
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if ((profile as any)?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json()
    const errors = [
      validateRequired(body.payment_id, 'payment_id'),
    ].filter(Boolean)
    if (errors.length) {
      return new Response(JSON.stringify({ error: errors.join(', ') }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get payment with order
    const { data: payment } = await supabase
      .from('payments')
      .select('*, order:orders(*)')
      .eq('id', body.payment_id)
      .single()

    if (!payment) {
      return new Response(JSON.stringify({ error: 'Payment not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const order = (payment as any).order
    if (!order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Find available code
    const { data: code } = await supabase
      .from('codes')
      .select('*')
      .eq('product_id', order.product_id)
      .eq('status', 'unused')
      .limit(1)
      .maybeSingle()

    if (!code) {
      return new Response(JSON.stringify({ error: 'No available codes' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Assign code
    const { error: updateError } = await supabase
      .from('codes')
      .update({ status: 'sold', sold_to: order.user_id, sold_at: new Date().toISOString() })
      .eq('id', code.id)
    if (updateError) throw updateError

    // Update order & payment status
    await supabase.from('payments').update({ status: 'approved' }).eq('id', body.payment_id)
    await supabase.from('orders').update({ status: 'approved' }).eq('id', order.id)

    await supabase.rpc('log_audit', {
      p_user_id: user.id, p_action: 'code_assigned',
      p_entity: 'code', p_entity_id: code.id,
      p_details: JSON.stringify({ payment_id: body.payment_id, order_id: order.id }),
    })

    return new Response(JSON.stringify({ success: true, code_id: code.id }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
