import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Order, Product, Profile } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ShoppingCart } from 'lucide-react'

const statusMap: Record<string, { label: string; variant: 'warning' | 'success' | 'destructive' }> = {
  pending: { label: 'قيد المراجعة', variant: 'warning' },
  approved: { label: 'مقبول', variant: 'success' },
  rejected: { label: 'مرفوض', variant: 'destructive' },
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<(Order & { product: Product; user: Profile })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('orders')
        .select('*, product:products(*), user:profiles!user_id(*)')
        .order('created_at', { ascending: false })
      setOrders(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">الطلبات</h1>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">لا توجد طلبات</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-right p-3">الطالب</th>
                <th className="text-right p-3">المنتج</th>
                <th className="text-right p-3">الحالة</th>
                <th className="text-right p-3">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => {
                const status = statusMap[order.status] ?? { label: order.status, variant: 'warning' as const }
                return (
                  <tr key={order.id} className="border-b hover:bg-muted/50">
                    <td className="p-3">
                      <p className="font-medium">{order.user.full_name}</p>
                      <p className="text-xs text-muted-foreground" dir="ltr">{order.user.phone}</p>
                    </td>
                    <td className="p-3">{order.product.title}</td>
                    <td className="p-3"><Badge variant={status.variant}>{status.label}</Badge></td>
                    <td className="p-3 text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString('ar-EG')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
