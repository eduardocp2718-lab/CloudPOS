'use client'

import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'
import { toast } from 'sonner'

export default function TicketReceipt({ sale, storeName, currency, onPrint }) {
  const printRef = useRef()
  
  const handlePrint = () => {
    try {
      window.print()
      toast.success('Ticket enviado a imprimir')
      if (onPrint) onPrint()
    } catch (error) {
      toast.error('Error al imprimir')
    }
  }
  
  const saleDate = new Date(sale.date).toLocaleString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
  
  return (
    <>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #ticket-receipt, #ticket-receipt * {
            visibility: visible;
          }
          #ticket-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            padding: 10mm;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
      
      <div className="space-y-4">
        <Button onClick={handlePrint} className="w-full gap-2">
          <Printer className="h-4 w-4" />
          Imprimir Ticket
        </Button>
        
        <div id="ticket-receipt" className="bg-white text-black p-6 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold">{storeName}</h2>
            <p className="text-sm text-gray-600">Sistema CloudPOS</p>
            <div className="border-b-2 border-gray-300 my-2"></div>
          </div>
          
          <div className="mb-4 text-sm">
            <p><strong>Fecha:</strong> {saleDate}</p>
            <p><strong>Ticket #:</strong> {sale.id.slice(0, 8).toUpperCase()}</p>
            <p><strong>Método:</strong> {sale.payment_method === 'cash' ? 'Efectivo' : 'Tarjeta'}</p>
          </div>
          
          <div className="border-b-2 border-gray-300 my-3"></div>
          
          <div className="mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left py-1">Producto</th>
                  <th className="text-center py-1">Cant</th>
                  <th className="text-right py-1">Precio</th>
                  <th className="text-right py-1">Total</th>
                </tr>
              </thead>
              <tbody>
                {sale.items.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-200">
                    <td className="py-2 text-left">{item.product_name}</td>
                    <td className="py-2 text-center">{item.quantity}</td>
                    <td className="py-2 text-right">{currency}{item.price_at_sale.toFixed(2)}</td>
                    <td className="py-2 text-right font-semibold">
                      {currency}{(item.quantity * item.price_at_sale).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="border-b-2 border-gray-300 my-3"></div>
          
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-semibold">{currency}{sale.total_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>TOTAL:</span>
              <span>{currency}{sale.total_amount.toFixed(2)}</span>
            </div>
            
            {sale.payment_method === 'cash' && (
              <>
                <div className="border-t border-gray-300 my-2 pt-2"></div>
                <div className="flex justify-between">
                  <span>Recibido:</span>
                  <span>{currency}{(sale.amount_received || sale.total_amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Cambio:</span>
                  <span>{currency}{(sale.change_given || 0).toFixed(2)}</span>
                </div>
              </>
            )}
          </div>
          
          <div className="border-b-2 border-gray-300 my-4"></div>
          
          <div className="text-center text-sm">
            <p className="font-semibold">¡Gracias por su compra!</p>
            <p className="text-xs text-gray-600 mt-2">Vuelva pronto</p>
          </div>
        </div>
      </div>
    </>
  )
}