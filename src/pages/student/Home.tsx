import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getSections } from '@/api/queries'
import type { Section } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { BookOpen } from 'lucide-react'

export default function Home() {
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSections().then(data => {
      setSections(data)
      setLoading(false)
    })
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-3">Teacher Codes Store</h1>
        <p className="text-muted-foreground text-lg">اختر القسم الذي تريد تصفحه</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 rounded-none" />
                <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
                <CardContent><Skeleton className="h-4 w-full" /></CardContent>
              </Card>
            ))
          : sections.map(section => (
              <Link key={section.id} to={`/section/${section.id}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
                  {section.image && (
                    <img src={section.image} alt={section.name} className="w-full h-48 object-cover" />
                  )}
                  {!section.image && (
                    <div className="w-full h-48 bg-muted flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle>{section.name}</CardTitle>
                  </CardHeader>
                  {section.description && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{section.description}</p>
                    </CardContent>
                  )}
                </Card>
              </Link>
            ))}
      </div>
    </div>
  )
}
