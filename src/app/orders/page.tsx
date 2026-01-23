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

const STATUS_OPTIONS = ['Received', 'Ready', 'Picked Up']

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

  // Warning modal state (for Received -> Picked Up)
  const [showWarningModal, setShowWarningModal] = useState(false)

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    garment_type: '',
    service_type: '',
    order_details: '',
    quantity: 1,
    cost: 0,
    expected_date: '',
    internal_notes: '',
  })

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
      // Reverse the order so most recent is first
      const reversedOrders = [...ordersData].reverse()
      setOrders(reversedOrders)
      setFilteredOrders(reversedOrders)
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
    const currentOrder = orders.find(o => o.order_id === orderId)
    
    // Check if trying to go from Received directly to Picked Up
    if (currentOrder?.status === 'Received' && newStatus === 'Picked Up') {
      setShowWarningModal(true)
      return
    }
    
    if (newStatus === 'Ready') {
      setPendingStatusChange({ orderId, newStatus, customerName })
      setShowConfirmModal(true)
    } else {
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

  function openEditModal(order: Order) {
    setEditingOrder(order)
    setEditForm({
      garment_type: order.garment_type,
      service_type: order.service_type,
      order_details: order.order_details,
      quantity: order.quantity,
      cost: order.cost,
      expected_date: order.expected_date,
      internal_notes: order.internal_notes,
    })
    setShowEditModal(true)
  }

  function closeEditModal() {
    setShowEditModal(false)
    setEditingOrder(null)
    setEditForm({
      garment_type: '',
      service_type: '',
      order_details: '',
      quantity: 1,
      cost: 0,
      expected_date: '',
      internal_notes: '',
    })
  }

  async function handleSaveOrder() {
    if (!editingOrder) return
    
    setSaving(true)
    try {
      const res = await fetch('/api/orders/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: editingOrder.order_id,
          ...editForm,
        }),
      })

      if (!res.ok) throw new Error('Failed to update')

      setOrders(orders.map(o => 
        o.order_id === editingOrder.order_id 
          ? { ...o, ...editForm }
          : o
      ))
      
      closeEditModal()
    } catch (err) {
      console.error('Failed to update order:', err)
      alert('Failed to update order')
    } finally {
      setSaving(false)
    }
  }

  function handleDeleteClick(orderId: string) {
    setOrderToDelete(orderId)
    setShowDeleteModal(true)
  }

  async function handleDeleteOrder() {
    if (!orderToDelete) return

    setDeleting(true)
    try {
      const res = await fetch('/api/orders/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderToDelete }),
      })

      if (!res.ok) throw new Error('Failed to delete')

      setOrders(orders.filter(o => o.order_id !== orderToDelete))
      setShowDeleteModal(false)
      setOrderToDelete(null)
    } catch (err) {
      console.error('Failed to delete order:', err)
      alert('Failed to delete order')
    } finally {
      setDeleting(false)
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
        return 'bg-gold/20 text-gold'
      case 'Ready':
        return 'bg-rust/20 text-rust'
      case 'Picked Up':
        return 'bg-sage/20 text-sage'
      default:
        return 'bg-taupe/20 text-taupe'
    }
  }

  function formatDate(dateStr: string) {
    if (!dateStr) return ''
    const [year, month, day] = dateStr.split('-')
    return `${month}-${day}-${year}`
  }

  const statuses = ['All', 'Received', 'Ready', 'Picked Up']

  return (
    <div className="space-y-6">
      {/* Warning Modal - Cannot skip Ready status */}
      {showWarningModal && (
        <div className="fixed inset-0 bg-charcoal/50 flex items-center justify-center z-50">
          <div className="bg-cardBg rounded-sm p-6 max-w-md mx-4 shadow-lg">
            <h3 className="font-display text-xl mb-4">Cannot Mark as Picked Up</h3>
            <p className="text-charcoal mb-6">
              This order cannot be picked up if it has not been marked ready yet. <strong>Please mark the order as <span className="font-bold text-rust">"Ready"</span> first.</strong>
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowWarningModal(false)}
                className="btn-primary"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && pendingStatusChange && (
        <div className="fixed inset-0 bg-charcoal/50 flex items-center justify-center z-50">
          <div className="bg-cardBg rounded-sm p-6 max-w-md mx-4 shadow-lg">
            <h3 className="font-display text-xl mb-4">Confirm Order Ready</h3>
            <p className="text-charcoal mb-6">
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
                className="bg-cardBg text-rust border border-rust px-6 py-3 rounded-sm font-medium hover:bg-rust hover:border-rust hover:text-soulsonic transition-colors duration-200"
              >
                Yes, Mark Ready
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && orderToDelete && (
        <div className="fixed inset-0 bg-charcoal/50 flex items-center justify-center z-50">
          <div className="bg-cardBg rounded-sm p-6 max-w-md mx-4 shadow-lg">
            <h3 className="font-display text-xl mb-4">Delete Order</h3>
            <p className="text-charcoal mb-6">
              Are you sure you want to delete this order? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setOrderToDelete(null)
                }}
                className="btn-secondary"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteOrder}
                className="bg-rust text-white px-6 py-3 rounded-sm font-medium hover:bg-rust/80 transition-colors duration-200 disabled:opacity-50"
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      {showEditModal && editingOrder && (
        <div className="fixed inset-0 bg-charcoal/50 flex items-center justify-center z-50">
          <div className="bg-cardBg rounded-sm p-6 max-w-lg w-full mx-4 shadow-lg max-h-[90vh] overflow-y-auto">
            <h3 className="font-display text-xl mb-4">Edit Order</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Garment Type</label>
                  <select
                    value={editForm.garment_type}
                    onChange={(e) => setEditForm({ ...editForm, garment_type: e.target.value })}
                    className="input-field"
                  >
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
                    value={editForm.service_type}
                    onChange={(e) => setEditForm({ ...editForm, service_type: e.target.value })}
                    className="input-field"
                  >
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

              <div>
                <label className="block text-sm font-medium mb-2">Order Details</label>
                <textarea
                  value={editForm.order_details}
                  onChange={(e) => setEditForm({ ...editForm, order_details: e.target.value })}
                  rows={3}
                  className="input-field resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Quantity</label>
                  <input
                    type="number"
                    value={editForm.quantity}
                    onChange={(e) => setEditForm({ ...editForm, quantity: parseInt(e.target.value) || 1 })}
                    min="1"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Cost ($)</label>
                  <input
                    type="number"
                    value={editForm.cost}
                    onChange={(e) => setEditForm({ ...editForm, cost: parseFloat(e.target.value) || 0 })}
                    min="0"
                    step="0.01"
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Expected Date</label>
                <input
                  type="date"
                  value={editForm.expected_date}
                  onChange={(e) => setEditForm({ ...editForm, expected_date: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Internal Notes</label>
                <textarea
                  value={editForm.internal_notes}
                  onChange={(e) => setEditForm({ ...editForm, internal_notes: e.target.value })}
                  rows={2}
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
                onClick={handleSaveOrder}
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
          <h1 className="font-display text-3xl mb-2">Orders</h1>
          <p className="text-charcoal">Track and manage alteration orders</p>
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
                ? 'bg-charcoal text-soulsonic'
                : status === 'Ready'
                ? 'border border-charcoal/50 text-charcoal hover:bg-charcoal hover:text-charcoal'
                : 'border border-charcoal/50 text-charcoal hover:border-charcoal hover:text-charcoal'
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
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal"
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
          <p className="text-charcoal text-center py-12">Loading orders...</p>
        </div>
      ) : error ? (
        <div className="card">
          <p className="text-rust text-center py-12">{error}</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="card">
          <p className="text-charcoal text-center py-12">
            {searchQuery || statusFilter !== 'All'
              ? 'No orders found matching your filters'
              : 'No orders yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <div key={order.order_id} className="card hover:border-offwhite/30 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-medium">{getCustomerName(order.customer_id)}</h3>
                  </div>
                  <p className="text-sm text-charcoal">{getCustomerPhone(order.customer_id)}</p>
                  <p className="text-sm text-charcoal mt-1">
                    {order.garment_type} • {order.service_type}
                  </p>
                  <p className="text-sm text-charcoal mt-1">{order.order_details}</p>
                </div>
                <div className="text-right ml-4">
                  <p className="font-medium">${order.cost}</p>
                  <p className="text-xs text-charcoal mt-1">Order {order.order_id}</p>
                  <p className="text-xs text-charcoal">Received: {formatDate(order.order_date)}</p>
                  <p className="text-xs text-charcoal">Due: {formatDate(order.expected_date)}</p>
                  
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
                
                {/* Edit and Delete Icons - Vertical on the right */}
                <div className="flex flex-col gap-1 ml-4 mt-4">
                  <button
                    onClick={() => openEditModal(order)}
                    className="p-2 text-charcoal hover:text-gold transition-colors"
                    title="Edit order"
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
                  <button
                    onClick={() => handleDeleteClick(order.order_id)}
                    className="p-2 text-charcoal hover:text-rust transition-colors"
                    title="Delete order"
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
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
