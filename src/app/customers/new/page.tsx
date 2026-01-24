'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Customer {
  customer_id: string
  first_name: string
  last_name: string
  phone: string
}

export default function NewCustomerPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [customers, setCustomers] = useState<Customer[]>([])
  
  // Duplicate warning modal state
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)
  const [pendingCustomerData, setPendingCustomerData] = useState<any>(null)

  useEffect(() => {
    fetchCustomers()
  }, [])

  async function fetchCustomers() {
    try {
      const res = await fetch('/api/customers')
      if (res.ok) {
        const data = await res.json()
        setCustomers(data)
      }
    } catch (err) {
      console.error('Failed to fetch customers:', err)
    }
  }

  function checkForDuplicate(firstName: string, lastName: string, phone: string): boolean {
    return customers.some(
      (c) =>
        c.first_name.toLowerCase() === firstName.toLowerCase() &&
        c.last_name.toLowerCase() === lastName.toLowerCase() &&
        c.phone === phone
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    const formData = new FormData(e.currentTarget)
    const data = {
      first_name: formData.get('first_name') as string,
      last_name: formData.get('last_name') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string || '',
      notes: formData.get('notes') as string || '',
      notification_preference: formData.get('notification_preference') as string,
    }

    // Check for duplicate
    if (checkForDuplicate(data.first_name, data.last_name, data.phone)) {
      setPendingCustomerData(data)
      setShowDuplicateModal(true)
      return
    }

    await submitCustomer(data)
  }

  async function submitCustomer(data: any) {
    setLoading(true)
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

  async function handleAddAnyway() {
    setShowDuplicateModal(false)
    if (pendingCustomerData) {
      await submitCustomer(pendingCustomerData)
    }
  }

  return (
    <div className="max-w-2xl">
      {/* Duplicate Warning Modal */}
      {showDuplicateModal && (
        <div className="fixed inset-0 bg-charcoal/50 flex items-center justify-center z-50">
          <div className="bg-cardBg rounded-sm p-6 max-w-md mx-4 shadow-lg">
            <h3 className="font-display text-xl mb-4">Duplicate Customer</h3>
            <p className="text-charcoal mb-6">
              A customer with the same name and phone number already exists. Do you still want to add this customer?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDuplicateModal(false)
                  setPendingCustomerData(null)
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAnyway}
                className="btn-primary"
              >
                Add Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <Link href="/customers" className="text-sm text-charcoal hover:text-rust transition-colors">
          ← Back to Customers
        </Link>
        <h1 className="font-display text-3xl mt-4 mb-2">New Customer</h1>
        <p className="text-charcoal">Add a new customer to your records</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-rust/10 border border-rust/30 rounded-sm text-charcoal text-sm">
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
            Email <span className="text-charcoal font-normal">(optional)</span>
          </label>
          <input
            type="email"
            name="email"
            className="input-field"
            placeholder="customer@email.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Notification Preference</label>
          <select name="notification_preference" className="input-field" required>
            <option value="SMS">SMS (Text Message)</option>
            <option value="Email">Email</option>
            <option value="Both">Both SMS and Email</option>
            <option value="None">No Notifications</option>
          </select>
          <p className="text-xs text-charcoal mt-1">How should we notify this customer when their order is ready?</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Notes <span className="text-charcoal font-normal">(optional)</span>
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
