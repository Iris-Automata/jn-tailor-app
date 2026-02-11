'use client'

import { usePathname } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { AuthProvider, useAuth } from '@/components/AuthProvider'
import LoginPage from '@/components/LoginPage'

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { session, loading } = useAuth()
  
  // Public routes that don't need auth
  const isPublicRoute = pathname === '/intake-form'

  // Show nothing while checking auth
  if (loading && !isPublicRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-soulsonic">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-taupe/30 border-t-sage rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-charcoal">Loading...</p>
        </div>
      </div>
    )
  }

  // Public routes - no auth needed
  if (isPublicRoute) {
    return <>{children}</>
  }

  // Not logged in - show login page
  if (!session) {
    return <LoginPage />
  }

  // Logged in - show app with sidebar
  return (
    <>
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen">
        <div className="p-8">
          {children}
        </div>
      </main>
    </>
  )
}

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <LayoutContent>{children}</LayoutContent>
    </AuthProvider>
  )
}
