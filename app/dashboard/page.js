'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, TrendingUp, Package, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState(null)
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check auth
        const authResponse = await fetch('/api/auth/me')
        if (!authResponse.ok) {
          router.push('/login')
          return
        }
        const authData = await authResponse.json()
        setUser(authData.user)
        
        // Fetch stats
        const statsResponse = await fetch('/api/dashboard/stats')
        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          setStats(statsData)
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [router])
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }
  
  const currency = user?.currency_symbol || '$'
  
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Bienvenido a {user?.store_name || 'tu tienda'}
          </p>
        </div>
        
        {/* Today Stats */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ventas de Hoy
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {currency}{stats?.today.revenue.toFixed(2) || '0.00'}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.today.sales_count || 0} transacciones
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ganancia del Día
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {currency}{stats?.today.profit.toFixed(2) || '0.00'}
              </div>
              <p className="text-xs text-muted-foreground">
                Margen de ganancia
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Productos
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.inventory.total_products || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                En inventario
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Alertas de Stock
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats?.inventory.low_stock_count || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Productos con poco stock
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Month Stats */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Ventas del Mes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {currency}{stats?.month.revenue.toFixed(2) || '0.00'}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Ganancia: {currency}{stats?.month.profit.toFixed(2) || '0.00'}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/pos" className="block">
                <Button className="w-full" size="lg">Abrir Terminal POS</Button>
              </Link>
              <Link href="/inventory" className="block">
                <Button variant="outline" className="w-full">Gestionar Inventario</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
        
        {/* Low Stock Products */}
        {stats?.inventory.low_stock_products && stats.inventory.low_stock_products.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Productos con Poco Stock
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.inventory.low_stock_products.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{product.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-orange-600">
                        Stock: {product.stock_quantity}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {currency}{product.sale_price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}