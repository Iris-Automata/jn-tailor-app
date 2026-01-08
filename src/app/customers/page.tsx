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

  return (
    <div className="space-y-6">
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
                <div className="text-right">
                  <p className="text-xs text-taupe">Customer since</p>
                  <p className="text-sm">{customer.created_date}</p>
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
