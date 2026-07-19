import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getSections, getStages } from '@/api/queries'
import type { Section, Stage } from '@/types'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowRight, BookOpen } from 'lucide-react'

export default function StageSections() {
  const { stageId } = useParams<{ stageId: string }>()
  const [sections, setSections] = useState<Section[]>([])
  const [stage, setStage] = useState<Stage | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!stageId) return
      const [sectionsData, stagesData] = await Promise.all([
        getSections(stageId),
        getStages(),
      ])
      setSections(sectionsData)
      setStage(stagesData.find(s => s.id === stageId) ?? null)
      setLoading(false)
    }
    load()
  }, [stageId])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1">
          <ArrowRight className="w-4 h-4" /> الرئيسية
        </Link>
        {stage && <h1 className="text-3xl font-bold mt-2">{stage.name}</h1>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <Skeleton className="h-32 rounded-none" />
                <CardHeader><Skeleton className="h-6 w-2/3" /></CardHeader>
              </Card>
            ))
          : sections.map(section => (
              <Link key={section.id} to={`/section/${section.id}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
                  {section.image && (
                    <img src={section.image} alt={section.name} className="w-full h-32 object-cover" />
                  )}
                  {!section.image && (
                    <div className="w-full h-32 bg-muted flex items-center justify-center">
                      <BookOpen className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-lg">{section.name}</CardTitle>
                    {section.description && (
                      <p className="text-xs text-muted-foreground mt-1">{section.description}</p>
                    )}
                  </CardHeader>
                </Card>
              </Link>
            ))}
      </div>
    </div>
  )
}
