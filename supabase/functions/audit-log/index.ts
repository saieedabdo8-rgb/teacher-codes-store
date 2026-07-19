import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { supabase } from '../_shared/supabase.ts'

interface AuditEntry {
  user_id: string
  action: string
  entity?: string
  entity_id?: string
  details?: Record<string, unknown>
}

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

    const entry: AuditEntry = await req.json()
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || ''
    const ua = req.headers.get('user-agent') || ''

    const { data, error } = await supabase.rpc('log_audit', {
      p_user_id: entry.user_id,
      p_action: entry.action,
      p_entity: entry.entity || null,
      p_entity_id: entry.entity_id || null,
      p_details: entry.details ? JSON.stringify(entry.details) : null,
    })

    if (error) throw error

    return new Response(JSON.stringify({ id: data }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
