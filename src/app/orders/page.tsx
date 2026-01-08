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
  status: string
  expected_date: string
  payment_date: string
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

const STATUS_OPTIONS = ['Received', 'In Progress', 'Ready', 'Picked Up']

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null)
  
  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [pendingStatusChange, setPendingStatusChange] = useState<{orderId: string, newStatus: string, customerName: string} | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    let filtered = orders

    if (statusFilter !== 'All') {
      filtered = filtered.filter((o) => o.status === statusFilter)
    }

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

  function handleStatusChange(orderId: string, newStatus: string, customerId: string) {
    const customerName = getCustomerName(customerId)
    
    // If changing to "Ready", show confirmation modal
    if (newStatus === 'Ready') {
      setPendingStatusChange({ orderId, newStatus, customerName })
      setShowConfirmModal(true)
    } else {
      // For other status changes, just update directly
      updateStatus(orderId, newStatus)
    }
  }

  async function updateStatus(orderId: string, newStatus: string) {
    setUpdatingOrder(orderId)
    setShowConfirmModal(false)
    setPendingStatusChange(null)
    
    try {
      const res = await fetch('/api/orders/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, status: newStatus }),
      })

      if (!res.ok) throw new Error('Failed to update')

      setOrders(orders.map(o => 
        o.order_id === orderId ? { ...o, status: newStatus } : o
      ))
    } catch (err) {
      console.error('Failed to update status:', err)
      alert('Failed to update order status')
    } finally {
      setUpdatingOrder(null)
    }
  }

  function getCustomerName(customerId: string) {
    const customer = customers.find((c) => c.customer_id === customerId)
    return customer ? `${customer.first_name} ${customer.last_name}` : 'Unknown'
  }

  function getCustomerPhone(customerId: string) {
    const customer = customers.find((c) => c.customer_id === customerId)
    return customer ? customer.phone : ''
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
      {/* Confirmation Modal */}
      {showConfirmModal && pendingStatusChange && (
        <div className="fixed inset-0 bg-charcoal/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-sm p-6 max-w-md mx-4 shadow-lg">
            <h3 className="font-display text-xl mb-4">Confirm Order Ready</h3>
            <p className="text-taupe mb-6">
              Are you sure this order is complete? <strong>{pendingStatusChange.customerName}</strong> will be notified their order is ready for pickup.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowConfirmModal(false)
                  setPendingStatusChange(null)
                }}
                className="btn-secondary"
              >
                No, Cancel
              </button>
              <button
                onClick={() => updateStatus(pendingStatusChange.orderId, pendingStatusChange.newStatus)}
                className="btn-primary"
              >
                Yes, Mark Ready
              </button>
            </div>
          </div>
        </div>
      )}

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
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-medium">{getCustomerName(order.customer_id)}</h3>
                  </div>
                  <p className="text-sm text-taupe">{getCustomerPhone(order.customer_id)}</p>
                  <p className="text-sm text-taupe mt-1">
                    {order.garment_type} • {order.service_type}
                  </p>
                  <p className="text-sm text-taupe mt-1">{order.order_details}</p>
                </div>
                <div className="text-right ml-4">
                  <p className="font-medium">${order.cost}</p>
                  <p className="text-xs text-taupe mt-1">Order {order.order_id}</p>
                  <p className="text-xs text-taupe">Due: {order.expected_date}</p>
                  
                  {/* Status Dropdown */}
                  <div className="mt-3">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.order_id, e.target.value, order.customer_id)}
                      disabled={updatingOrder === order.order_id}
                      className={`px-3 py-1.5 text-xs font-medium rounded-sm border-0 cursor-pointer ${getStatusColor(order.status)} ${
                        updatingOrder === order.order_id ? 'opacity-50' : ''
                      }`}
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
