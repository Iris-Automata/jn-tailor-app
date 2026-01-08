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

export default function NewOrderPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    fetchCustomers()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCustomers([])
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredCustomers(
        customers.filter(
          (c) =>
            c.first_name.toLowerCase().includes(query) ||
            c.last_name.toLowerCase().includes(query) ||
            c.phone.includes(searchQuery)
        ).slice(0, 5)
      )
    }
  }, [searchQuery, customers])

  async function fetchCustomers() {
    try {
      const res = await fetch('/api/customers')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setCustomers(data)
    } catch (err) {
      console.error(err)
    }
  }

  function selectCustomer(customer: Customer) {
    setSelectedCustomer(customer)
    setSearchQuery(`${customer.first_name} ${customer.last_name}`)
    setShowDropdown(false)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    
    if (!selectedCustomer) {
      setError('Please select a customer')
      return
    }

    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const data = {
      customer_id: selectedCustomer.customer_id,
      garment_type: formData.get('garment_type') as string,
      service_type: formData.get('service_type') as string,
      order_details: formData.get('order_details') as string,
      quantity: parseInt(formData.get('quantity') as string) || 1,
      cost: parseFloat(formData.get('cost') as string) || 0,
      expected_date: formData.get('expected_date') as string,
      payment_date: '',
      internal_notes: formData.get('internal_notes') as string || '',
    }

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) throw new Error('Failed to add order')

      router.push('/orders')
    } catch (err) {
      setError('Failed to add order. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <Link href="/orders" className="text-sm text-taupe hover:text-rust transition-colors">
          ← Back to Orders
        </Link>
        <h1 className="font-display text-3xl mt-4 mb-2">New Order</h1>
        <p className="text-taupe">Create a new alteration order</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-rust/10 border border-rust/30 rounded-sm text-rust text-sm">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Customer</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search for customer..."
              className="input-field"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setSelectedCustomer(null)
                setShowDropdown(true)
              }}
              onFocus={() => setShowDropdown(true)}
            />
            {showDropdown && filteredCustomers.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-taupe/30 rounded-sm shadow-lg">
                {filteredCustomers.map((customer) => (
                  <button
                    key={customer.customer_id}
                    type="button"
                    className="w-full px-4 py-3 text-left hover:bg-cream transition-colors"
                    onClick={() => selectCustomer(customer)}
                  >
                    <div className="font-medium">
                      {customer.first_name} {customer.last_name}
                    </div>
                    <div className="text-sm text-taupe">{customer.phone}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          {selectedCustomer && (
            <p className="text-sm text-sage mt-2">
              ✓ Selected: {selectedCustomer.first_name} {selectedCustomer.last_name}
            </p>
          )}
          <p className="text-sm text-taupe mt-2">
            Can't find customer?{' '}
            <Link href="/customers/new" className="text-rust hover:underline">
              Add new customer
            </Link>
          </p>
        </div>

        {/* Garment & Service */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Garment Type</label>
            <select name="garment_type" className="input-field" required>
              <option value="">Select garment...</option>
              <option value="Pants">Pants</option>
              <option value="Jacket">Jacket</option>
              <option value="Shirt">Shirt</option>
              <option value="Dress">Dress</option>
              <option value="Skirt">Skirt</option>
              <option value="Suit">Suit</option>
              <option value="Coat">Coat</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Service Type</label>
            <select name="service_type" className="input-field" required>
              <option value="">Select service...</option>
              <option value="Hem">Hem</option>
              <option value="Taper">Taper</option>
              <option value="Take In">Take In</option>
              <option value="Let Out">Let Out</option>
              <option value="Shorten">Shorten</option>
              <option value="Lengthen">Lengthen</option>
              <option value="Repair">Repair</option>
              <option value="Custom">Custom</option>
            </select>
          </div>
        </div>

        {/* Order Details */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Order Details & Measurements
          </label>
          <textarea
            name="order_details"
            rows={4}
            className="input-field resize-none"
            placeholder="Describe the work needed, include measurements..."
            required
          />
        </div>

        {/* Quantity */}
        <div className="w-32">
          <label className="block text-sm font-medium mb-2">Quantity</label>
          <input
            type="number"
            name="quantity"
            min="1"
            defaultValue="1"
            className="input-field"
            required
          />
        </div>

        {/* Cost & Date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Cost ($)</label>
            <input
              type="number"
              name="cost"
              min="0"
              step="0.01"
              className="input-field"
              placeholder="0.00"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Expected Ready Date</label>
            <input
              type="date"
              name="expected_date"
              className="input-field"
              required
            />
          </div>
        </div>

        {/* Internal Notes */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Internal Notes <span className="text-taupe font-normal">(optional)</span>
          </label>
          <textarea
            name="internal_notes"
            rows={2}
            className="input-field resize-none"
            placeholder="Notes for staff only..."
          />
        </div>

        <div className="flex gap-4 pt-4">
          <button 
            type="submit" 
            className="btn-primary disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Order'}
          </button>
          <Link href="/orders" className="btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
