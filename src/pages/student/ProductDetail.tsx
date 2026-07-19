import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getProduct, createOrder, createPayment, uploadPaymentScreenshot, getMyPurchasedCode } from '@/api/queries'
import { useAuth } from '@/contexts/AuthContext'
import type { Product as ProductType, Code } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Package, Copy, Check, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ProductDetail() {
  const { productId } = useParams<{ productId: string }>()
  const { user, profile } = useAuth()
  const [product, setProduct] = useState<(ProductType & { teacher: { name: string } | null }) | null>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<'view' | 'payment' | 'done'>('view')
  const [method, setMethod] = useState('instapay')
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [purchasedCode, setPurchasedCode] = useState<Code | null>(null)
  const [codeVisible, setCodeVisible] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function load() {
      if (!productId) return
      const data = await getProduct(productId)
      setProduct(data)
      if (user) {
        const code = await getMyPurchasedCode(user.id, productId)
        if (code) {
          setPurchasedCode(code)
          setStep('done')
        }
      }
      setLoading(false)
    }
    load()
  }, [productId, user])

  async function handleBuy() {
    if (!user || !product) return
    setStep('payment')
  }

  async function handlePayment(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !product || !file) {
      toast.error('يرجى اختيار صورة الدفع')
      return
    }
    setSubmitting(true)
    try {
      const { data: order, error: orderError } = await createOrder(user.id, product.id)
      if (orderError || !order) throw new Error('فشل إنشاء الطلب')
      const url = await uploadPaymentScreenshot(user.id, file)
      if (!url) throw new Error('فشل رفع الصورة')
      await createPayment(order.id, user.id, product.price, method, url)
      toast.success('تم إرسال طلب الدفع بنجاح. في انتظار الموافقة.')
      setStep('done')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'حدث خطأ'
      toast.error(msg)
    }
    setSubmitting(false)
  }

  function copyCode() {
    if (purchasedCode) {
      navigator.clipboard.writeText(purchasedCode.code)
      setCopied(true)
      toast.success('تم نسخ الكود')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-64 w-full mb-4" />
      </div>
    )
  }
  if (!product) {
    return <div className="max-w-4xl mx-auto px-4 py-8 text-center">المنتج غير موجود</div>
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to={`/teacher/${product.teacher_id}`} className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1 mb-4">
        <ArrowRight className="w-4 h-4" /> العودة
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          {product.image && <img src={product.image} alt={product.title} className="w-full rounded-lg object-cover" />}
          {!product.image && (
            <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center">
              <Package className="w-16 h-16 text-muted-foreground" />
            </div>
          )}
        </div>
        <div>
          <h1 className="text-3xl font-bold mb-2">{product.title}</h1>
          {product.teacher && (
            <p className="text-muted-foreground mb-4">المدرس: {product.teacher.name}</p>
          )}
          {product.description && (
            <p className="text-muted-foreground mb-6">{product.description}</p>
          )}
          <p className="text-4xl font-bold mb-6">{product.price} ج.م</p>

          {step === 'view' && !purchasedCode && product.status === 'active' && (
            <Button size="lg" className="w-full" onClick={handleBuy}>شراء المنتج</Button>
          )}
          {step === 'view' && !purchasedCode && product.status !== 'active' && (
            <p className="text-sm text-muted-foreground text-center py-4">هذا المنتج غير متاح للشراء حالياً</p>
          )}

          {step === 'done' && purchasedCode && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-500" />
                  تم الشراء بنجاح
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted p-4 rounded-lg text-center">
                  <Label className="text-xs">كود التفعيل</Label>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <code className="text-2xl font-mono font-bold tracking-wider" dir="ltr">
                      {codeVisible ? purchasedCode.code : '••••••••••'}
                    </code>
                    <Button variant="ghost" size="icon" onClick={() => setCodeVisible(!codeVisible)}>
                      {codeVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <Button className="w-full" onClick={copyCode}>
                  {copied ? <Check className="w-4 h-4 ml-2" /> : <Copy className="w-4 h-4 ml-2" />}
                  {copied ? 'تم النسخ' : 'نسخ الكود'}
                </Button>
              </CardContent>
            </Card>
          )}

          {step === 'done' && !purchasedCode && (
            <Card>
              <CardHeader>
                <CardTitle>تم إرسال طلبك</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">طلبك قيد المراجعة. سيتم تفعيل الكود بعد الموافقة على الدفع.</p>
                <Badge variant="warning" className="mt-2">قيد المراجعة</Badge>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {step === 'payment' && (
        <Card>
          <CardHeader>
            <CardTitle>إتمام الدفع</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePayment} className="space-y-4">
              <div className="space-y-2">
                <Label>طريقة الدفع</Label>
                <Select value={method} onChange={e => setMethod(e.target.value)}>
                  <option value="instapay">InstaPay</option>
                  <option value="vodafone_cash">Vodafone Cash</option>
                </Select>
              </div>
              <div className="bg-muted p-4 rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-1">المبلغ المطلوب</p>
                <p className="text-2xl font-bold">{product.price} ج.م</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="screenshot">صورة إيصال الدفع</Label>
                <Input id="screenshot" type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] ?? null)} required />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'جاري الإرسال...' : 'تأكيد الدفع'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
