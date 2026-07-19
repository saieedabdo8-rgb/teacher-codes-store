import { supabase } from '@/lib/supabase'
import type { Stage, Section, Subject, Teacher, Product, Order, Payment, Code, Profile } from '@/types'

export async function getStages(): Promise<Stage[]> {
  const { data } = await supabase.from('stages').select('*').order('name')
  return data ?? []
}

export async function getSections(stageId?: string): Promise<Section[]> {
  let query = supabase.from('sections').select('*').order('name')
  if (stageId) query = query.eq('stage_id', stageId)
  const { data } = await query
  return data ?? []
}

export async function getSubjects(sectionId: string): Promise<Subject[]> {
  const { data } = await supabase.from('subjects').select('*').eq('section_id', sectionId).order('name')
  return data ?? []
}

export async function getTeachers(subjectId: string): Promise<Teacher[]> {
  const { data } = await supabase.from('teachers').select('*').eq('subject_id', subjectId).order('name')
  return data ?? []
}

export async function getProducts(teacherId: string): Promise<Product[]> {
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('teacher_id', teacherId)
    .eq('status', 'active')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function getProduct(id: string): Promise<(Product & { teacher: Teacher | null }) | null> {
  const { data } = await supabase.from('products').select('*, teacher:teachers(*)').eq('id', id).is('deleted_at', null).single()
  return data as (Product & { teacher: Teacher | null }) | null
}

export async function getMyOrders(userId: string): Promise<(Order & { product: Product })[]> {
  const { data } = await supabase
    .from('orders')
    .select('*, product:products(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return (data ?? []) as (Order & { product: Product })[]
}

export async function getMyPayments(userId: string): Promise<(Payment & { order: Order & { product: Product } })[]> {
  const { data } = await supabase
    .from('payments')
    .select('*, order:orders(*, product:products(*))')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return (data ?? []) as (Payment & { order: Order & { product: Product } })[]
}

export async function getMyPurchasedCode(userId: string, productId: string): Promise<Code | null> {
  const { data } = await supabase
    .from('codes')
    .select('*')
    .eq('product_id', productId)
    .eq('sold_to', userId)
    .eq('status', 'sold')
    .maybeSingle()
  return data
}

export async function createOrder(userId: string, productId: string) {
  return supabase.from('orders').insert({ user_id: userId, product_id: productId, status: 'pending' }).select().single()
}

export async function createPayment(orderId: string, userId: string, amount: number, method: string, screenshotUrl: string) {
  const { callEdgeFunction } = await import('@/lib/security')
  return callEdgeFunction('process-payment', 'POST', { order_id: orderId, amount, method, screenshot_url: screenshotUrl })
}

export async function uploadPaymentScreenshot(userId: string, file: File): Promise<string | null> {
  const ext = file.name.split('.').pop()
  const path = `${userId}/${Date.now()}.${ext}`
  const { data } = await supabase.storage.from('payments').upload(path, file)
  if (!data) return null
  const { data: urlData } = await supabase.storage.from('payments').createSignedUrl(path, 60 * 60 * 24 * 7)
  return urlData?.signedUrl ?? null
}

export async function uploadImage(bucket: string, path: string, file: File): Promise<string | null> {
  const { data } = await supabase.storage.from(bucket).upload(path, file)
  if (!data) return null
  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path)
  return publicUrl
}

export async function approvePayment(paymentId: string) {
  const { callEdgeFunction } = await import('@/lib/security')
  return callEdgeFunction('assign-code', 'POST', { payment_id: paymentId })
}

export async function rejectPayment(paymentId: string) {
  const { data: payment } = await supabase.from('payments').select('*, order:orders(*)').eq('id', paymentId).single()
  if (!payment) return
  const order = (payment as any).order
  await supabase.from('payments').update({ status: 'rejected' }).eq('id', paymentId)
  await supabase.from('orders').update({ status: 'rejected' }).eq('id', order.id)
}

export async function bulkImportCodes(productId: string, codes: string[]) {
  const rows = codes.map(code => ({ product_id: productId, code, status: 'unused' }))
  return supabase.from('codes').insert(rows)
}

export async function getUsers(): Promise<Profile[]> {
  const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
  return data ?? []
}

export async function getOrders(): Promise<(Order & { product: Product; user: Profile })[]> {
  const { data } = await supabase
    .from('orders')
    .select('*, product:products(*), user:profiles!user_id(*)')
    .order('created_at', { ascending: false })
  return (data ?? []) as (Order & { product: Product; user: Profile })[]
}

export async function getPayments(): Promise<(Payment & { order: Order & { product: Product }; user: Profile })[]> {
  const { data } = await supabase
    .from('payments')
    .select('*, order:orders(*, product:products(*)), user:profiles!user_id(*)')
    .order('created_at', { ascending: false })
  return (data ?? []) as (Payment & { order: Order & { product: Product }; user: Profile })[]
}

export async function getCodes(productId: string): Promise<Code[]> {
  const { data } = await supabase.from('codes').select('*').eq('product_id', productId).order('created_at', { ascending: false })
  return data ?? []
}
