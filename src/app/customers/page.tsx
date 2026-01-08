'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

interface Customer {
  customer_id: string
  first_name: string
  last_name: string
  phone: string
  email: string
  created_date: string
  notes: string
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
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
  })

  useEffect(() => {
    fetchCustomers()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCustomers(customers)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredCustomers(
        customers.filter(
          (c) =>
            c.first_name.toLowerCase().includes(query) ||
            c.last_name.toLowerCase().includes(query) ||
            c.phone.includes(searchQuery)
        )
      )
    }
  }, [searchQuery, customers])

  async function fetchCustomers() {
    try {
      const res = await fetch('/api/customers')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setCustomers(data)
      setFilteredCustomers(data)
    } catch (err) {
      setError('Failed to load customers')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function openEditModal(customer: Customer) {
    setEditingCustomer(customer)
    setEditForm({
      first_name: customer.first_name,
      last_name: customer.last_name,
      phone: customer.phone,
      email: customer.email,
      notes: customer.notes,
    })
    setShowEditModal(true)
  }

  function closeEditModal() {
    setShowEditModal(false)
    setEditingCustomer(null)
    setEditForm({
      first_name: '',
      last_name: '',
      phone: '',
      email: '',
      notes: '',
    })
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

      // Update local state
      setCustomers(customers.map(c => 
        c.customer_id === editingCustomer.customer_id 
          ? { ...c, ...editForm }
          : c
      ))
      
      closeEditModal()
    } catch (err) {
      console.error('Failed to update customer:', err)
      alert('Failed to update customer')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Edit Modal */}
      {showEditModal && editingCustomer && (
        <div className="fixed inset-0 bg-charcoal/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-sm p-6 max-w-lg w-full mx-4 shadow-lg">
            <h3 className="font-display text-xl mb-4">Edit Customer</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">First Name</label>
                  <input
                    type="text"
                    value={editForm.first_name}
                    onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Last Name</label>
                  <input
                    type="text"
                    value={editForm.last_name}
                    onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Notes</label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  rows={3}
                  className="input-field resize-none"
                />
              </div>
            </div>
            
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={closeEditModal}
                className="btn-secondary"
                disabled={saving}
              >
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

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl mb-2">Customers</h1>
          <p className="text-taupe">Search and manage your customer records</p>
        </div>
        <Link href="/customers/new" className="btn-primary">
          + New Customer
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search by name or phone number..."
          className="input-field pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-taupe"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Customer List */}
      {loading ? (
        <div className="card">
          <p className="text-taupe text-center py-12">Loading customers...</p>
        </div>
      ) : error ? (
        <div className="card">
          <p className="text-rust text-center py-12">{error}</p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="card">
          <p className="text-taupe text-center py-12">
            {searchQuery ? 'No customers found matching your search' : 'No customers yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCustomers.map((customer) => (
            <div key={customer.customer_id} className="card hover:border-rust/30 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-lg">
                    {customer.first_name} {customer.last_name}
                  </h3>
                  <p className="text-taupe text-sm">{customer.phone}</p>
                  {customer.email && (
                    <p className="text-taupe text-sm">{customer.email}</p>
                  )}
                </div>
                <div className="text-right flex items-center gap-4">
                  <div>
                    <p className="text-xs text-taupe">Customer since</p>
                    <p className="text-sm">{customer.created_date}</p>
                  </div>
                  <button
                    onClick={() => openEditModal(customer)}
                    className="p-2 text-taupe hover:text-rust transition-colors"
                    title="Edit customer"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              {customer.notes && (
                <p className="text-sm text-taupe mt-2 pt-2 border-t border-taupe/10">
                  {customer.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
