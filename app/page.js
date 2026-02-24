'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function App() {
  const router = useRouter()
  
  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          router.push('/dashboard')
        } else {
          router.push('/login')
        }
      } catch (error) {
        router.push('/login')
      }
    }
    
    checkAuth()
  }, [router])
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
    </div>
  )
}