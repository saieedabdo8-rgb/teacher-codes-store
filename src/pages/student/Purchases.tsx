import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyOrders, getMyPayments, getMyPurchasedCode } from '@/api/queries'
import { useAuth } from '@/contexts/AuthContext'
import type { Order, Payment, Code, Product } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Package, Copy, Check, Search, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { useState as useStateAlias } from 'react'

const statusMap: Record<string, { label: string; variant: 'warning' | 'success' | 'destructive' }> = {
  pending: { label: 'قيد المراجعة', variant: 'warning' },
  approved: { label: 'تم الموافقة', variant: 'success' },
  rejected: { label: 'مرفوض', variant: 'destructive' },
}

export default function Purchases() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<(Order & { product: Product })[]>([])
  const [payments, setPayments] = useState<(Payment & { order: Order & { product: Product } })[]>([])
  const [codes, setCodes] = useState<Record<string, Code | null>>({})
  const [visibleCodes, setVisibleCodes] = useState<Record<string, boolean>>({})
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!user) return
      const [o, p] = await Promise.all([
        getMyOrders(user.id),
        getMyPayments(user.id),
      ])
      setOrders(o)
      setPayments(p)
      const codeMap: Record<string, Code | null> = {}
      for (const order of o) {
        if (order.status === 'approved') {
          codeMap[order.id] = await getMyPurchasedCode(user.id, order.product_id)
        }
      }
      setCodes(codeMap)
      setLoading(false)
    }
    load()
  }, [user])

  function copyCode(orderId: string, code: string) {
    navigator.clipboard.writeText(code)
    setCopiedId(orderId)
    toast.success('تم نسخ الكود')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const filteredOrders = orders.filter(o =>
    o.product.title.includes(search) ||
    (codes[o.id]?.code ?? '').includes(search)
  )

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">مشترياتي</h1>

      <div className="relative mb-6">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="ابحث في مشترياتك..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pr-10"
        />
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-16">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">لا توجد مشتريات</p>
          <Button asChild className="mt-4">
            <Link to="/">تصفح المنتجات</Link>
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {filteredOrders.map(order => {
          const code = codes[order.id]
          const isVisible = visibleCodes[order.id]
          const status = statusMap[order.status] ?? { label: order.status, variant: 'warning' as const }
          const payment = payments.find(p => p.order_id === order.id)

          return (
            <Card key={order.id}>
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">{order.product.title}</h3>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString('ar-EG')}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {payment && (
                    <>
                      {payment.screenshot_url && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={payment.screenshot_url} target="_blank" rel="noopener noreferrer">الدفع</a>
                        </Button>
                      )}
                      <Badge variant={statusMap[payment.status]?.variant ?? 'warning'}>
                        {statusMap[payment.status]?.label}
                      </Badge>
                    </>
                  )}

                  {order.status === 'approved' && code && (
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono bg-muted px-2 py-1 rounded" dir="ltr">
                        {isVisible ? code.code : '••••••••'}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8"
                        onClick={() => setVisibleCodes(prev => ({ ...prev, [order.id]: !isVisible }))}
                      >
                        {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8"
                        onClick={() => copyCode(order.id, code.code)}
                      >
                        {copiedId === order.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
