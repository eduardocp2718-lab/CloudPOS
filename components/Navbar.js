'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Package, ShoppingCart, FileText, LogOut, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  
  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' })
      if (response.ok) {
        toast.success('Sesión cerrada exitosamente')
        router.push('/login')
      }
    } catch (error) {
      toast.error('Error al cerrar sesión')
    }
  }
  
  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/inventory', label: 'Inventario', icon: Package },
    { href: '/pos', label: 'Terminal POS', icon: ShoppingCart },
    { href: '/cash-register', label: 'Control de Caja', icon: Wallet },
    { href: '/reports', label: 'Reportes', icon: FileText },
  ]
  
  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-xl font-bold text-primary">
              CloudPOS
            </Link>
            <div className="hidden md:flex gap-4">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive ? 'default' : 'ghost'}
                      className="gap-2"
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                )
              })}
            </div>
          </div>
          <Button variant="ghost" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            Salir
          </Button>
        </div>
      </div>
    </nav>
  )
}