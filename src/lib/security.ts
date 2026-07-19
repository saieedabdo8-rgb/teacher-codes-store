import toast from 'react-hot-toast'

export function sanitize(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

export function validatePhone(phone: string): boolean {
  return /^01[0-9]{9}$/.test(phone)
}

export function validatePassword(password: string): string | null {
  if (password.length < 6) return 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
  return null
}

export function validateRequired(value: string, label: string): string | null {
  if (!value.trim()) return `${label} مطلوب`
  return null
}

export function validateForm(values: Record<string, string>, labels: Record<string, string>): boolean {
  for (const [key, value] of Object.entries(values)) {
    const error = validateRequired(value, labels[key] || key)
    if (error) {
      toast.error(error)
      return false
    }
  }
  return true
}

export function csrfToken(): string {
  let token = sessionStorage.getItem('csrf_token')
  if (!token) {
    token = crypto.randomUUID()
    sessionStorage.setItem('csrf_token', token)
  }
  return token
}

const edgeUrl = 'https://ugeckghzcostuwptdqpi.supabase.co/functions/v1'
const anonKey = 'sb_publishable_JQGOS1WnnIqxp_m087P6xw_Vctc346v'

export async function callEdgeFunction<T = unknown>(
  name: string,
  method: 'GET' | 'POST' = 'POST',
  body?: Record<string, unknown>,
): Promise<{ data: T | null; error: string | null }> {
  try {
    const { supabase } = await import('./supabase')
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`${edgeUrl}/${name}`, {
      method,
      headers: {
        'Authorization': `Bearer ${session?.access_token ?? ''}`,
        'apikey': anonKey,
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken(),
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    const result = await res.json()
    if (!res.ok) return { data: null, error: result.error || 'Request failed' }
    return { data: result as T, error: null }
  } catch (err: any) {
    return { data: null, error: err.message }
  }
}
