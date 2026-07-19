import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { bulkImportCodes } from '@/api/queries'
import type { Product, Code } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Upload, Key, Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CodesPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [codes, setCodes] = useState<Code[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState('')
  const [bulkInput, setBulkInput] = useState('')
  const [singleCode, setSingleCode] = useState('')
  const [reusable, setReusable] = useState(false)
  const [saving, setSaving] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  async function load() {
    const { data: productsData } = await supabase.from('products').select('*').order('title')
    setProducts(productsData ?? [])
    if (productsData?.length) {
      const pid = productsData[0].id
      setSelectedProduct(pid)
      const { data: codesData } = await supabase.from('codes').select('*').eq('product_id', pid).order('created_at', { ascending: false })
      setCodes(codesData ?? [])
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function loadCodes(productId: string) {
    setSelectedProduct(productId)
    const { data } = await supabase.from('codes').select('*').eq('product_id', productId).order('created_at', { ascending: false })
    setCodes(data ?? [])
  }

  async function handleBulkImport() {
    if (!selectedProduct || !bulkInput.trim()) {
      toast.error('اختر منتج وأدخل الأكواد')
      return
    }
    const codesList = bulkInput.split('\n').map(c => c.trim()).filter(Boolean)
    setSaving(true)
    await bulkImportCodes(selectedProduct, codesList)
    toast.success(`تم استيراد ${codesList.length} كود`)
    setBulkInput('')
    setSaving(false)
    loadCodes(selectedProduct)
  }

  async function handleGenerateSingle() {
    if (!selectedProduct || !singleCode.trim()) {
      toast.error('أدخل الكود')
      return
    }
    setSaving(true)
    await supabase.from('codes').insert({
      product_id: selectedProduct,
      code: singleCode.trim(),
      status: 'unused',
    })
    toast.success('تم إضافة الكود')
    setSingleCode('')
    setSaving(false)
    loadCodes(selectedProduct)
  }

  function copyCode(id: string, code: string) {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    toast.success('تم النسخ')
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">إدارة الأكواد</h1>
      </div>

      <div className="mb-4">
        <Label>اختر المنتج</Label>
        <Select value={selectedProduct} onChange={e => loadCodes(e.target.value)}>
          {products.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Upload className="w-5 h-5" />استيراد أكواد</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>الأكواد (كود في كل سطر)</Label>
              <Textarea
                value={bulkInput}
                onChange={e => setBulkInput(e.target.value)}
                placeholder="CODE001&#10;CODE002&#10;CODE003"
                rows={6}
                dir="ltr"
              />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="bulkReusable" checked={reusable} onChange={e => setReusable(e.target.checked)} />
              <Label htmlFor="bulkReusable">أكواد قابلة لإعادة الاستخدام</Label>
            </div>
            <Button onClick={handleBulkImport} className="w-full" disabled={saving || !bulkInput.trim()}>
              {saving ? 'جاري الاستيراد...' : 'استيراد'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Plus className="w-5 h-5" />إضافة كود واحد</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>الكود</Label>
              <Input value={singleCode} onChange={e => setSingleCode(e.target.value)} dir="ltr" placeholder="CODE-12345" />
            </div>
            <Button onClick={handleGenerateSingle} className="w-full" disabled={saving || !singleCode.trim()}>
              {saving ? 'جاري الإضافة...' : 'إضافة'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              الأكواد ({codes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-right p-2">#</th>
                    <th className="text-right p-2">الكود</th>
                    <th className="text-right p-2">الحالة</th>
                    <th className="text-right p-2">تاريخ البيع</th>
                    <th className="text-left p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {codes.map((code, i) => (
                    <tr key={code.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 text-muted-foreground">{i + 1}</td>
                      <td className="p-2 font-mono" dir="ltr">{code.code}</td>
                      <td className="p-2">
                        <Badge variant={code.status === 'unused' ? 'secondary' : 'success'}>
                          {code.status === 'unused' ? 'غير مستخدم' : 'تم البيع'}
                        </Badge>
                      </td>
                      <td className="p-2 text-muted-foreground">
                        {code.sold_at ? new Date(code.sold_at).toLocaleDateString('ar-EG') : '—'}
                      </td>
                      <td className="p-2 text-left">
                        <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => copyCode(code.id, code.code)}>
                          {copiedId === code.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {codes.length === 0 && (
                    <tr><td colSpan={5} className="text-center p-8 text-muted-foreground">لا توجد أكواد</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
