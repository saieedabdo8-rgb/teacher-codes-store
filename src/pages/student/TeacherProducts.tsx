import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getProducts, getTeachers } from '@/api/queries'
import type { Product, Teacher } from '@/types'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ArrowRight, Package } from 'lucide-react'

export default function TeacherProducts() {
  const { teacherId } = useParams<{ teacherId: string }>()
  const [products, setProducts] = useState<Product[]>([])
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!teacherId) return
      const [productsData, teachersData] = await Promise.all([
        getProducts(teacherId),
        getTeachers(''),
      ])
      setProducts(productsData)
      setTeacher(teachersData.find(t => t.id === teacherId) ?? null)
      setLoading(false)
    }
    load()
  }, [teacherId])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1">
          <ArrowRight className="w-4 h-4" /> الرئيسية
        </Link>
        {teacher && <h1 className="text-3xl font-bold mt-2">منتجات {teacher.name}</h1>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <Skeleton className="h-40 rounded-none" />
                <CardHeader><Skeleton className="h-6 w-2/3" /></CardHeader>
              </Card>
            ))
          : products.map(product => (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {product.image && (
                  <img src={product.image} alt={product.title} className="w-full h-40 object-cover" />
                )}
                {!product.image && (
                  <div className="w-full h-40 bg-muted flex items-center justify-center">
                    <Package className="w-10 h-10 text-muted-foreground" />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-lg">{product.title}</CardTitle>
                </CardHeader>
                {product.description && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{product.description}</p>
                  </CardContent>
                )}
                <CardFooter className="flex items-center justify-between">
                  <span className="text-xl font-bold">{product.price} ج.م</span>
                  <Button asChild size="sm">
                    <Link to={`/product/${product.id}`}>شراء</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
      </div>
    </div>
  )
}
