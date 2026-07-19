import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { uploadImage } from '@/api/queries'
import type { Product, Teacher } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Pencil, Trash2, Package } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ProductsPage() {
  const [products, setProducts] = useState<(Product & { teacher: Teacher | null })[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editItem, setEditItem] = useState<Product | null>(null)
  const [title, setTitle] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [isReusable, setIsReusable] = useState(false)
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    const [productsRes, teachersRes] = await Promise.all([
      supabase.from('products').select('*, teacher:teachers(*)').order('created_at', { ascending: false }),
      supabase.from('teachers').select('*').order('name'),
    ])
    setProducts(productsRes.data ?? [])
    setTeachers(teachersRes.data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setEditItem(null)
    setTitle('')
    setTeacherId(teachers[0]?.id ?? '')
    setDescription('')
    setPrice('')
    setIsReusable(false)
    setImage(null)
    setImagePreview('')
    setOpen(true)
  }

  function openEdit(product: Product) {
    setEditItem(product)
    setTitle(product.title)
    setTeacherId(product.teacher_id)
    setDescription(product.description ?? '')
    setPrice(String(product.price))
    setIsReusable(product.is_reusable)
    setImage(null)
    setImagePreview(product.image ?? '')
    setOpen(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      let imageUrl = imagePreview
      if (image) {
        const path = `products/${Date.now()}-${image.name}`
        const url = await uploadImage('products', path, image)
        if (url) imageUrl = url
      }
      const payload = { title, teacher_id: teacherId, description, price: parseFloat(price), is_reusable: isReusable, image: imageUrl }
      if (editItem) {
        await supabase.from('products').update(payload).eq('id', editItem.id)
        toast.success('تم التحديث')
      } else {
        await supabase.from('products').insert(payload)
        toast.success('تم الإنشاء')
      }
      setOpen(false)
      load()
    } catch {
      toast.error('حدث خطأ')
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('هل أنت متأكد؟')) return
    await supabase.from('products').delete().eq('id', id)
    toast.success('تم الحذف')
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">المنتجات</h1>
        <Button onClick={openCreate}><Plus className="w-4 h-4 ml-2" />إضافة منتج</Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(product => (
            <Card key={product.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  {product.image && <img src={product.image} alt={product.title} className="w-12 h-12 rounded object-cover" />}
                  {!product.image && <Package className="w-12 h-12 text-muted-foreground" />}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{product.title}</p>
                    <p className="text-xs text-muted-foreground">{product.teacher?.name}</p>
                  </div>
                </div>
                <p className="text-lg font-bold mb-3">{product.price} ج.م</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(product)}>
                    <Pencil className="w-3 h-3 ml-1" />تعديل
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(product.id)}>
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editItem ? 'تعديل منتج' : 'إضافة منتج'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>المدرس</Label>
              <Select value={teacherId} onChange={e => setTeacherId(e.target.value)} required>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>العنوان</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>الوصف</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>السعر</Label>
              <Input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} dir="ltr" required />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="reusable" checked={isReusable} onChange={e => setIsReusable(e.target.checked)} />
              <Label htmlFor="reusable">كود قابل لإعادة الاستخدام</Label>
            </div>
            <div className="space-y-2">
              <Label>الصورة</Label>
              <Input type="file" accept="image/*" onChange={e => {
                const f = e.target.files?.[0]
                if (f) { setImage(f); setImagePreview(URL.createObjectURL(f)) }
              }} />
              {imagePreview && <img src={imagePreview} className="w-20 h-20 rounded object-cover mt-2" />}
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? 'جاري الحفظ...' : 'حفظ'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
