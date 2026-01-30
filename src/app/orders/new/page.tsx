'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Customer {
  customer_id: string
  first_name: string
  last_name: string
  phone: string
  email: string
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
  
  // Track "Other" selections
  const [garmentType, setGarmentType] = useState('')
  const [serviceType, setServiceType] = useState('')
  const [otherGarment, setOtherGarment] = useState('')
  const [otherService, setOtherService] = useState('')

  // Cost calculation
  const [unitCost, setUnitCost] = useState<number>(0)
  const [quantity, setQuantity] = useState<number>(1)
  const [includeTax, setIncludeTax] = useState(false)
  const TAX_RATE = 0.0825

  // Rush order and payment
  const [isRushOrder, setIsRushOrder] = useState<boolean | null>(null)
  const [isPaidToday, setIsPaidToday] = useState<boolean | null>(null)

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
            c.phone.includes(searchQuery) ||
            c.email.toLowerCase().includes(query)
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

  // Calculate total cost
  function calculateTotal(): number {
    const subtotal = unitCost * quantity
    if (includeTax) {
      return subtotal + (subtotal * TAX_RATE)
    }
    return subtotal
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    
    if (!selectedCustomer) {
      setError('Please select a customer')
      return
    }

    // Validate "Other" fields
    if (garmentType === 'Other' && !otherGarment.trim()) {
      setError('Please specify the garment type')
      return
    }
    if (serviceType === 'Other' && !otherService.trim()) {
      setError('Please specify the service type')
      return
    }
    if (isRushOrder === null) {
      setError('Please select if this is a rush order')
      return
    }
    if (isPaidToday === null) {
      setError('Please select if customer is paying today')
      return
    }

    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    
    // Use the specified "Other" value or the selected value
    const finalGarmentType = garmentType === 'Other' ? otherGarment.trim() : garmentType
    const finalServiceType = serviceType === 'Other' ? otherService.trim() : serviceType
    
    const data = {
      customer_id: selectedCustomer.customer_id,
      garment_type: finalGarmentType,
      service_type: finalServiceType,
      order_details: formData.get('order_details') as string,
      quantity: quantity,
      unit_cost: unitCost,
      tax_applied: includeTax ? 'Yes' : 'No',
      expected_date: formData.get('expected_date') as string,
      payment_date: '',
      internal_notes: formData.get('internal_notes') as string || '',
      rush_order: isRushOrder,
      paid: isPaidToday,
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
        <Link href="/orders" className="text-sm text-charcoal hover:text-rust transition-colors">
          ← Back to Orders
        </Link>
        <h1 className="font-display text-3xl mt-4 mb-2">New Order</h1>
        <p className="text-charcoal">Create a new alteration order</p>
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
              <div className="absolute z-10 w-full mt-1 bg-cardBg border border-taupe/30 rounded-sm shadow-lg">
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
                    <div className="text-sm text-charcoal">
                      {customer.phone}
                      {customer.email && <span> • {customer.email}</span>}
                    </div>
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
          <p className="text-sm text-charcoal mt-2">
            Can't find customer?{' '}
            <Link href="/customers/new" className="text-rust hover:underline">
              Add new customer
            </Link>
          </p>
        </div>

        {/* Rush Order */}
        <div>
          <label className="block text-sm font-medium mb-2">Is this a rush order? *</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setIsRushOrder(true)}
              className={`flex-1 py-3 px-4 rounded-sm text-sm font-medium transition-colors ${
                isRushOrder === true
                  ? 'bg-rust text-white'
                  : 'border border-taupe/30 text-charcoal hover:border-charcoal'
              }`}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => setIsRushOrder(false)}
              className={`flex-1 py-3 px-4 rounded-sm text-sm font-medium transition-colors ${
                isRushOrder === false
                  ? 'bg-sage text-white'
                  : 'border border-taupe/30 text-charcoal hover:border-charcoal'
              }`}
            >
              No
            </button>
          </div>
        </div>

        {/* Garment & Service */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Garment Type</label>
            <select 
              name="garment_type" 
              className="input-field" 
              required
              value={garmentType}
              onChange={(e) => setGarmentType(e.target.value)}
            >
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
            <select 
              name="service_type" 
              className="input-field" 
              required
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
            >
              <option value="">Select service...</option>
              <option value="Hem">Hem</option>
              <option value="Taper">Taper</option>
              <option value="Take In">Take In</option>
              <option value="Let Out">Let Out</option>
              <option value="Shorten">Shorten</option>
              <option value="Lengthen">Lengthen</option>
              <option value="Repair">Repair</option>
              <option value="Custom">Custom</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Other Garment Specification */}
        {garmentType === 'Other' && (
          <div>
            <label className="block text-sm font-medium mb-2">Specify Garment Type</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g., Curtains, Blanket, etc."
              value={otherGarment}
              onChange={(e) => setOtherGarment(e.target.value)}
              required
            />
          </div>
        )}

        {/* Other Service Specification */}
        {serviceType === 'Other' && (
          <div>
            <label className="block text-sm font-medium mb-2">Specify Service Type</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g., Patch, Zipper replacement, etc."
              value={otherService}
              onChange={(e) => setOtherService(e.target.value)}
              required
            />
          </div>
        )}

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

        {/* Quantity & Unit Cost */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Quantity</label>
            <input
              type="number"
              name="quantity"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Unit Cost ($)</label>
            <input
              type="number"
              name="unit_cost"
              min="0"
              step="0.01"
              value={unitCost || ''}
              onChange={(e) => setUnitCost(parseFloat(e.target.value) || 0)}
              className="input-field"
              placeholder="0.00"
              required
            />
          </div>
        </div>

        {/* Tax Checkbox & Total */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeTax}
              onChange={(e) => setIncludeTax(e.target.checked)}
              className="w-4 h-4 rounded border-taupe/30 text-rust focus:ring-rust"
            />
            <span className="text-sm">Add tax (8.25%)</span>
          </label>
          
          {/* Total Display */}
          <div className="bg-cream/50 border border-taupe/20 rounded-sm p-4">
            <div className="flex justify-between text-sm text-charcoal">
              <span>Subtotal ({quantity} × ${unitCost.toFixed(2)})</span>
              <span>${(unitCost * quantity).toFixed(2)}</span>
            </div>
            {includeTax && (
              <div className="flex justify-between text-sm text-charcoal mt-1">
                <span>Tax (8.25%)</span>
                <span>${(unitCost * quantity * TAX_RATE).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-medium mt-2 pt-2 border-t border-taupe/20">
              <span>Total</span>
              <span>${calculateTotal().toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Expected Date */}
        <div>
          <label className="block text-sm font-medium mb-2">Expected Ready Date</label>
          <input
            type="date"
            name="expected_date"
            className="input-field"
            required
          />
        </div>

        {/* Internal Notes */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Internal Notes <span className="text-charcoal font-normal">(optional)</span>
          </label>
          <textarea
            name="internal_notes"
            rows={2}
            className="input-field resize-none"
            placeholder="Notes for staff only..."
          />
        </div>

        {/* Paying Today */}
        <div>
          <label className="block text-sm font-medium mb-2">Paying today? *</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setIsPaidToday(true)}
              className={`flex-1 py-3 px-4 rounded-sm text-sm font-medium transition-colors ${
                isPaidToday === true
                  ? 'bg-sage text-white'
                  : 'border border-taupe/30 text-charcoal hover:border-charcoal'
              }`}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => setIsPaidToday(false)}
              className={`flex-1 py-3 px-4 rounded-sm text-sm font-medium transition-colors ${
                isPaidToday === false
                  ? 'bg-gold text-cardBg'
                  : 'border border-taupe/30 text-charcoal hover:border-charcoal'
              }`}
            >
              No
            </button>
          </div>
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
