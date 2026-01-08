'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewCustomerPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const data = {
      first_name: formData.get('first_name') as string,
      last_name: formData.get('last_name') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string || '',
      notes: formData.get('notes') as string || '',
    }

    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) throw new Error('Failed to add customer')

      router.push('/customers')
    } catch (err) {
      setError('Failed to add customer. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <Link href="/customers" className="text-sm text-taupe hover:text-rust transition-colors">
          ← Back to Customers
        </Link>
        <h1 className="font-display text-3xl mt-4 mb-2">New Customer</h1>
        <p className="text-taupe">Add a new customer to your records</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-rust/10 border border-rust/30 rounded-sm text-rust text-sm">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">First Name</label>
            <input
              type="text"
              name="first_name"
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Last Name</label>
            <input
              type="text"
              name="last_name"
              className="input-field"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Phone Number</label>
          <input
            type="tel"
            name="phone"
            className="input-field"
            placeholder="(555) 123-4567"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Email <span className="text-taupe font-normal">(optional)</span>
          </label>
          <input
            type="email"
            name="email"
            className="input-field"
            placeholder="customer@email.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Notes <span className="text-taupe font-normal">(optional)</span>
          </label>
          <textarea
            name="notes"
            rows={3}
            className="input-field resize-none"
            placeholder="Preferences, special requests, etc."
          />
        </div>

        <div className="flex gap-4 pt-4">
          <button 
            type="submit" 
            className="btn-primary disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Adding...' : 'Add Customer'}
          </button>
          <Link href="/customers" className="btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
