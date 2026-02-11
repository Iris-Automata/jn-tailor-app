'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'

interface Customer {
  customer_id: string
  first_name: string
  last_name: string
  phone: string
  email: string
  created_date: string
  notes: string
  notification_preference: string
}

interface Order {
  order_id: string
  customer_id: string
  order_date: string
  garment_type: string
  service_type: string
  quantity: number
  unit_cost: number
  tax_applied: string
  status: string
  payment_date: string
}

interface Section {
  letter: string
  customers: Customer[]
}

const TAX_RATE = 0.0825
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#'.split('')

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeLetters, setActiveLetters] = useState<Set<string>>(new Set())
  
  // Selected customer for detail panel
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  
  // Section refs for scrolling
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  
  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    notes: '',
    notification_preference: '',
  })

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    let filtered = customers
    
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase()
      filtered = customers.filter(
        (c) =>
          c.first_name.toLowerCase().includes(query) ||
          c.last_name.toLowerCase().includes(query) ||
          c.phone.includes(searchQuery) ||
          (c.email && c.email.toLowerCase().includes(query))
      )
    }
    
    setFilteredCustomers(filtered)
    
    // Update active letters
    const letters = new Set<string>()
    filtered.forEach(c => {
      const firstLetter = c.last_name.charAt(0).toUpperCase()
      if (/[A-Z]/.test(firstLetter)) {
        letters.add(firstLetter)
      } else {
        letters.add('#')
      }
    })
    setActiveLetters(letters)
  }, [searchQuery, customers])

  async function fetchData() {
    try {
      const [customersRes, ordersRes] = await Promise.all([
        fetch('/api/customers'),
        fetch('/api/orders'),
      ])
      if (!customersRes.ok) throw new Error('Failed to fetch')
      
      const customersData = await customersRes.json()
      const ordersData = await ordersRes.json()
      
      // Sort customers by last name
      const sortedCustomers = [...customersData].sort((a, b) => 
        a.last_name.localeCompare(b.last_name)
      )
      
      setCustomers(sortedCustomers)
      setFilteredCustomers(sortedCustomers)
      setOrders(ordersData)
      
      // Build active letters set
      const letters = new Set<string>()
      sortedCustomers.forEach(c => {
        const firstLetter = c.last_name.charAt(0).toUpperCase()
        if (/[A-Z]/.test(firstLetter)) {
          letters.add(firstLetter)
        } else {
          letters.add('#')
        }
      })
      setActiveLetters(letters)
    } catch (err) {
      setError('Failed to load customers')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Group customers by first letter of last name
  function getSections(): Section[] {
    const grouped: { [key: string]: Customer[] } = {}
    
    filteredCustomers.forEach(customer => {
      const firstLetter = customer.last_name.charAt(0).toUpperCase()
      const key = /[A-Z]/.test(firstLetter) ? firstLetter : '#'
      
      if (!grouped[key]) {
        grouped[key] = []
      }
      grouped[key].push(customer)
    })
    
    return Object.keys(grouped)
      .sort((a, b) => {
        if (a === '#') return 1
        if (b === '#') return -1
        return a.localeCompare(b)
      })
      .map(key => ({
        letter: key,
        customers: grouped[key].sort((a, b) => {
          const lastNameCompare = a.last_name.localeCompare(b.last_name)
          if (lastNameCompare !== 0) return lastNameCompare
          return a.first_name.localeCompare(b.first_name)
        }),
      }))
  }

  function scrollToSection(letter: string) {
    const ref = sectionRefs.current[letter]
    if (ref) {
      ref.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  function getCustomerOrders(customerId: string): Order[] {
    return orders.filter(o => o.customer_id === customerId)
  }

  function calculateOrderTotal(order: Order): number {
    const subtotal = order.unit_cost * order.quantity
    return order.tax_applied === 'Yes' ? subtotal + (subtotal * TAX_RATE) : subtotal
  }

  function openEditModal(customer: Customer) {
    setEditingCustomer(customer)
    setEditForm({
      first_name: customer.first_name,
      last_name: customer.last_name,
      phone: customer.phone,
      email: customer.email || '',
      notes: customer.notes || '',
      notification_preference: customer.notification_preference || 'SMS',
    })
    setShowEditModal(true)
  }

  function closeEditModal() {
    setShowEditModal(false)
    setEditingCustomer(null)
  }

  async function handleSaveCustomer() {
    if (!editingCustomer) return
    
    setSaving(true)
    try {
      const res = await fetch('/api/customers/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: editingCustomer.customer_id,
          ...editForm,
        }),
      })

      if (!res.ok) throw new Error('Failed to update')

      const updatedCustomer = { ...editingCustomer, ...editForm }
      
      setCustomers(customers.map(c => 
        c.customer_id === editingCustomer.customer_id ? updatedCustomer : c
      ))
      
      if (selectedCustomer?.customer_id === editingCustomer.customer_id) {
        setSelectedCustomer(updatedCustomer)
      }
      
      closeEditModal()
    } catch (err) {
      console.error('Failed to update customer:', err)
      alert('Failed to update customer')
    } finally {
      setSaving(false)
    }
  }

  function handleDeleteClick(customer: Customer) {
    setCustomerToDelete(customer)
    setShowDeleteModal(true)
  }

  async function handleDeleteCustomer() {
    if (!customerToDelete) return

    setDeleting(true)
    try {
      // Note: You'll need to create this API endpoint
      const res = await fetch('/api/customers/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_id: customerToDelete.customer_id }),
      })

      if (!res.ok) throw new Error('Failed to delete')

      setCustomers(customers.filter(c => c.customer_id !== customerToDelete.customer_id))
      
      if (selectedCustomer?.customer_id === customerToDelete.customer_id) {
        setSelectedCustomer(null)
      }
      
      setShowDeleteModal(false)
      setCustomerToDelete(null)
    } catch (err) {
      console.error('Failed to delete customer:', err)
      alert('Failed to delete customer')
    } finally {
      setDeleting(false)
    }
  }

  function getNotificationBadge(pref: string) {
    switch (pref) {
      case 'SMS':
        return <span className="text-xs bg-sage/20 text-sage px-2 py-0.5 rounded">SMS</span>
      case 'Email':
        return <span className="text-xs bg-gold/20 text-gold px-2 py-0.5 rounded">Email</span>
      case 'Both':
        return <span className="text-xs bg-rust/20 text-rust px-2 py-0.5 rounded">SMS + Email</span>
      case 'None':
        return <span className="text-xs bg-taupe/20 text-taupe px-2 py-0.5 rounded">None</span>
      default:
        return null
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'Received': return 'bg-gold/20 text-gold'
      case 'Ready': return 'bg-rust/20 text-rust'
      case 'Picked Up': return 'bg-sage/20 text-sage'
      default: return 'bg-taupe/20 text-taupe'
    }
  }

  function formatDate(dateStr: string) {
    if (!dateStr) return '—'
    const [year, month, day] = dateStr.split('-')
    return `${month}/${day}/${year}`
  }

  const sections = getSections()

  return (
    <div className="flex gap-6 h-[calc(100vh-120px)]">
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl text-offwhite mb-1">Customers</h1>
            <p className="text-charcoal">{customers.length} total customers</p>
          </div>
          <Link href="/customers/new" className="btn-primary">
            + New Customer
          </Link>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
            className="input-field pl-10 py-2"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Customer List with A-Z sections */}
        <div className="flex-1 overflow-hidden rounded-sm border border-taupe/20 relative">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-charcoal">Loading customers...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-rust">{error}</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-charcoal">
                {searchQuery ? 'No customers found matching your search' : 'No customers yet'}
              </p>
            </div>
          ) : (
            <div className="h-full overflow-auto pr-8">
              {sections.map(section => (
                <div 
                  key={section.letter} 
                  ref={el => { sectionRefs.current[section.letter] = el }}
                >
                  {/* Section Header */}
                  <div className="sticky top-0 bg-cardBg border-b border-taupe/20 px-4 py-2 z-10">
                    <span className="font-display text-lg text-sage">{section.letter}</span>
                  </div>
                  
                  {/* Customers in this section */}
                  <div className="divide-y divide-taupe/10">
                    {section.customers.map(customer => (
                      <div
                        key={customer.customer_id}
                        className={`px-4 py-3 hover:bg-cardBg/50 transition-colors cursor-pointer ${
                          selectedCustomer?.customer_id === customer.customer_id ? 'bg-cardBg' : ''
                        }`}
                        onClick={() => setSelectedCustomer(customer)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-offwhite">
                                {customer.last_name}, {customer.first_name}
                              </span>
                              {getNotificationBadge(customer.notification_preference)}
                            </div>
                            <p className="text-sm text-charcoal">{customer.phone}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-charcoal">
                              {getCustomerOrders(customer.customer_id).length} orders
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Alphabet Sidebar */}
          {!searchQuery && filteredCustomers.length > 0 && (
            <div className="absolute right-1 top-0 bottom-0 flex flex-col justify-center py-2">
              {ALPHABET.map(letter => {
                const isActive = activeLetters.has(letter)
                return (
                  <button
                    key={letter}
                    onClick={() => isActive && scrollToSection(letter)}
                    disabled={!isActive}
                    className={`px-1 py-0.5 text-xs font-medium transition-colors ${
                      isActive 
                        ? 'text-sage hover:text-offwhite cursor-pointer' 
                        : 'text-taupe/30 cursor-default'
                    }`}
                  >
                    {letter}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Detail Panel */}
      <div className="w-96 flex-shrink-0">
        {selectedCustomer ? (
          <div className="bg-cardBg rounded-sm border border-taupe/20 h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-taupe/20">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-display text-lg text-offwhite">
                  {selectedCustomer.first_name} {selectedCustomer.last_name}
                </h2>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="p-1 text-charcoal hover:text-offwhite transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {getNotificationBadge(selectedCustomer.notification_preference)}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4 space-y-6">
              {/* Contact Info */}
              <div>
                <h3 className="text-xs font-medium text-charcoal uppercase tracking-wide mb-2">Contact</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-charcoal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="text-offwhite">{selectedCustomer.phone}</span>
                  </div>
                  {selectedCustomer.email && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-charcoal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="text-offwhite">{selectedCustomer.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Since */}
              <div>
                <h3 className="text-xs font-medium text-charcoal uppercase tracking-wide mb-2">Customer Since</h3>
                <p className="text-offwhite">{formatDate(selectedCustomer.created_date)}</p>
              </div>

              {/* Notes */}
              {selectedCustomer.notes && (
                <div>
                  <h3 className="text-xs font-medium text-charcoal uppercase tracking-wide mb-2">Notes</h3>
                  <p className="text-charcoal text-sm bg-soulsonic/50 p-3 rounded">{selectedCustomer.notes}</p>
                </div>
              )}

              {/* Order History */}
              <div>
                <h3 className="text-xs font-medium text-charcoal uppercase tracking-wide mb-2">
                  Order History ({getCustomerOrders(selectedCustomer.customer_id).length})
                </h3>
                {getCustomerOrders(selectedCustomer.customer_id).length === 0 ? (
                  <p className="text-charcoal text-sm">No orders yet</p>
                ) : (
                  <div className="space-y-2">
                    {getCustomerOrders(selectedCustomer.customer_id)
                      .sort((a, b) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime())
                      .map(order => (
                        <div key={order.order_id} className="bg-soulsonic/50 rounded p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-offwhite">#{order.order_id}</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </div>
                          <p className="text-sm text-charcoal">{order.garment_type} • {order.service_type}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-charcoal">{formatDate(order.order_date)}</span>
                            <span className="text-sm text-offwhite">${calculateOrderTotal(order).toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Stats */}
              <div>
                <h3 className="text-xs font-medium text-charcoal uppercase tracking-wide mb-2">Stats</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-soulsonic/50 rounded p-3 text-center">
                    <p className="text-2xl font-display text-offwhite">
                      {getCustomerOrders(selectedCustomer.customer_id).length}
                    </p>
                    <p className="text-xs text-charcoal">Total Orders</p>
                  </div>
                  <div className="bg-soulsonic/50 rounded p-3 text-center">
                    <p className="text-2xl font-display text-offwhite">
                      ${getCustomerOrders(selectedCustomer.customer_id)
                        .reduce((sum, o) => sum + calculateOrderTotal(o), 0)
                        .toFixed(2)}
                    </p>
                    <p className="text-xs text-charcoal">Total Spent</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-taupe/20 flex gap-2">
              <Link
                href={`/orders/new?customer=${selectedCustomer.customer_id}`}
                className="flex-1 btn-primary text-sm py-2 text-center"
              >
                New Order
              </Link>
              <button
                onClick={() => openEditModal(selectedCustomer)}
                className="flex-1 btn-secondary text-sm py-2"
              >
                Edit
              </button>
              <button
                onClick={() => handleDeleteClick(selectedCustomer)}
                className="px-4 py-2 text-red border border-red/30 rounded-sm hover:bg-red/10 transition-colors text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-cardBg rounded-sm border border-taupe/20 h-full flex items-center justify-center">
            <div className="text-center text-charcoal">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <p>Select a customer to view details</p>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && editingCustomer && (
        <div className="fixed inset-0 bg-soulsonic/80 flex items-center justify-center z-50">
          <div className="bg-cardBg rounded-sm p-6 max-w-lg w-full mx-4 shadow-lg max-h-[90vh] overflow-y-auto border border-taupe/20">
            <h3 className="font-display text-xl text-offwhite mb-4">Edit Customer</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">First Name</label>
                  <input
                    type="text"
                    value={editForm.first_name}
                    onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Last Name</label>
                  <input
                    type="text"
                    value={editForm.last_name}
                    onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="input-field"
                  placeholder="Optional"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Notification Preference</label>
                <select
                  value={editForm.notification_preference}
                  onChange={(e) => setEditForm({ ...editForm, notification_preference: e.target.value })}
                  className="input-field"
                >
                  <option value="SMS">SMS (Text Message)</option>
                  <option value="Email">Email</option>
                  <option value="Both">Both SMS and Email</option>
                  <option value="None">No Notifications</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Notes</label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  rows={3}
                  className="input-field resize-none"
                  placeholder="Optional notes about this customer..."
                />
              </div>
            </div>
            
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={closeEditModal} className="btn-secondary" disabled={saving}>
                Cancel
              </button>
              <button
                onClick={handleSaveCustomer}
                className="btn-primary disabled:opacity-50"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && customerToDelete && (
        <div className="fixed inset-0 bg-soulsonic/80 flex items-center justify-center z-50">
          <div className="bg-cardBg rounded-sm p-6 max-w-md mx-4 shadow-lg border border-taupe/20">
            <h3 className="font-display text-xl text-offwhite mb-4">Delete Customer</h3>
            <p className="text-charcoal mb-6">
              Are you sure you want to delete <strong className="text-offwhite">{customerToDelete.first_name} {customerToDelete.last_name}</strong>? 
              This will also delete all their orders. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setCustomerToDelete(null)
                }}
                className="btn-secondary"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCustomer}
                className="bg-red text-offwhite px-6 py-3 rounded-sm font-medium hover:bg-red/80 transition-colors disabled:opacity-50"
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
