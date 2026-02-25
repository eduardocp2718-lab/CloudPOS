'use client'

import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'
import { toast } from 'sonner'

export default function CashRegisterReceipt({ cashRegister, storeName, currency }) {
  const handlePrint = () => {
    try {
      window.print()
      toast.success('Reporte enviado a imprimir')
    } catch (error) {
      toast.error('Error al imprimir')
    }
  }
  
  const openedDate = new Date(cashRegister.opened_at).toLocaleString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
  
  const closedDate = cashRegister.closed_at ? new Date(cashRegister.closed_at).toLocaleString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : 'N/A'
  
  const totalExpenses = cashRegister.expenses.reduce((sum, e) => sum + e.amount, 0)
  const totalWithdrawals = cashRegister.withdrawals.reduce((sum, w) => sum + w.amount, 0)
  
  return (
    <>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #cash-register-receipt, #cash-register-receipt * {
            visibility: visible;
          }
          #cash-register-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20mm;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
      
      <div className="space-y-4">
        <Button onClick={handlePrint} className="w-full gap-2 no-print">
          <Printer className="h-4 w-4" />
          Imprimir Corte de Caja
        </Button>
        
        <div id="cash-register-receipt" className="bg-white text-black p-8 rounded-lg border-2">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold">{storeName}</h2>
            <p className="text-lg text-gray-600">CORTE DE CAJA</p>
            <div className="border-b-2 border-gray-300 my-3"></div>
          </div>
          
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <p><strong>Apertura:</strong></p>
              <p className="text-right">{openedDate}</p>
              <p><strong>Cierre:</strong></p>
              <p className="text-right">{closedDate}</p>
              <p><strong>Cajero:</strong></p>
              <p className="text-right">{cashRegister.opened_by}</p>
              <p><strong>ID Caja:</strong></p>
              <p className="text-right font-mono text-xs">{cashRegister.id.slice(0, 8).toUpperCase()}</p>
            </div>
          </div>
          
          <div className="border-t-2 border-gray-300 my-4"></div>
          
          <div className="space-y-2 mb-4">
            <h3 className="font-bold text-lg mb-3">RESUMEN FINANCIERO</h3>
            
            <div className="grid grid-cols-2 gap-2">
              <p>Fondo Inicial:</p>
              <p className="text-right">{currency}{cashRegister.initial_cash.toFixed(2)}</p>
              
              <p className="text-green-700 font-semibold">Ventas Efectivo:</p>
              <p className="text-right text-green-700 font-semibold">+{currency}{cashRegister.cash_sales.toFixed(2)}</p>
              
              <p className="text-blue-700">Ventas Tarjeta:</p>
              <p className="text-right text-blue-700">{currency}{cashRegister.card_sales.toFixed(2)}</p>
              
              {cashRegister.expenses.length > 0 && (
                <>
                  <p className="text-red-700">Gastos:</p>
                  <p className="text-right text-red-700">-{currency}{totalExpenses.toFixed(2)}</p>
                </>
              )}
              
              {cashRegister.withdrawals.length > 0 && (
                <>
                  <p className="text-orange-700">Retiros:</p>
                  <p className="text-right text-orange-700">-{currency}{totalWithdrawals.toFixed(2)}</p>
                </>
              )}
            </div>
          </div>
          
          {cashRegister.expenses.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-sm mb-2">Detalle de Gastos:</h4>
              {cashRegister.expenses.map((expense, idx) => (
                <div key={idx} className="text-xs grid grid-cols-2 gap-2 ml-4">
                  <p>{expense.description}</p>
                  <p className="text-right">{currency}{expense.amount.toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}
          
          {cashRegister.withdrawals.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-sm mb-2">Detalle de Retiros:</h4>
              {cashRegister.withdrawals.map((withdrawal, idx) => (
                <div key={idx} className="text-xs grid grid-cols-2 gap-2 ml-4">
                  <p>{withdrawal.description}</p>
                  <p className="text-right">{currency}{withdrawal.amount.toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}
          
          <div className="border-t-2 border-gray-300 my-4"></div>
          
          <div className="space-y-2 bg-gray-100 p-4 rounded">
            <div className="grid grid-cols-2 gap-2 text-lg">
              <p className="font-bold">ESPERADO EN CAJA:</p>
              <p className="text-right font-bold">{currency}{cashRegister.expected_cash.toFixed(2)}</p>
              
              <p className="font-bold">CONTEO REAL:</p>
              <p className="text-right font-bold">{currency}{(cashRegister.actual_cash || 0).toFixed(2)}</p>
              
              <p className={`font-bold text-xl ${
                cashRegister.difference > 0 ? 'text-green-700' : 
                cashRegister.difference < 0 ? 'text-red-700' : 
                'text-gray-700'
              }`}>
                {cashRegister.difference > 0 ? 'SOBRANTE:' : 
                 cashRegister.difference < 0 ? 'FALTANTE:' : 
                 'DIFERENCIA:'}
              </p>
              <p className={`text-right font-bold text-xl ${
                cashRegister.difference > 0 ? 'text-green-700' : 
                cashRegister.difference < 0 ? 'text-red-700' : 
                'text-gray-700'
              }`}>
                {currency}{Math.abs(cashRegister.difference || 0).toFixed(2)}
              </p>
              
              {Math.abs(cashRegister.difference_percentage || 0) > 0 && (
                <>
                  <p className="text-sm text-gray-600">Porcentaje:</p>
                  <p className="text-right text-sm text-gray-600">
                    {cashRegister.difference_percentage.toFixed(2)}%
                  </p>
                </>
              )}
            </div>
          </div>
          
          {cashRegister.closing_notes && (
            <>
              <div className="border-t-2 border-gray-300 my-4"></div>
              <div>
                <h4 className="font-semibold mb-2">Notas del Cierre:</h4>
                <p className="text-sm bg-yellow-50 p-3 rounded border border-yellow-200">
                  {cashRegister.closing_notes}
                </p>
              </div>
            </>
          )}
          
          <div className="border-t-2 border-gray-300 my-4"></div>
          
          <div className="text-center text-sm text-gray-600">
            <p>Sistema CloudPOS</p>
            <p className="text-xs mt-2">Este documento es una representación impresa del corte de caja</p>
          </div>
        </div>
      </div>
    </>
  )
}