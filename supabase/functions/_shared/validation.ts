export function sanitize(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

export function validatePhone(phone: string): boolean {
  return /^01[0-9]{9}$/.test(phone)
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function validateRequired(value: unknown, name: string): string | null {
  if (value === undefined || value === null || value === '') {
    return `${name} مطلوب`
  }
  return null
}

export function validateUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}

export function validateNumeric(value: string): boolean {
  return /^\d+(\.\d{1,2})?$/.test(value)
}
