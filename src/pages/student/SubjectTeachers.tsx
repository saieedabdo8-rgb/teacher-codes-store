import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getTeachers, getSubjects } from '@/api/queries'
import type { Teacher, Subject } from '@/types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowRight, User } from 'lucide-react'

export default function SubjectTeachers() {
  const { subjectId } = useParams<{ subjectId: string }>()
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [subject, setSubject] = useState<Subject | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!subjectId) return
      const [teachersData, subjectsData] = await Promise.all([
        getTeachers(subjectId),
        getSubjects(''), // need all to find name
      ])
      setTeachers(teachersData)
      setSubject(subjectsData.find(s => s.id === subjectId) ?? null)
      setLoading(false)
    }
    load()
  }, [subjectId])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1">
          <ArrowRight className="w-4 h-4" /> الرئيسية
        </Link>
        {subject && <h1 className="text-3xl font-bold mt-2">{subject.name}</h1>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <Skeleton className="h-48 rounded-none" />
                <CardHeader><Skeleton className="h-6 w-2/3" /></CardHeader>
              </Card>
            ))
          : teachers.map(teacher => (
              <Link key={teacher.id} to={`/teacher/${teacher.id}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
                  {teacher.image && (
                    <img src={teacher.image} alt={teacher.name} className="w-full h-48 object-cover" />
                  )}
                  {!teacher.image && (
                    <div className="w-full h-48 bg-muted flex items-center justify-center">
                      <User className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle>{teacher.name}</CardTitle>
                  </CardHeader>
                  {teacher.description && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{teacher.description}</p>
                    </CardContent>
                  )}
                </Card>
              </Link>
            ))}
      </div>
    </div>
  )
}
