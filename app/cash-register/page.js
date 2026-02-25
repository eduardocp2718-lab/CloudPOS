'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import CashRegisterReceipt from '@/components/CashRegisterReceipt'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  AlertCircle,
  Plus,
  Minus,
  Lock,
  Unlock,
  FileText,
  Camera
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function CashRegisterPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [cashRegister, setCashRegister] = useState(null)
  const [history, setHistory] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Dialogs
  const [isOpenDialogOpen, setIsOpenDialogOpen] = useState(false)
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false)
  const [isWithdrawalDialogOpen, setIsWithdrawalDialogOpen] = useState(false)
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false)
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false)
  
  // Form states
  const [initialCash, setInitialCash] = useState('')
  const [expenseAmount, setExpenseAmount] = useState('')
  const [expenseDescription, setExpenseDescription] = useState('')
  const [withdrawalAmount, setWithdrawalAmount] = useState('')
  const [withdrawalDescription, setWithdrawalDescription] = useState('')
  const [actualCash, setActualCash] = useState('')
  const [closingNotes, setClosingNotes] = useState('')
  const [closingPhoto, setClosingPhoto] = useState(null)
  const [closedCashRegister, setClosedCashRegister] = useState(null)
  
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
  
  const fetchCashRegister = async () => {
    try {
      const response = await fetch('/api/cash-register/current')
      if (response.ok) {
        const data = await response.json()
        setCashRegister(data.cashRegister || data)
      }
    } catch (error) {
      console.error('Error fetching cash register:', error)
    }
  }
  
  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/cash-register/history?limit=10')
      if (response.ok) {
        const data = await response.json()
        setHistory(data)
      }
    } catch (error) {
      console.error('Error fetching history:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  useEffect(() => {
    if (user) {
      fetchCashRegister()
      fetchHistory()
    }
  }, [user])
  
  const handleOpenCash = async () => {
    if (!initialCash || parseFloat(initialCash) < 0) {
      toast.error('Ingresa un monto válido para el fondo inicial')
      return
    }
    
    try {
      const response = await fetch('/api/cash-register/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initial_cash: parseFloat(initialCash) })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast.success('Caja abierta exitosamente')
        setCashRegister(data)
        setIsOpenDialogOpen(false)
        setInitialCash('')
      } else {
        toast.error(data.error || 'Error al abrir caja')
      }
    } catch (error) {
      toast.error('Error de conexión')
    }
  }
  
  const handleRegisterExpense = async () => {
    if (!expenseAmount || !expenseDescription) {
      toast.error('Completa todos los campos')
      return
    }
    
    try {
      const response = await fetch('/api/cash-register/expense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(expenseAmount),
          description: expenseDescription
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast.success('Gasto registrado')
        fetchCashRegister()
        setIsExpenseDialogOpen(false)
        setExpenseAmount('')
        setExpenseDescription('')
      } else {
        toast.error(data.error || 'Error al registrar gasto')
      }
    } catch (error) {
      toast.error('Error de conexión')
    }
  }
  
  const handleRegisterWithdrawal = async () => {
    if (!withdrawalAmount || !withdrawalDescription) {
      toast.error('Completa todos los campos')
      return
    }
    
    try {
      const response = await fetch('/api/cash-register/withdrawal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(withdrawalAmount),
          description: withdrawalDescription
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast.success('Retiro registrado')
        fetchCashRegister()
        setIsWithdrawalDialogOpen(false)
        setWithdrawalAmount('')
        setWithdrawalDescription('')
      } else {
        toast.error(data.error || 'Error al registrar retiro')
      }
    } catch (error) {
      toast.error('Error de conexión')
    }
  }
  
  const handleCloseCash = async () => {
    if (actualCash === '' || parseFloat(actualCash) < 0) {
      toast.error('Ingresa el conteo real de efectivo')
      return
    }
    
    const actualCashValue = parseFloat(actualCash)
    const difference = actualCashValue - cashRegister.expected_cash
    const differencePercentage = (difference / cashRegister.expected_cash) * 100
    
    // Alert if difference is greater than 2%
    if (Math.abs(differencePercentage) > 2 && !closingNotes) {
      toast.warning('La diferencia es mayor al 2%. Por favor agrega una nota explicativa.')
      return
    }
    
    try {
      const response = await fetch('/api/cash-register/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actual_cash: actualCashValue,
          closing_notes: closingNotes || null,
          closing_photo_url: closingPhoto || null
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast.success('Caja cerrada exitosamente')
        setClosedCashRegister(data)
        setCashRegister(null)
        setIsCloseDialogOpen(false)
        setIsReceiptDialogOpen(true)
        setActualCash('')
        setClosingNotes('')
        setClosingPhoto(null)
        fetchHistory()
      } else {
        toast.error(data.error || 'Error al cerrar caja')
      }
    } catch (error) {
      toast.error('Error de conexión')
    }
  }
  
  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // In a real app, you would upload this to a service like S3
      // For now, we'll just show it's selected
      const reader = new FileReader()
      reader.onloadend = () => {
        setClosingPhoto(reader.result)
        toast.info('Foto cargada (nota: en producción se subiría a un servidor)')
      }
      reader.readAsDataURL(file)
    }
  }
  
  if (isLoading) {
    return (
      <div className=\"flex items-center justify-center min-h-screen\">
        <div className=\"animate-spin rounded-full h-32 w-32 border-b-2 border-primary\"></div>
      </div>
    )
  }
  
  const currency = user?.currency_symbol || '$'
  const difference = actualCash ? parseFloat(actualCash) - (cashRegister?.expected_cash || 0) : 0
  const differencePercentage = cashRegister?.expected_cash > 0 
    ? (difference / cashRegister.expected_cash) * 100 
    : 0
  
  return (
    <div className=\"min-h-screen bg-background\">
      <Navbar />
      <main className=\"container mx-auto p-6\">
        <div className=\"mb-6\">
          <h1 className=\"text-3xl font-bold mb-2\">Control de Caja</h1>
          <p className=\"text-muted-foreground\">
            Gestiona apertura, gastos, retiros y cierre de caja
          </p>
        </div>
        
        {/* Current Cash Register Status */}
        {!cashRegister ? (
          <Card className=\"mb-6\">
            <CardHeader>
              <CardTitle className=\"flex items-center gap-2\">
                <Lock className=\"h-5 w-5 text-red-500\" />
                Caja Cerrada
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className=\"text-muted-foreground mb-4\">
                No hay una caja abierta actualmente. Abre una caja para comenzar a operar.
              </p>
              <Button onClick={() => setIsOpenDialogOpen(true)} className=\"gap-2\">
                <Unlock className=\"h-4 w-4\" />
                Abrir Caja
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Open Cash Register Dashboard */}
            <Card className=\"mb-6\">
              <CardHeader>
                <div className=\"flex items-center justify-between\">
                  <CardTitle className=\"flex items-center gap-2\">
                    <Unlock className=\"h-5 w-5 text-green-500\" />
                    Caja Abierta
                  </CardTitle>
                  <Badge variant=\"outline\" className=\"text-sm\">
                    <Clock className=\"h-3 w-3 mr-1\" />
                    {new Date(cashRegister.opened_at).toLocaleString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className=\"grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6\">
                  <Card>
                    <CardContent className=\"pt-6\">
                      <div className=\"text-2xl font-bold\">
                        {currency}{cashRegister.initial_cash.toFixed(2)}
                      </div>
                      <p className=\"text-xs text-muted-foreground\">Fondo Inicial</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className=\"pt-6\">
                      <div className=\"text-2xl font-bold text-green-600\">
                        {currency}{cashRegister.cash_sales.toFixed(2)}
                      </div>
                      <p className=\"text-xs text-muted-foreground\">Ventas Efectivo</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className=\"pt-6\">
                      <div className=\"text-2xl font-bold text-blue-600\">
                        {currency}{cashRegister.card_sales.toFixed(2)}
                      </div>
                      <p className=\"text-xs text-muted-foreground\">Ventas Tarjeta</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className=\"pt-6\">
                      <div className=\"text-2xl font-bold text-primary\">
                        {currency}{cashRegister.expected_cash.toFixed(2)}
                      </div>
                      <p className=\"text-xs text-muted-foreground\">Esperado en Caja</p>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Expenses and Withdrawals */}
                <div className=\"grid gap-6 md:grid-cols-2 mb-6\">
                  <div>
                    <div className=\"flex items-center justify-between mb-3\">
                      <h3 className=\"font-semibold\">Gastos del Día</h3>
                      <Button 
                        size=\"sm\" 
                        variant=\"outline\" 
                        onClick={() => setIsExpenseDialogOpen(true)}
                        className=\"gap-1\"
                      >
                        <Plus className=\"h-3 w-3\" />
                        Agregar
                      </Button>
                    </div>
                    {cashRegister.expenses.length === 0 ? (
                      <p className=\"text-sm text-muted-foreground\">Sin gastos registrados</p>
                    ) : (
                      <div className=\"space-y-2\">
                        {cashRegister.expenses.map((expense) => (
                          <div key={expense.id} className=\"flex justify-between items-center p-2 bg-muted rounded\">
                            <span className=\"text-sm\">{expense.description}</span>
                            <span className=\"text-sm font-semibold text-red-600\">
                              -{currency}{expense.amount.toFixed(2)}
                            </span>
                          </div>
                        ))}
                        <div className=\"flex justify-between items-center pt-2 border-t\">
                          <span className=\"font-semibold\">Total Gastos:</span>
                          <span className=\"font-bold text-red-600\">
                            -{currency}{cashRegister.expenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <div className=\"flex items-center justify-between mb-3\">
                      <h3 className=\"font-semibold\">Retiros del Día</h3>
                      <Button 
                        size=\"sm\" 
                        variant=\"outline\" 
                        onClick={() => setIsWithdrawalDialogOpen(true)}
                        className=\"gap-1\"
                      >
                        <Minus className=\"h-3 w-3\" />
                        Agregar
                      </Button>
                    </div>
                    {cashRegister.withdrawals.length === 0 ? (
                      <p className=\"text-sm text-muted-foreground\">Sin retiros registrados</p>
                    ) : (
                      <div className=\"space-y-2\">
                        {cashRegister.withdrawals.map((withdrawal) => (
                          <div key={withdrawal.id} className=\"flex justify-between items-center p-2 bg-muted rounded\">
                            <span className=\"text-sm\">{withdrawal.description}</span>
                            <span className=\"text-sm font-semibold text-orange-600\">
                              -{currency}{withdrawal.amount.toFixed(2)}
                            </span>
                          </div>
                        ))}
                        <div className=\"flex justify-between items-center pt-2 border-t\">
                          <span className=\"font-semibold\">Total Retiros:</span>
                          <span className=\"font-bold text-orange-600\">
                            -{currency}{cashRegister.withdrawals.reduce((sum, w) => sum + w.amount, 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <Button 
                  onClick={() => setIsCloseDialogOpen(true)} 
                  className=\"w-full\" 
                  size=\"lg\"
                  variant=\"destructive\"
                >
                  <Lock className=\"h-4 w-4 mr-2\" />
                  Cerrar Caja
                </Button>
              </CardContent>
            </Card>
          </>
        )}
        
        {/* History */}
        {history.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className=\"flex items-center gap-2\">
                <FileText className=\"h-5 w-5\" />
                Historial de Cierres
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className=\"overflow-x-auto\">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha Cierre</TableHead>
                      <TableHead>Cajero</TableHead>
                      <TableHead>Esperado</TableHead>
                      <TableHead>Real</TableHead>
                      <TableHead>Diferencia</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((register) => (
                      <TableRow key={register.id}>
                        <TableCell>
                          {new Date(register.closed_at).toLocaleString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </TableCell>
                        <TableCell>{register.opened_by}</TableCell>
                        <TableCell>{currency}{register.expected_cash.toFixed(2)}</TableCell>
                        <TableCell>{currency}{register.actual_cash.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={
                            register.difference > 0 ? 'default' : 
                            register.difference < 0 ? 'destructive' : 
                            'secondary'
                          }>
                            {register.difference > 0 ? '+' : ''}
                            {currency}{register.difference.toFixed(2)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Open Cash Dialog */}
        <Dialog open={isOpenDialogOpen} onOpenChange={setIsOpenDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Abrir Caja</DialogTitle>
              <DialogDescription>
                Ingresa el fondo inicial con el que comenzarás el día
              </DialogDescription>
            </DialogHeader>
            <div className=\"space-y-4 py-4\">
              <div className=\"space-y-2\">
                <Label htmlFor=\"initial-cash\">Fondo Inicial</Label>
                <Input
                  id=\"initial-cash\"
                  type=\"number\"
                  step=\"0.01\"
                  min=\"0\"
                  placeholder=\"500.00\"
                  value={initialCash}
                  onChange={(e) => setInitialCash(e.target.value)}
                  autoFocus
                />
                <p className=\"text-sm text-muted-foreground\">
                  Este es el dinero con el que cuentas para dar cambios
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant=\"outline\" onClick={() => setIsOpenDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleOpenCash}>
                Abrir Caja
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Expense Dialog */}
        <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Gasto</DialogTitle>
              <DialogDescription>
                Registra un gasto del negocio (pago a proveedor, servicios, etc.)
              </DialogDescription>
            </DialogHeader>
            <div className=\"space-y-4 py-4\">
              <div className=\"space-y-2\">
                <Label htmlFor=\"expense-amount\">Monto</Label>
                <Input
                  id=\"expense-amount\"
                  type=\"number\"
                  step=\"0.01\"
                  min=\"0.01\"
                  placeholder=\"50.00\"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                />
              </div>
              <div className=\"space-y-2\">
                <Label htmlFor=\"expense-description\">Descripción</Label>
                <Input
                  id=\"expense-description\"
                  placeholder=\"Ej: Pago de luz\"
                  value={expenseDescription}
                  onChange={(e) => setExpenseDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant=\"outline\" onClick={() => setIsExpenseDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleRegisterExpense}>
                Registrar Gasto
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Withdrawal Dialog */}
        <Dialog open={isWithdrawalDialogOpen} onOpenChange={setIsWithdrawalDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Retiro</DialogTitle>
              <DialogDescription>
                Registra un retiro de efectivo de la caja (ej: depósito a banco)
              </DialogDescription>
            </DialogHeader>
            <div className=\"space-y-4 py-4\">
              <div className=\"space-y-2\">
                <Label htmlFor=\"withdrawal-amount\">Monto</Label>
                <Input
                  id=\"withdrawal-amount\"
                  type=\"number\"
                  step=\"0.01\"
                  min=\"0.01\"
                  placeholder=\"300.00\"
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                />
              </div>
              <div className=\"space-y-2\">
                <Label htmlFor=\"withdrawal-description\">Descripción</Label>
                <Input
                  id=\"withdrawal-description\"
                  placeholder=\"Ej: Depósito a banco\"
                  value={withdrawalDescription}
                  onChange={(e) => setWithdrawalDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant=\"outline\" onClick={() => setIsWithdrawalDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleRegisterWithdrawal}>
                Registrar Retiro
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Close Cash Dialog */}
        <Dialog open={isCloseDialogOpen} onOpenChange={setIsCloseDialogOpen}>
          <DialogContent className=\"max-w-md\">
            <DialogHeader>
              <DialogTitle>Cerrar Caja</DialogTitle>
              <DialogDescription>
                Cuenta el efectivo físicamente e ingresa el monto real
              </DialogDescription>
            </DialogHeader>
            <div className=\"space-y-4 py-4\">
              <div className=\"bg-muted p-4 rounded-lg space-y-2\">
                <div className=\"flex justify-between\">
                  <span className=\"text-sm\">Esperado en caja:</span>
                  <span className=\"font-bold\">{currency}{cashRegister?.expected_cash.toFixed(2)}</span>
                </div>
              </div>
              
              <div className=\"space-y-2\">
                <Label htmlFor=\"actual-cash\">Conteo Real *</Label>
                <Input
                  id=\"actual-cash\"
                  type=\"number\"
                  step=\"0.01\"
                  min=\"0\"
                  placeholder=\"700.00\"
                  value={actualCash}
                  onChange={(e) => setActualCash(e.target.value)}
                  autoFocus
                />
              </div>
              
              {actualCash && (
                <div className={`p-4 rounded-lg ${
                  difference > 0 ? 'bg-green-500/10 border border-green-500' : 
                  difference < 0 ? 'bg-red-500/10 border border-red-500' : 
                  'bg-blue-500/10 border border-blue-500'
                }`}>
                  <div className=\"flex items-center justify-between\">
                    <span className=\"font-semibold\">
                      {difference > 0 ? 'Sobrante' : difference < 0 ? 'Faltante' : 'Cuadrado'}
                    </span>
                    <span className=\"text-xl font-bold\">
                      {difference > 0 && '+'}{currency}{Math.abs(difference).toFixed(2)}
                    </span>
                  </div>
                  {Math.abs(differencePercentage) > 0 && (
                    <p className=\"text-sm mt-1\">
                      {Math.abs(differencePercentage).toFixed(2)}% de diferencia
                    </p>
                  )}
                </div>
              )}
              
              {Math.abs(differencePercentage) > 2 && (
                <Alert variant=\"destructive\">
                  <AlertCircle className=\"h-4 w-4\" />
                  <AlertDescription>
                    La diferencia es mayor al 2%. Es obligatorio agregar una nota explicativa.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className=\"space-y-2\">
                <Label htmlFor=\"closing-notes\">
                  Notas {Math.abs(differencePercentage) > 2 && '*'}
                </Label>
                <Textarea
                  id=\"closing-notes\"
                  placeholder=\"Explica si hay alguna diferencia o situación especial...\"
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className=\"space-y-2\">
                <Label htmlFor=\"closing-photo\">
                  <Camera className=\"h-4 w-4 inline mr-2\" />
                  Foto del Conteo (Opcional)
                </Label>
                <Input
                  id=\"closing-photo\"
                  type=\"file\"
                  accept=\"image/*\"
                  onChange={handlePhotoChange}
                />
                <p className=\"text-xs text-muted-foreground\">
                  Puedes tomar una foto como evidencia del conteo
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant=\"outline\" onClick={() => setIsCloseDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleCloseCash}
                disabled={!actualCash || (Math.abs(differencePercentage) > 2 && !closingNotes)}
              >
                Confirmar Cierre
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Receipt Dialog */}
        <Dialog open={isReceiptDialogOpen} onOpenChange={setIsReceiptDialogOpen}>
          <DialogContent className=\"max-w-2xl\">
            <DialogHeader>
              <DialogTitle>Corte de Caja Completado</DialogTitle>
              <DialogDescription>
                El cierre se realizó exitosamente. Puedes imprimir el reporte.
              </DialogDescription>
            </DialogHeader>
            {closedCashRegister && (
              <CashRegisterReceipt 
                cashRegister={closedCashRegister}
                storeName={user?.store_name || 'Mi Tienda'}
                currency={currency}
              />
            )}
            <DialogFooter>
              <Button onClick={() => setIsReceiptDialogOpen(false)}>
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
