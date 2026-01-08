import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'JN Tailor & Alterations',
  description: 'Order management system powered by Iris Automata',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <nav className="border-b border-taupe/20 bg-white">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="font-display text-xl tracking-tight">
              JN Tailor & Alterations
            </div>
            <div className="flex gap-8 text-sm">
              <a href="/" className="text-charcoal hover:text-rust transition-colors">
                Dashboard
              </a>
              <a href="/customers" className="text-taupe hover:text-rust transition-colors">
                Customers
              </a>
              <a href="/orders" className="text-taupe hover:text-rust transition-colors">
                Orders
              </a>
            </div>
          </div>
        </nav>
        <main className="max-w-6xl mx-auto px-6 py-8">
          {children}
        </main>
        <footer className="border-t border-taupe/20 mt-16">
          <div className="max-w-6xl mx-auto px-6 py-4 text-center text-sm text-taupe">
            Powered by Iris Automata
          </div>
        </footer>
      </body>
    </html>
  )
}
