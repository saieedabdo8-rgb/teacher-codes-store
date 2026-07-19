import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { approvePayment, rejectPayment } from '@/api/queries'
import type { Payment, Order, Product, Profile } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Check, X, ExternalLink, Wallet } from 'lucide-react'
import toast from 'react-hot-toast'

const statusMap: Record<string, { label: string; variant: 'warning' | 'success' | 'destructive' }> = {
  pending: { label: 'معلق', variant: 'warning' },
  approved: { label: 'مقبول', variant: 'success' },
  rejected: { label: 'مرفوض', variant: 'destructive' },
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<(Payment & { order: Order & { product: Product }; user: Profile })[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const { data } = await supabase
      .from('payments')
      .select('*, order:orders(*, product:products(*)), user:profiles!user_id(*)')
      .order('created_at', { ascending: false })
    setPayments(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleApprove(id: string) {
    await approvePayment(id)
    toast.success('تم الموافقة على الدفع وتم تخصيص الكود')
    load()
  }

  async function handleReject(id: string) {
    await rejectPayment(id)
    toast.success('تم رفض الدفع')
    load()
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">المدفوعات</h1>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-16">
          <Wallet className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">لا توجد مدفوعات</p>
        </div>
      ) : (
        <div className="space-y-4">
          {payments.map(payment => {
            const status = statusMap[payment.status] ?? { label: payment.status, variant: 'warning' as const }
            return (
              <Card key={payment.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">{payment.user.full_name}</p>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{payment.user.phone}</p>
                      <p className="text-sm mt-1">
                        {payment.order.product.title} — <span className="font-bold">{payment.amount} ج.م</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {payment.method === 'instapay' ? 'InstaPay' : 'Vodafone Cash'} — {new Date(payment.created_at).toLocaleDateString('ar-EG')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {payment.screenshot_url && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={payment.screenshot_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4 ml-1" />عرض الإيصال
                          </a>
                        </Button>
                      )}
                      {payment.status === 'pending' && (
                        <>
                          <Button variant="default" size="sm" onClick={() => handleApprove(payment.id)}>
                            <Check className="w-4 h-4 ml-1" />موافقة
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleReject(payment.id)}>
                            <X className="w-4 h-4 ml-1" />رفض
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
