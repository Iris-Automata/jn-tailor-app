'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

interface Order {
  order_id: string
  customer_id: string
  order_date: string
  garment_type: string
  service_type: string
  order_details: string
  quantity: number
  cost: number
  expected_date: string
  payment_date: string
  status: string
  completed_date: string
  picked_up_date: string
  notification_sent: string
  reminder_sent: string
  internal_notes: string
}

interface Customer {
  customer_id: string
  first_name: string
  last_name: string
  phone: string
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    let filtered = orders

    // Filter by status
    if (statusFilter !== 'All') {
      filtered = filtered.filter((o) => o.status === statusFilter)
    }

    // Filter by search
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((o) => {
        const customer = customers.find((c) => c.customer_id === o.customer_id)
        const customerName = customer
          ? `${customer.first_name} ${customer.last_name}`.toLowerCase()
          : ''
        return (
          o.order_id.toLowerCase().includes(query) ||
          customerName.includes(query)
        )
      })
    }

    setFilteredOrders(filtered)
  }, [searchQuery, statusFilter, orders, customers])

  async function fetchData() {
    try {
      const [ordersRes, customersRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/customers'),
      ])
      if (!ordersRes.ok || !customersRes.ok) throw new Error('Failed to fetch')
      const ordersData = await ordersRes.json()
      const customersData = await customersRes.json()
      setOrders(ordersData)
      setFilteredOrders(ordersData)
      setCustomers(customersData)
    } catch (err) {
      setError('Failed to load orders')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function getCustomerName(customerId: string) {
    const customer = customers.find((c) => c.customer_id === customerId)
    return customer ? `${customer.first_name} ${customer.last_name}` : 'Unknown'
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'Received':
        return 'bg-taupe/20 text-taupe'
      case 'In Progress':
        return 'bg-gold/20 text-gold'
      case 'Ready':
        return 'bg-rust/20 text-rust'
      case 'Picked Up':
        return 'bg-sage/20 text-sage'
      default:
        return 'bg-taupe/20 text-taupe'
    }
  }

  const statuses = ['All', 'Received', 'In Progress', 'Ready', 'Picked Up']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl mb-2">Orders</h1>
          <p className="text-taupe">Track and manage alteration orders</p>
        </div>
        <Link href="/orders/new" className="btn-primary">
          + New Order
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {statuses.map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-sm text-sm transition-colors ${
              statusFilter === status
                ? 'bg-charcoal text-cream'
                : status === 'Ready'
                ? 'border border-rust/50 text-rust hover:bg-rust hover:text-cream'
                : 'border border-taupe/30 text-taupe hover:border-charcoal hover:text-charcoal'
            }`}
          >
            {status === 'Ready' ? 'Ready for Pickup' : status}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search by customer name or order ID..."
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

      {/* Orders List */}
      {loading ? (
        <div className="card">
          <p className="text-taupe text-center py-12">Loading orders...</p>
        </div>
      ) : error ? (
        <div className="card">
          <p className="text-rust text-center py-12">{error}</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="card">
          <p className="text-taupe text-center py-12">
            {searchQuery || statusFilter !== 'All'
              ? 'No orders found matching your filters'
              : 'No orders yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <div key={order.order_id} className="card hover:border-rust/30 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-medium">{getCustomerName(order.customer_id)}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-sm text-taupe">
                    {order.garment_type} • {order.service_type}
                  </p>
                  <p className="text-sm text-taupe mt-1">{order.order_details}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">${order.cost}</p>
                  <p className="text-xs text-taupe mt-1">Order {order.order_id}</p>
                  <p className="text-xs text-taupe">Due: {order.expected_date}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
