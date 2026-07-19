import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, UserSquare2, Package, ShoppingCart, Wallet, TrendingUp } from 'lucide-react'

interface Stats {
  users: number
  teachers: number
  products: number
  orders: number
  pendingPayments: number
  completedPayments: number
  revenue: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [
        { count: users },
        { count: teachers },
        { count: products },
        { count: orders },
        { data: payments },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('teachers').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('payments').select('amount, status'),
      ])

      const pendingPayments = payments?.filter(p => p.status === 'pending').length ?? 0
      const completedPayments = payments?.filter(p => p.status === 'approved').length ?? 0
      const revenue = payments?.filter(p => p.status === 'approved').reduce((sum, p) => sum + Number(p.amount), 0) ?? 0

      setStats({
        users: users ?? 0,
        teachers: teachers ?? 0,
        products: products ?? 0,
        orders: orders ?? 0,
        pendingPayments,
        completedPayments,
        revenue,
      })
      setLoading(false)
    }
    load()
  }, [])

  const items = [
    { label: 'المستخدمين', value: stats?.users, icon: Users, color: 'text-blue-600' },
    { label: 'المدرسين', value: stats?.teachers, icon: UserSquare2, color: 'text-green-600' },
    { label: 'المنتجات', value: stats?.products, icon: Package, color: 'text-purple-600' },
    { label: 'الطلبات', value: stats?.orders, icon: ShoppingCart, color: 'text-orange-600' },
    { label: 'مدفوعات معلقة', value: stats?.pendingPayments, icon: Wallet, color: 'text-yellow-600' },
    { label: 'مدفوعات مكتملة', value: stats?.completedPayments, icon: Wallet, color: 'text-green-600' },
    { label: 'الإيرادات', value: stats?.revenue ? `${stats.revenue} ج.م` : undefined, icon: TrendingUp, color: 'text-primary' },
  ]

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">لوحة التحكم</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map(item => (
          <Card key={item.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{item.label}</CardTitle>
              <item.icon className={`w-5 h-5 ${item.color}`} />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <p className="text-3xl font-bold">{item.value ?? '—'}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
