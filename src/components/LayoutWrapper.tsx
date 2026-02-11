'use client'

import { usePathname } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isIntakeForm = pathname === '/intake-form'

  if (isIntakeForm) {
    return <>{children}</>
  }

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
