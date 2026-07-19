import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Stage } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function StagesPage() {
  const [stages, setStages] = useState<Stage[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editItem, setEditItem] = useState<Stage | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data } = await supabase.from('stages').select('*').order('name')
    setStages(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setEditItem(null)
    setName('')
    setDescription('')
    setOpen(true)
  }

  function openEdit(stage: Stage) {
    setEditItem(stage)
    setName(stage.name)
    setDescription(stage.description ?? '')
    setOpen(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    if (editItem) {
      await supabase.from('stages').update({ name, description }).eq('id', editItem.id)
      toast.success('تم التحديث')
    } else {
      await supabase.from('stages').insert({ name, description })
      toast.success('تم الإنشاء')
    }
    setSaving(false)
    setOpen(false)
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm('هل أنت متأكد؟')) return
    await supabase.from('stages').delete().eq('id', id)
    toast.success('تم الحذف')
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">المراحل التعليمية</h1>
        <Button onClick={openCreate}><Plus className="w-4 h-4 ml-2" />إضافة مرحلة</Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : stages.length === 0 ? (
        <p className="text-muted-foreground">لا توجد مراحل بعد</p>
      ) : (
        <div className="space-y-3">
          {stages.map(stage => (
            <Card key={stage.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{stage.name}</p>
                  {stage.description && <p className="text-sm text-muted-foreground">{stage.description}</p>}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(stage)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(stage.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
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
            <DialogTitle>{editItem ? 'تعديل مرحلة' : 'إضافة مرحلة'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>الاسم</Label>
              <Input value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>الوصف</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} />
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
