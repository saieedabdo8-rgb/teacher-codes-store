import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { uploadImage } from '@/api/queries'
import type { Teacher, Subject } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Pencil, Trash2, Upload } from 'lucide-react'
import toast from 'react-hot-toast'

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<(Teacher & { subject: Subject | null })[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editItem, setEditItem] = useState<Teacher | null>(null)
  const [name, setName] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [description, setDescription] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    const [teachersRes, subjectsRes] = await Promise.all([
      supabase.from('teachers').select('*, subject:subjects(*)').order('name'),
      supabase.from('subjects').select('*').order('name'),
    ])
    setTeachers(teachersRes.data ?? [])
    setSubjects(subjectsRes.data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setEditItem(null)
    setName('')
    setSubjectId(subjects[0]?.id ?? '')
    setDescription('')
    setImage(null)
    setImagePreview('')
    setOpen(true)
  }

  function openEdit(teacher: Teacher) {
    setEditItem(teacher)
    setName(teacher.name)
    setSubjectId(teacher.subject_id)
    setDescription(teacher.description ?? '')
    setImage(null)
    setImagePreview(teacher.image ?? '')
    setOpen(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      let imageUrl = imagePreview
      if (image) {
        const path = `teachers/${Date.now()}-${image.name}`
        const url = await uploadImage('teachers', path, image)
        if (url) imageUrl = url
      }
      if (editItem) {
        await supabase.from('teachers').update({ name, subject_id: subjectId, description, image: imageUrl }).eq('id', editItem.id)
        toast.success('تم التحديث')
      } else {
        await supabase.from('teachers').insert({ name, subject_id: subjectId, description, image: imageUrl })
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
    await supabase.from('teachers').delete().eq('id', id)
    toast.success('تم الحذف')
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">المدرسين</h1>
        <Button onClick={openCreate}><Plus className="w-4 h-4 ml-2" />إضافة مدرس</Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teachers.map(teacher => (
            <Card key={teacher.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  {teacher.image && <img src={teacher.image} alt={teacher.name} className="w-12 h-12 rounded-full object-cover" />}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{teacher.name}</p>
                    <p className="text-xs text-muted-foreground">{teacher.subject?.name}</p>
                  </div>
                </div>
                {teacher.description && <p className="text-sm text-muted-foreground mb-3">{teacher.description}</p>}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(teacher)}>
                    <Pencil className="w-3 h-3 ml-1" />تعديل
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(teacher.id)}>
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
            <DialogTitle>{editItem ? 'تعديل مدرس' : 'إضافة مدرس'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>المادة</Label>
              <Select value={subjectId} onChange={e => setSubjectId(e.target.value)} required>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>الاسم</Label>
              <Input value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>الوصف</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>الصورة</Label>
              <Input type="file" accept="image/*" onChange={e => {
                const f = e.target.files?.[0]
                if (f) {
                  setImage(f)
                  setImagePreview(URL.createObjectURL(f))
                }
              }} />
              {!editItem && imagePreview && <img src={imagePreview} className="w-20 h-20 rounded object-cover mt-2" />}
              {editItem && imagePreview && !image && <img src={imagePreview} className="w-20 h-20 rounded object-cover mt-2" />}
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
