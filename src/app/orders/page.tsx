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
  unit_cost: number
  tax_applied: string
  status: string
  expected_date: string
  payment_date: string
  completed_date: string
  picked_up_date: string
  notification_sent: string
  reminder_sent: string
  internal_notes: string
  rush_order: boolean
}

interface Customer {
  customer_id: string
  first_name: string
  last_name: string
  phone: string
  email: string
}

const STATUS_OPTIONS = ['Received', 'Ready', 'Picked Up']
const TAX_RATE = 0.0825
const GARMENT_OPTIONS = ['Pants', 'Jacket', 'Shirt', 'Dress', 'Skirt', 'Suit', 'Coat', 'Other']
const SERVICE_OPTIONS = ['Hem', 'Taper', 'Take In', 'Let Out', 'Shorten', 'Lengthen', 'Repair', 'Custom', 'Other']

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null)
  
  // Selected order for detail panel
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  
  // Sort state
  const [sortField, setSortField] = useState<'order_date' | 'customer' | 'status' | 'total'>('order_date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // Modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [pendingStatusChange, setPendingStatusChange] = useState<{orderId: string, newStatus: string, customerName: string} | null>(null)
  const [showWarningModal, setShowWarningModal] = useState(false)
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
    unit_cost: 0,
    tax_applied: false,
    expected_date: '',
    internal_notes: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    let filtered = orders

    if (statusFilter === 'Rush') {
      filtered = filtered.filter((o) => o.rush_order === true)
    } else if (statusFilter === 'Unpaid') {
      filtered = filtered.filter((o) => !o.payment_date)
    } else if (statusFilter !== 'All') {
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
          String(o.order_id).toLowerCase().includes(query) ||
          customerName.includes(query) ||
          o.garment_type.toLowerCase().includes(query) ||
          o.service_type.toLowerCase().includes(query)
        )
      })
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      let comparison = 0
      
      if (sortField === 'order_date') {
        comparison = new Date(a.order_date).getTime() - new Date(b.order_date).getTime()
      } else if (sortField === 'customer') {
        const nameA = getCustomerName(a.customer_id).toLowerCase()
        const nameB = getCustomerName(b.customer_id).toLowerCase()
        comparison = nameA.localeCompare(nameB)
      } else if (sortField === 'status') {
        const statusOrder = { 'Received': 0, 'Ready': 1, 'Picked Up': 2 }
        comparison = (statusOrder[a.status as keyof typeof statusOrder] || 0) - (statusOrder[b.status as keyof typeof statusOrder] || 0)
      } else if (sortField === 'total') {
        comparison = calculateOrderTotal(a) - calculateOrderTotal(b)
      }
      
      return sortDirection === 'asc' ? comparison : -comparison
    })

    setFilteredOrders(filtered)
  }, [searchQuery, statusFilter, orders, customers, sortField, sortDirection])

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

  function handleSort(field: typeof sortField) {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  function handleStatusChange(orderId: string, newStatus: string, customerId: string) {
    const customerName = getCustomerName(customerId)
    const currentOrder = orders.find(o => String(o.order_id) === String(orderId))
    
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
        String(o.order_id) === String(orderId) ? { ...o, status: newStatus } : o
      ))
      
      // Update selected order if it's the one being changed
      if (selectedOrder && String(selectedOrder.order_id) === String(orderId)) {
        setSelectedOrder({ ...selectedOrder, status: newStatus })
      }
    } catch (err) {
      console.error('Failed to update status:', err)
      alert('Failed to update order status')
    } finally {
      setUpdatingOrder(null)
    }
  }

  async function updatePaymentStatus(orderId: string, isPaid: boolean) {
    const paymentDate = isPaid ? new Date().toISOString().split('T')[0] : ''
    
    try {
      const res = await fetch('/api/orders/payment', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, payment_date: paymentDate }),
      })

      if (!res.ok) throw new Error('Failed to update')

      setOrders(orders.map(o => 
        String(o.order_id) === String(orderId) ? { ...o, payment_date: paymentDate } : o
      ))
      
      if (selectedOrder && String(selectedOrder.order_id) === String(orderId)) {
        setSelectedOrder({ ...selectedOrder, payment_date: paymentDate })
      }
    } catch (err) {
      console.error('Failed to update payment status:', err)
      alert('Failed to update payment status')
    }
  }

  function openEditModal(order: Order) {
    setEditingOrder(order)
    setEditForm({
      garment_type: order.garment_type,
      service_type: order.service_type,
      order_details: order.order_details || '',
      quantity: order.quantity,
      unit_cost: order.unit_cost,
      tax_applied: order.tax_applied === 'Yes',
      expected_date: order.expected_date || '',
      internal_notes: order.internal_notes || '',
    })
    setShowEditModal(true)
  }

  function closeEditModal() {
    setShowEditModal(false)
    setEditingOrder(null)
  }

  function calculateEditTotal(): number {
    const subtotal = editForm.unit_cost * editForm.quantity
    return editForm.tax_applied ? subtotal + (subtotal * TAX_RATE) : subtotal
  }

  function calculateOrderTotal(order: Order): number {
    const subtotal = order.unit_cost * order.quantity
    return order.tax_applied === 'Yes' ? subtotal + (subtotal * TAX_RATE) : subtotal
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
          garment_type: editForm.garment_type,
          service_type: editForm.service_type,
          order_details: editForm.order_details,
          quantity: editForm.quantity,
          unit_cost: editForm.unit_cost,
          tax_applied: editForm.tax_applied ? 'Yes' : 'No',
          expected_date: editForm.expected_date,
          internal_notes: editForm.internal_notes,
        }),
      })

      if (!res.ok) throw new Error('Failed to update')

      const updatedOrder = {
        ...editingOrder,
        garment_type: editForm.garment_type,
        service_type: editForm.service_type,
        order_details: editForm.order_details,
        quantity: editForm.quantity,
        unit_cost: editForm.unit_cost,
        tax_applied: editForm.tax_applied ? 'Yes' : 'No',
        expected_date: editForm.expected_date,
        internal_notes: editForm.internal_notes,
      }

      setOrders(orders.map(o => 
        String(o.order_id) === String(editingOrder.order_id) ? updatedOrder : o
      ))
      
      if (selectedOrder && String(selectedOrder.order_id) === String(editingOrder.order_id)) {
        setSelectedOrder(updatedOrder)
      }
      
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

      setOrders(orders.filter(o => String(o.order_id) !== String(orderToDelete)))
      
      if (selectedOrder && String(selectedOrder.order_id) === String(orderToDelete)) {
        setSelectedOrder(null)
      }
      
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

  function getCustomer(customerId: string) {
    return customers.find((c) => c.customer_id === customerId)
  }

  function formatDate(dateStr: string) {
    if (!dateStr) return '—'
    const [year, month, day] = dateStr.split('-')
    return `${month}/${day}/${year}`
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'Received': return 'bg-gold/20 text-gold'
      case 'Ready': return 'bg-rust/20 text-rust'
      case 'Picked Up': return 'bg-sage/20 text-sage'
      default: return 'bg-taupe/20 text-taupe'
    }
  }

  function getStatusBgColor(status: string) {
    switch (status) {
      case 'Received': return 'bg-gold text-soulsonic'
      case 'Ready': return 'bg-rust text-soulsonic'
      case 'Picked Up': return 'bg-sage text-soulsonic'
      default: return 'bg-taupe text-soulsonic'
    }
  }

  const statuses = ['All', 'Rush', 'Received', 'Ready', 'Picked Up', 'Unpaid']

  return (
    <div className="flex gap-6 h-[calc(100vh-120px)]">
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl text-offwhite mb-1">Orders</h1>
            <p className="text-charcoal">{filteredOrders.length} orders</p>
          </div>
          <Link href="/orders/new" className="btn-primary">
            + New Order
          </Link>
        </div>

        {/* Filters & Search */}
        <div className="flex gap-4 mb-4">
          <div className="flex gap-2 flex-wrap">
            {statuses.map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-sm text-sm transition-colors ${
                  statusFilter === status
                    ? 'bg-offwhite text-soulsonic'
                    : 'border border-taupe/30 text-charcoal hover:border-offwhite hover:text-offwhite'
                }`}
              >
                {status === 'Ready' ? 'Ready for Pickup' : status}
              </button>
            ))}
          </div>
          
          <div className="flex-1 max-w-md ml-auto relative">
            <input
              type="text"
              placeholder="Search orders..."
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
        </div>

        {/* Orders Table */}
        <div className="flex-1 overflow-hidden rounded-sm border border-taupe/20">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-charcoal">Loading orders...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-rust">{error}</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-charcoal">
                {searchQuery || statusFilter !== 'All' ? 'No orders found matching your filters' : 'No orders yet'}
              </p>
            </div>
          ) : (
            <div className="h-full overflow-auto">
              <table className="w-full">
                <thead className="bg-cardBg sticky top-0 z-10">
                  <tr className="text-left text-sm text-charcoal border-b border-taupe/20">
                    <th 
                      className="px-4 py-3 font-medium cursor-pointer hover:text-offwhite transition-colors"
                      onClick={() => handleSort('customer')}
                    >
                      <div className="flex items-center gap-1">
                        Customer
                        {sortField === 'customer' && (
                          <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-3 font-medium">Service</th>
                    <th 
                      className="px-4 py-3 font-medium cursor-pointer hover:text-offwhite transition-colors"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-1">
                        Status
                        {sortField === 'status' && (
                          <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 font-medium cursor-pointer hover:text-offwhite transition-colors"
                      onClick={() => handleSort('order_date')}
                    >
                      <div className="flex items-center gap-1">
                        Date
                        {sortField === 'order_date' && (
                          <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 font-medium text-right cursor-pointer hover:text-offwhite transition-colors"
                      onClick={() => handleSort('total')}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Total
                        {sortField === 'total' && (
                          <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-taupe/10">
                  {filteredOrders.map((order) => (
                    <tr 
                      key={order.order_id} 
                      className={`hover:bg-cardBg/50 transition-colors cursor-pointer ${
                        selectedOrder?.order_id === order.order_id ? 'bg-cardBg' : ''
                      }`}
                      onClick={() => setSelectedOrder(order)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-offwhite">{getCustomerName(order.customer_id)}</span>
                          {order.rush_order && (
                            <span className="text-rust" title="Rush Order">⚡</span>
                          )}
                          {order.payment_date && (
                            <span className="text-sage" title="Paid">$</span>
                          )}
                        </div>
                        <span className="text-xs text-charcoal">#{order.order_id}</span>
                      </td>
                      <td className="px-4 py-3 text-charcoal text-sm">
                        {order.garment_type} • {order.service_type}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-charcoal text-sm">
                        {formatDate(order.order_date)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-offwhite">
                        ${calculateOrderTotal(order).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detail Panel */}
      <div className="w-96 flex-shrink-0">
        {selectedOrder ? (
          <div className="bg-cardBg rounded-sm border border-taupe/20 h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-taupe/20">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-display text-lg text-offwhite">Order #{selectedOrder.order_id}</h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-1 text-charcoal hover:text-offwhite transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <span className={`px-3 py-1 rounded text-sm font-medium ${getStatusBgColor(selectedOrder.status)}`}>
                {selectedOrder.status}
              </span>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4 space-y-6">
              {/* Customer Info */}
              <div>
                <h3 className="text-xs font-medium text-charcoal uppercase tracking-wide mb-2">Customer</h3>
                <div className="space-y-1">
                  <p className="text-offwhite font-medium">{getCustomerName(selectedOrder.customer_id)}</p>
                  <p className="text-charcoal text-sm">{getCustomer(selectedOrder.customer_id)?.phone || '—'}</p>
                  <p className="text-charcoal text-sm">{getCustomer(selectedOrder.customer_id)?.email || '—'}</p>
                </div>
              </div>

              {/* Order Details */}
              <div>
                <h3 className="text-xs font-medium text-charcoal uppercase tracking-wide mb-2">Order Details</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-charcoal">Garment</span>
                    <span className="text-offwhite">{selectedOrder.garment_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-charcoal">Service</span>
                    <span className="text-offwhite">{selectedOrder.service_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-charcoal">Quantity</span>
                    <span className="text-offwhite">{selectedOrder.quantity}</span>
                  </div>
                  {selectedOrder.order_details && (
                    <div className="pt-2">
                      <span className="text-charcoal text-sm">Notes:</span>
                      <p className="text-offwhite text-sm mt-1">{selectedOrder.order_details}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Dates */}
              <div>
                <h3 className="text-xs font-medium text-charcoal uppercase tracking-wide mb-2">Dates</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-charcoal">Received</span>
                    <span className="text-offwhite">{formatDate(selectedOrder.order_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-charcoal">Expected</span>
                    <span className="text-offwhite">{formatDate(selectedOrder.expected_date)}</span>
                  </div>
                  {selectedOrder.completed_date && (
                    <div className="flex justify-between">
                      <span className="text-charcoal">Completed</span>
                      <span className="text-offwhite">{formatDate(selectedOrder.completed_date)}</span>
                    </div>
                  )}
                  {selectedOrder.picked_up_date && (
                    <div className="flex justify-between">
                      <span className="text-charcoal">Picked Up</span>
                      <span className="text-offwhite">{formatDate(selectedOrder.picked_up_date)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Pricing */}
              <div>
                <h3 className="text-xs font-medium text-charcoal uppercase tracking-wide mb-2">Pricing</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-charcoal">Subtotal</span>
                    <span className="text-offwhite">${(selectedOrder.unit_cost * selectedOrder.quantity).toFixed(2)}</span>
                  </div>
                  {selectedOrder.tax_applied === 'Yes' && (
                    <div className="flex justify-between">
                      <span className="text-charcoal">Tax (8.25%)</span>
                      <span className="text-offwhite">${(selectedOrder.unit_cost * selectedOrder.quantity * TAX_RATE).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-taupe/20 font-medium">
                    <span className="text-offwhite">Total</span>
                    <span className="text-offwhite">${calculateOrderTotal(selectedOrder).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Status */}
              <div>
                <h3 className="text-xs font-medium text-charcoal uppercase tracking-wide mb-2">Payment</h3>
                <div className="flex items-center justify-between">
                  <span className={selectedOrder.payment_date ? 'text-sage' : 'text-red'}>
                    {selectedOrder.payment_date ? `Paid on ${formatDate(selectedOrder.payment_date)}` : 'Unpaid'}
                  </span>
                  <button
                    onClick={() => updatePaymentStatus(String(selectedOrder.order_id), !selectedOrder.payment_date)}
                    className={`text-xs px-2 py-1 rounded transition-colors ${
                      selectedOrder.payment_date 
                        ? 'text-charcoal hover:text-red' 
                        : 'bg-sage/20 text-sage hover:bg-sage/30'
                    }`}
                  >
                    {selectedOrder.payment_date ? 'Mark Unpaid' : 'Mark Paid'}
                  </button>
                </div>
              </div>

              {/* Status Control */}
              <div>
                <h3 className="text-xs font-medium text-charcoal uppercase tracking-wide mb-2">Update Status</h3>
                <div className="flex gap-2">
                  {STATUS_OPTIONS.map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(String(selectedOrder.order_id), status, selectedOrder.customer_id)}
                      disabled={updatingOrder === String(selectedOrder.order_id)}
                      className={`flex-1 px-3 py-2 text-xs font-medium rounded-sm transition-all ${
                        selectedOrder.status === status
                          ? getStatusBgColor(status)
                          : 'border border-taupe/30 text-charcoal hover:border-offwhite hover:text-offwhite'
                      } ${updatingOrder === String(selectedOrder.order_id) ? 'opacity-50' : ''}`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Internal Notes */}
              {selectedOrder.internal_notes && (
                <div>
                  <h3 className="text-xs font-medium text-charcoal uppercase tracking-wide mb-2">Internal Notes</h3>
                  <p className="text-charcoal text-sm bg-soulsonic/50 p-3 rounded">{selectedOrder.internal_notes}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-taupe/20 flex gap-2">
              <button
                onClick={() => openEditModal(selectedOrder)}
                className="flex-1 btn-secondary text-sm py-2"
              >
                Edit
              </button>
              <button
                onClick={() => handleDeleteClick(String(selectedOrder.order_id))}
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p>Select an order to view details</p>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showWarningModal && (
        <div className="fixed inset-0 bg-soulsonic/80 flex items-center justify-center z-50">
          <div className="bg-cardBg rounded-sm p-6 max-w-md mx-4 shadow-lg border border-taupe/20">
            <h3 className="font-display text-xl text-offwhite mb-4">Cannot Mark as Picked Up</h3>
            <p className="text-charcoal mb-6">
              This order cannot be picked up if it has not been marked ready yet. Please mark the order as <span className="font-bold text-rust">"Ready"</span> first.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowWarningModal(false)} className="btn-primary">
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmModal && pendingStatusChange && (
        <div className="fixed inset-0 bg-soulsonic/80 flex items-center justify-center z-50">
          <div className="bg-cardBg rounded-sm p-6 max-w-md mx-4 shadow-lg border border-taupe/20">
            <h3 className="font-display text-xl text-offwhite mb-4">Confirm Order Ready</h3>
            <p className="text-charcoal mb-6">
              Are you sure this order is complete? <strong className="text-offwhite">{pendingStatusChange.customerName}</strong> will be notified their order is ready for pickup.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowConfirmModal(false)
                  setPendingStatusChange(null)
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => updateStatus(pendingStatusChange.orderId, pendingStatusChange.newStatus)}
                className="bg-rust text-soulsonic px-6 py-3 rounded-sm font-medium hover:bg-rust/80 transition-colors"
              >
                Yes, Mark Ready
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && orderToDelete && (
        <div className="fixed inset-0 bg-soulsonic/80 flex items-center justify-center z-50">
          <div className="bg-cardBg rounded-sm p-6 max-w-md mx-4 shadow-lg border border-taupe/20">
            <h3 className="font-display text-xl text-offwhite mb-4">Delete Order</h3>
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
                className="bg-red text-offwhite px-6 py-3 rounded-sm font-medium hover:bg-red/80 transition-colors disabled:opacity-50"
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editingOrder && (
        <div className="fixed inset-0 bg-soulsonic/80 flex items-center justify-center z-50">
          <div className="bg-cardBg rounded-sm p-6 max-w-lg w-full mx-4 shadow-lg max-h-[90vh] overflow-y-auto border border-taupe/20">
            <h3 className="font-display text-xl text-offwhite mb-4">Edit Order</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Garment Type</label>
                  <select
                    value={editForm.garment_type}
                    onChange={(e) => setEditForm({ ...editForm, garment_type: e.target.value })}
                    className="input-field"
                  >
                    {GARMENT_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Service Type</label>
                  <select
                    value={editForm.service_type}
                    onChange={(e) => setEditForm({ ...editForm, service_type: e.target.value })}
                    className="input-field"
                  >
                    {SERVICE_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Order Details</label>
                <textarea
                  value={editForm.order_details}
                  onChange={(e) => setEditForm({ ...editForm, order_details: e.target.value })}
                  rows={3}
                  className="input-field resize-none"
                  placeholder="Additional notes..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Quantity</label>
                  <input
                    type="number"
                    value={editForm.quantity}
                    onChange={(e) => setEditForm({ ...editForm, quantity: parseInt(e.target.value) || 1 })}
                    min="1"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Unit Cost ($)</label>
                  <input
                    type="number"
                    value={editForm.unit_cost || ''}
                    onChange={(e) => setEditForm({ ...editForm, unit_cost: parseFloat(e.target.value) || 0 })}
                    min="0"
                    step="0.01"
                    className="input-field"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.tax_applied}
                    onChange={(e) => setEditForm({ ...editForm, tax_applied: e.target.checked })}
                    className="w-4 h-4 rounded border-taupe/30 text-rust focus:ring-rust"
                  />
                  <span className="text-sm text-charcoal">Add tax (8.25%)</span>
                </label>
                
                <div className="bg-soulsonic/50 border border-taupe/20 rounded-sm p-4">
                  <div className="flex justify-between text-sm text-charcoal">
                    <span>Subtotal ({editForm.quantity} × ${editForm.unit_cost.toFixed(2)})</span>
                    <span>${(editForm.unit_cost * editForm.quantity).toFixed(2)}</span>
                  </div>
                  {editForm.tax_applied && (
                    <div className="flex justify-between text-sm text-charcoal mt-1">
                      <span>Tax (8.25%)</span>
                      <span>${(editForm.unit_cost * editForm.quantity * TAX_RATE).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-medium mt-2 pt-2 border-t border-taupe/20 text-offwhite">
                    <span>Total</span>
                    <span>${calculateEditTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Expected Date</label>
                <input
                  type="date"
                  value={editForm.expected_date}
                  onChange={(e) => setEditForm({ ...editForm, expected_date: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Internal Notes</label>
                <textarea
                  value={editForm.internal_notes}
                  onChange={(e) => setEditForm({ ...editForm, internal_notes: e.target.value })}
                  rows={2}
                  className="input-field resize-none"
                  placeholder="Internal notes..."
                />
              </div>
            </div>
            
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={closeEditModal} className="btn-secondary" disabled={saving}>
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
    </div>
  )
}
