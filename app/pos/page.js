'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import useCartStore from '@/lib/store'
import TicketReceipt from '@/components/TicketReceipt'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Search, Trash2, Plus, Minus, DollarSign, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function POSPage() {
  const router = useRouter()
  const [products, setProducts] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [user, setUser] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [amountReceived, setAmountReceived] = useState('')
  const [lastSale, setLastSale] = useState(null)
  
  const { items, addItem, removeItem, updateQuantity, clearCart, getTotal, getItemCount } = useCartStore()
  
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
  
  const fetchProducts = async (search = '') => {
    try {
      const url = search ? `/api/products?search=${encodeURIComponent(search)}` : '/api/products'
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }
  
  useEffect(() => {
    if (user) {
      fetchProducts()
    }
  }, [user])
  
  useEffect(() => {
    if (searchTerm) {
      const debounce = setTimeout(() => {
        fetchProducts(searchTerm)
      }, 300)
      return () => clearTimeout(debounce)
    } else {
      fetchProducts()
    }
  }, [searchTerm])
  
  const handleAddToCart = (product) => {
    if (product.stock_quantity <= 0) {
      toast.error(`${product.name} no tiene stock disponible`)
      return
    }
    
    const currentItem = items.find(item => item.id === product.id)
    const currentQuantity = currentItem ? currentItem.quantity : 0
    
    if (currentQuantity >= product.stock_quantity) {
      toast.error(`No hay más stock de ${product.name}`)
      return
    }
    
    addItem(product)
    toast.success(`${product.name} agregado al carrito`)
  }
  
  const handleOpenPayment = () => {
    if (items.length === 0) {
      toast.error('El carrito está vacío')
      return
    }
    setAmountReceived('')
    setPaymentMethod('cash')
    setIsPaymentDialogOpen(true)
  }
  
  const handleCompleteSale = async () => {
    const total = getTotal()
    const received = parseFloat(amountReceived) || total
    
    if (paymentMethod === 'cash' && received < total) {
      toast.error('El monto recibido es menor al total')
      return
    }
    
    setIsProcessing(true)
    
    try {
      const saleData = {
        items: items.map(item => ({
          product_id: item.id,
          quantity: item.quantity
        })),
        payment_method: paymentMethod,
        amount_received: received
      }
      
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData)
      })
      
      if (response.ok) {
        const data = await response.json()
        const change = data.change_given
        
        if (paymentMethod === 'cash' && change > 0) {
          toast.success(`¡Venta completada! Cambio: ${user?.currency_symbol}${change.toFixed(2)}`)
        } else {
          toast.success('¡Venta completada exitosamente!')
        }
        
        clearCart()
        setIsPaymentDialogOpen(false)
        fetchProducts() // Refresh to update stock
      } else {
        const data = await response.json()
        toast.error(data.error || 'Error al procesar la venta')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setIsProcessing(false)
    }
  }
  
  const total = getTotal()
  const itemCount = getItemCount()
  const change = paymentMethod === 'cash' ? (parseFloat(amountReceived) || 0) - total : 0
  const currency = user?.currency_symbol || '$'
  
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Terminal de Venta</h1>
          <p className="text-muted-foreground">Escanea o busca productos para vender</p>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Side - Product Search and Grid */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre o escanear código de barras..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    autoFocus
                  />
                </div>
              </CardHeader>
              <CardContent>
                {products.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No se encontraron productos</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto">
                    {products.map((product) => (
                      <Card
                        key={product.id}
                        className="cursor-pointer hover:bg-muted transition-colors"
                        onClick={() => handleAddToCart(product)}
                      >
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between">
                              <p className="font-semibold text-sm">{product.name}</p>
                              {product.low_stock_alert && (
                                <Badge variant="destructive" className="text-xs">Bajo</Badge>
                              )}
                            </div>
                            {product.barcode && (
                              <p className="text-xs text-muted-foreground font-mono">
                                {product.barcode}
                              </p>
                            )}
                            <div className="flex items-center justify-between">
                              <Badge variant="outline">{product.category}</Badge>
                              <span className="text-sm text-muted-foreground">
                                Stock: {product.stock_quantity}
                              </span>
                            </div>
                            <div className="flex items-center justify-between pt-2">
                              <span className="text-lg font-bold text-primary">
                                {currency}{product.sale_price.toFixed(2)}
                              </span>
                              <Button size="sm" variant="default">
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Right Side - Cart/Ticket */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Ticket de Venta</span>
                  <Badge variant="secondary">{itemCount} items</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {items.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-sm">El carrito está vacío</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3 max-h-[400px] overflow-y-auto">
                        {items.map((item) => (
                          <div key={item.id} className="bg-muted p-3 rounded-lg space-y-2">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-sm">{item.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {currency}{item.sale_price.toFixed(2)} c/u
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => removeItem(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="w-12 text-center font-semibold">
                                  {item.quantity}
                                </span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                              <span className="font-bold">
                                {currency}{(item.sale_price * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-lg">
                          <span>Subtotal:</span>
                          <span className="font-semibold">{currency}{total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-2xl font-bold">
                          <span>TOTAL:</span>
                          <span className="text-primary">{currency}{total.toFixed(2)}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Button
                          className="w-full"
                          size="lg"
                          onClick={handleOpenPayment}
                        >
                          Cobrar {currency}{total.toFixed(2)}
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            clearCart()
                            toast.info('Carrito limpiado')
                          }}
                        >
                          Limpiar Carrito
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Payment Dialog */}
        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Procesar Pago</DialogTitle>
              <DialogDescription>
                Total a cobrar: {currency}{total.toFixed(2)}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="payment-method">Método de Pago</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Efectivo</SelectItem>
                    <SelectItem value="card">Tarjeta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {paymentMethod === 'cash' && (
                <div className="space-y-2">
                  <Label htmlFor="amount-received">Monto Recibido</Label>
                  <Input
                    id="amount-received"
                    type="number"
                    step="0.01"
                    min={total}
                    placeholder={total.toFixed(2)}
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                    autoFocus
                  />
                  {amountReceived && parseFloat(amountReceived) >= total && (
                    <div className="bg-green-500/10 p-3 rounded-lg">
                      <p className="text-sm text-green-600 font-semibold">
                        Cambio: {currency}{change.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              <div className="bg-muted p-4 rounded-lg space-y-1">
                <p className="text-sm text-muted-foreground">Resumen de venta:</p>
                <p className="font-semibold">{itemCount} productos</p>
                <p className="text-2xl font-bold text-primary">
                  Total: {currency}{total.toFixed(2)}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPaymentDialogOpen(false)}
                disabled={isProcessing}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleCompleteSale}
                disabled={isProcessing || (paymentMethod === 'cash' && change < 0)}
              >
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar Venta
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}