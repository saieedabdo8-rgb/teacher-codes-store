import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getSubjects, getSections } from '@/api/queries'
import type { Subject, Section } from '@/types'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowRight, BookOpen } from 'lucide-react'

export default function SectionSubjects() {
  const { sectionId } = useParams<{ sectionId: string }>()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [section, setSection] = useState<Section | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!sectionId) return
      const [subjectsData, sectionsData] = await Promise.all([
        getSubjects(sectionId),
        getSections(),
      ])
      setSubjects(subjectsData)
      setSection(sectionsData.find(s => s.id === sectionId) ?? null)
      setLoading(false)
    }
    load()
  }, [sectionId])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1">
          <ArrowRight className="w-4 h-4" /> الرئيسية
        </Link>
        {section && <h1 className="text-3xl font-bold mt-2">{section.name}</h1>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <Skeleton className="h-32 rounded-none" />
                <CardHeader><Skeleton className="h-6 w-2/3" /></CardHeader>
              </Card>
            ))
          : subjects.map(subject => (
              <Link key={subject.id} to={`/subject/${subject.id}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
                  {subject.image && (
                    <img src={subject.image} alt={subject.name} className="w-full h-32 object-cover" />
                  )}
                  {!subject.image && (
                    <div className="w-full h-32 bg-muted flex items-center justify-center">
                      <BookOpen className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-lg">{subject.name}</CardTitle>
                    {subject.description && (
                      <p className="text-xs text-muted-foreground mt-1">{subject.description}</p>
                    )}
                  </CardHeader>
                </Card>
              </Link>
            ))}
      </div>
    </div>
  )
}
