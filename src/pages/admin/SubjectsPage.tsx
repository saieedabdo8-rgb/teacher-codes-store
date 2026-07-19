import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Subject, Section } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<(Subject & { section: Section | null })[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editItem, setEditItem] = useState<Subject | null>(null)
  const [name, setName] = useState('')
  const [sectionId, setSectionId] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    const [subjectsRes, sectionsRes] = await Promise.all([
      supabase.from('subjects').select('*, section:sections(*)').order('name'),
      supabase.from('sections').select('*').order('name'),
    ])
    setSubjects(subjectsRes.data ?? [])
    setSections(sectionsRes.data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setEditItem(null)
    setName('')
    setSectionId(sections[0]?.id ?? '')
    setOpen(true)
  }

  function openEdit(subject: Subject) {
    setEditItem(subject)
    setName(subject.name)
    setSectionId(subject.section_id)
    setOpen(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    if (editItem) {
      await supabase.from('subjects').update({ name, section_id: sectionId }).eq('id', editItem.id)
      toast.success('تم التحديث')
    } else {
      await supabase.from('subjects').insert({ name, section_id: sectionId })
      toast.success('تم الإنشاء')
    }
    setSaving(false)
    setOpen(false)
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm('هل أنت متأكد؟')) return
    await supabase.from('subjects').delete().eq('id', id)
    toast.success('تم الحذف')
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">المواد</h1>
        <Button onClick={openCreate}><Plus className="w-4 h-4 ml-2" />إضافة مادة</Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {subjects.map(subject => (
            <Card key={subject.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{subject.name}</p>
                  <p className="text-xs text-muted-foreground">{subject.section?.name}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(subject)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(subject.id)}>
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
            <DialogTitle>{editItem ? 'تعديل مادة' : 'إضافة مادة'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>القسم</Label>
              <Select value={sectionId} onChange={e => setSectionId(e.target.value)} required>
                {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>الاسم</Label>
              <Input value={name} onChange={e => setName(e.target.value)} required />
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
