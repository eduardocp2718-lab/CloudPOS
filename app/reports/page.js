'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { FileText, Calendar, FileSpreadsheet } from 'lucide-react'
import * as XLSX from 'xlsx'
import { toast } from 'sonner'

export default function ReportsPage() {
  const router = useRouter()
  const [sales, setSales] = useState([])
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (!response.ok) {
          router.push('/login')
          return
        }
        const data = await response.json()
        setUser(data.user)
      } catch (error) {
        router.push('/login')
      }
    }
    checkAuth()
  }, [router])
  
  const fetchSales = async () => {
    setIsLoading(true)
    try {
      let url = '/api/sales'
      const params = new URLSearchParams()
      if (startDate) params.append('start_date', startDate)
      if (endDate) params.append('end_date', endDate)
      if (params.toString()) url += `?${params.toString()}`
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setSales(data)
      }
    } catch (error) {
      console.error('Error fetching sales:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleExportToExcel = () => {
    if (sales.length === 0) {
      toast.error('No hay datos para exportar')
      return
    }
    
    try {
      // Prepare data for Excel
      const excelData = []
      
      sales.forEach((sale) => {
        const saleDate = new Date(sale.date).toLocaleString('es-ES', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
        
        const itemsList = sale.items.map(item => 
          `${item.quantity}x ${item.product_name} (${currency}${item.price_at_sale.toFixed(2)})`
        ).join(', ')
        
        excelData.push({
          'Fecha': saleDate,
          'Items Vendidos': itemsList,
          'Cantidad de Items': sale.items.reduce((sum, item) => sum + item.quantity, 0),
          'Método de Pago': sale.payment_method === 'cash' ? 'Efectivo' : 'Tarjeta',
          'Total Venta': `${currency}${sale.total_amount.toFixed(2)}`,
          'Ganancia': `${currency}${sale.profit.toFixed(2)}`,
          'Monto Recibido': `${currency}${(sale.amount_received || sale.total_amount).toFixed(2)}`,
          'Cambio': `${currency}${(sale.change_given || 0).toFixed(2)}`
        })
      })
      
      // Add summary row
      excelData.push({
        'Fecha': '',
        'Items Vendidos': '',
        'Cantidad de Items': '',
        'Método de Pago': 'TOTAL',
        'Total Venta': `${currency}${totalRevenue.toFixed(2)}`,
        'Ganancia': `${currency}${totalProfit.toFixed(2)}`,
        'Monto Recibido': '',
        'Cambio': ''
      })
      
      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(excelData)
      
      // Set column widths
      ws['!cols'] = [
        { wch: 20 }, // Fecha
        { wch: 50 }, // Items
        { wch: 15 }, // Cantidad
        { wch: 15 }, // Método
        { wch: 15 }, // Total
        { wch: 15 }, // Ganancia
        { wch: 15 }, // Recibido
        { wch: 15 }  // Cambio
      ]
      
      // Create workbook
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Ventas')
      
      // Generate filename with date range or current date
      let filename = 'Reporte_Ventas'
      if (startDate || endDate) {
        filename += `_${startDate || 'inicio'}_${endDate || 'fin'}`
      } else {
        filename += `_${new Date().toISOString().split('T')[0]}`
      }
      filename += '.xlsx'
      
      // Download file
      XLSX.writeFile(wb, filename)
      
      toast.success(`Archivo ${filename} descargado exitosamente`)
    } catch (error) {
      console.error('Error exporting to Excel:', error)
      toast.error('Error al exportar a Excel')
    }
  }
  
  useEffect(() => {
    if (user) {
      fetchSales()
    }
  }, [user])
  
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total_amount, 0)
  const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0)
  const currency = user?.currency_symbol || '$'
  
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Reportes de Ventas</h1>
          <p className="text-muted-foreground">Historial y análisis de ventas</p>
        </div>
        
        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="start-date">Fecha Inicio</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="end-date">Fecha Fin</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={fetchSales} className="gap-2">
                  <Calendar className="h-4 w-4" />
                  Filtrar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Summary */}
        <div className="grid gap-6 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Ventas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sales.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ingresos Totales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {currency}{totalRevenue.toFixed(2)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ganancia Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {currency}{totalProfit.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Sales Table */}
        <Card>
          <CardHeader>
            <CardTitle>Historial de Ventas</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : sales.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay ventas registradas</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Método Pago</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Ganancia</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell>
                          {new Date(sale.date).toLocaleString('es-ES', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {sale.items.map((item, idx) => (
                              <p key={idx} className="text-sm">
                                {item.quantity}x {item.product_name}
                              </p>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={sale.payment_method === 'cash' ? 'default' : 'secondary'}>
                            {sale.payment_method === 'cash' ? 'Efectivo' : 'Tarjeta'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {currency}{sale.total_amount.toFixed(2)}
                        </TableCell>
                        <TableCell className="font-semibold text-green-600">
                          {currency}{sale.profit.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}