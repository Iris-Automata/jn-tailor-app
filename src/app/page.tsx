'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

const TAX_RATE = 0.0825

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
  expected_date: string
  completed_date: string
  picked_up_date: string
  payment_date: string
  rush_order: boolean
}

interface Customer {
  customer_id: string
  first_name: string
  last_name: string
  phone: string
}

interface TodayStats {
  received: number
  markedReady: number
  pickedUp: number
}

interface RevenueStats {
  today: number
  week: number
  month: number
  unpaidTotal: number
}

export default function Dashboard() {
  const [allOrders, setAllOrders] = useState<Order[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [todayStats, setTodayStats] = useState<TodayStats>({ received: 0, markedReady: 0, pickedUp: 0 })
  const [revenueStats, setRevenueStats] = useState<RevenueStats>({ today: 0, week: 0, month: 0, unpaidTotal: 0 })
  const [statusCounts, setStatusCounts] = useState({ received: 0, ready: 0, pickedUp: 0 })
  
  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [modalTitle, setModalTitle] = useState('')
  const [modalOrders, setModalOrders] = useState<Order[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [ordersRes, customersRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/customers'),
      ])
      const ordersData = await ordersRes.json()
      const customersData = await customersRes.json()
      
      setAllOrders(ordersData)
      setCustomers(customersData)
      
      // Calculate today's stats
      const today = new Date().toISOString().split('T')[0]
      const todayReceived = ordersData.filter((o: Order) => o.order_date === today)
      const todayMarkedReady = ordersData.filter((o: Order) => o.completed_date === today)
      const todayPickedUp = ordersData.filter((o: Order) => o.picked_up_date === today)
      
      setTodayStats({
        received: todayReceived.length,
        markedReady: todayMarkedReady.length,
        pickedUp: todayPickedUp.length,
      })

      // Calculate status counts (all time, current status)
      const received = ordersData.filter((o: Order) => o.status === 'Received').length
      const ready = ordersData.filter((o: Order) => o.status === 'Ready').length
      const pickedUp = ordersData.filter((o: Order) => o.status === 'Picked Up').length
      setStatusCounts({ received, ready, pickedUp })

      // Calculate revenue stats
      const now = new Date()
      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - now.getDay())
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

      let todayRevenue = 0
      let weekRevenue = 0
      let monthRevenue = 0
      let unpaidTotal = 0

      ordersData.forEach((order: Order) => {
        const total = calculateOrderTotal(order)
        const orderDate = new Date(order.order_date)
        
        if (order.order_date === today) todayRevenue += total
        if (orderDate >= startOfWeek) weekRevenue += total
        if (orderDate >= startOfMonth) monthRevenue += total
        if (!order.payment_date) unpaidTotal += total
      })

      setRevenueStats({ today: todayRevenue, week: weekRevenue, month: monthRevenue, unpaidTotal })

    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
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
      case 'Received': return 'bg-gold/20 text-gold'
      case 'Ready': return 'bg-rust/20 text-rust'
      case 'Picked Up': return 'bg-sage/20 text-sage'
      default: return 'bg-taupe/20 text-taupe'
    }
  }

  function formatDate(dateStr: string) {
    if (!dateStr) return ''
    const [year, month, day] = dateStr.split('-')
    return `${month}/${day}/${year}`
  }

  function calculateOrderTotal(order: Order): number {
    const subtotal = order.unit_cost * order.quantity
    if (order.tax_applied === 'Yes') {
      return subtotal + (subtotal * TAX_RATE)
    }
    return subtotal
  }

  function openModal(type: 'received' | 'markedReady' | 'pickedUp' | 'allReceived' | 'allReady') {
    const today = new Date().toISOString().split('T')[0]
    let orders: Order[] = []
    let title = ''

    if (type === 'received') {
      orders = allOrders.filter((o) => o.order_date === today)
      title = "Today's Received Orders"
    } else if (type === 'markedReady') {
      orders = allOrders.filter((o) => o.completed_date === today)
      title = "Today's Marked Ready Orders"
    } else if (type === 'pickedUp') {
      orders = allOrders.filter((o) => o.picked_up_date === today)
      title = "Today's Picked Up Orders"
    } else if (type === 'allReceived') {
      orders = allOrders.filter((o) => o.status === 'Received')
      title = "All Pending Orders (Received)"
    } else if (type === 'allReady') {
      orders = allOrders.filter((o) => o.status === 'Ready')
      title = "All Ready for Pickup"
    }

    setModalOrders(orders)
    setModalTitle(title)
    setShowModal(true)
  }

  // Get recent orders (last 10)
  const recentOrders = [...allOrders].reverse().slice(0, 10)

  // Get orders needing attention (Ready for more than 3 days)
  const needsAttention = allOrders.filter(o => {
    if (o.status !== 'Ready' || !o.completed_date) return false
    const readyDate = new Date(o.completed_date)
    const daysSinceReady = Math.floor((Date.now() - readyDate.getTime()) / (1000 * 60 * 60 * 24))
    return daysSinceReady >= 3
  })

  return (
    <div className="space-y-8">
      {/* Orders Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-soulsonic/80 flex items-center justify-center z-50">
          <div className="bg-cardBg rounded-sm p-6 max-w-2xl w-full mx-4 shadow-lg max-h-[80vh] overflow-hidden flex flex-col border border-taupe/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xl text-offwhite">{modalTitle}</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-charcoal hover:text-offwhite transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1">
              {modalOrders.length === 0 ? (
                <p className="text-charcoal text-center py-8">No orders found</p>
              ) : (
                <table className="w-full">
                  <thead className="border-b border-taupe/20">
                    <tr className="text-left text-sm text-charcoal">
                      <th className="pb-3 font-medium">Customer</th>
                      <th className="pb-3 font-medium">Details</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-taupe/10">
                    {modalOrders.map((order) => (
                      <tr key={order.order_id} className="text-sm">
                        <td className="py-3">
                          <div className="font-medium text-offwhite">{getCustomerName(order.customer_id)}</div>
                          <div className="text-charcoal text-xs">Order #{order.order_id}</div>
                        </td>
                        <td className="py-3 text-charcoal">
                          {order.garment_type} • {order.service_type}
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3 text-right font-medium text-offwhite">
                          ${calculateOrderTotal(order).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-offwhite mb-1">Dashboard</h1>
          <p className="text-charcoal">Welcome back. Here's what's happening today.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/customers/new" className="btn-secondary text-sm">
            + New Customer
          </Link>
          <Link href="/orders/new" className="btn-primary text-sm">
            + New Order
          </Link>
        </div>
      </div>

      {/* Today's Activity */}
      <div>
        <h2 className="font-display text-lg text-offwhite mb-4">Today's Activity</h2>
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => openModal('received')}
            className="card text-left hover:border-gold/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-charcoal text-sm">Received</p>
                <p className="text-3xl font-display text-gold mt-1">
                  {loading ? '—' : todayStats.received}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
            </div>
          </button>

          <button
            onClick={() => openModal('markedReady')}
            className="card text-left hover:border-rust/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-charcoal text-sm">Marked Ready</p>
                <p className="text-3xl font-display text-rust mt-1">
                  {loading ? '—' : todayStats.markedReady}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-rust/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-rust" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </button>

          <button
            onClick={() => openModal('pickedUp')}
            className="card text-left hover:border-sage/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-charcoal text-sm">Picked Up</p>
                <p className="text-3xl font-display text-sage mt-1">
                  {loading ? '—' : todayStats.pickedUp}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-sage/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-sage" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left Column - Order Status & Revenue */}
        <div className="col-span-2 space-y-6">
          {/* Current Order Status */}
          <div>
            <h2 className="font-display text-lg text-offwhite mb-4">Order Status Overview</h2>
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => openModal('allReceived')}
                className="card text-center hover:border-gold/50 transition-colors cursor-pointer"
              >
                <p className="text-4xl font-display text-gold">{statusCounts.received}</p>
                <p className="text-charcoal text-sm mt-1">Pending</p>
              </button>
              <button
                onClick={() => openModal('allReady')}
                className="card text-center hover:border-rust/50 transition-colors cursor-pointer"
              >
                <p className="text-4xl font-display text-rust">{statusCounts.ready}</p>
                <p className="text-charcoal text-sm mt-1">Ready for Pickup</p>
              </button>
              <div className="card text-center">
                <p className="text-4xl font-display text-sage">{statusCounts.pickedUp}</p>
                <p className="text-charcoal text-sm mt-1">Completed</p>
              </div>
            </div>
          </div>

          {/* Revenue Stats */}
          <div>
            <h2 className="font-display text-lg text-offwhite mb-4">Revenue</h2>
            <div className="grid grid-cols-4 gap-4">
              <div className="card">
                <p className="text-charcoal text-sm">Today</p>
                <p className="text-2xl font-display text-offwhite mt-1">
                  ${loading ? '—' : revenueStats.today.toFixed(2)}
                </p>
              </div>
              <div className="card">
                <p className="text-charcoal text-sm">This Week</p>
                <p className="text-2xl font-display text-offwhite mt-1">
                  ${loading ? '—' : revenueStats.week.toFixed(2)}
                </p>
              </div>
              <div className="card">
                <p className="text-charcoal text-sm">This Month</p>
                <p className="text-2xl font-display text-offwhite mt-1">
                  ${loading ? '—' : revenueStats.month.toFixed(2)}
                </p>
              </div>
              <div className="card border-red/30">
                <p className="text-charcoal text-sm">Unpaid</p>
                <p className="text-2xl font-display text-red mt-1">
                  ${loading ? '—' : revenueStats.unpaidTotal.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg text-offwhite">Recent Orders</h2>
              <Link href="/orders" className="text-sm text-charcoal hover:text-rust transition-colors">
                View all →
              </Link>
            </div>
            {loading ? (
              <div className="card">
                <p className="text-charcoal text-center py-8">Loading...</p>
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="card">
                <p className="text-charcoal text-center py-8">No orders yet</p>
              </div>
            ) : (
              <div className="card p-0 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-soulsonic/50">
                    <tr className="text-left text-sm text-charcoal">
                      <th className="px-4 py-3 font-medium">Customer</th>
                      <th className="px-4 py-3 font-medium">Service</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-taupe/10">
                    {recentOrders.map((order) => (
                      <tr key={order.order_id} className="hover:bg-soulsonic/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-offwhite">{getCustomerName(order.customer_id)}</span>
                            {order.rush_order && (
                              <span className="text-rust text-xs">⚡</span>
                            )}
                            {order.payment_date && (
                              <span className="text-sage text-xs">$</span>
                            )}
                          </div>
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

        {/* Right Column - Alerts & Quick Stats */}
        <div className="space-y-6">
          {/* Needs Attention */}
          {needsAttention.length > 0 && (
            <div>
              <h2 className="font-display text-lg text-offwhite mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red animate-pulse"></span>
                Needs Attention
              </h2>
              <div className="card border-red/30 space-y-3">
                <p className="text-sm text-charcoal">
                  {needsAttention.length} order{needsAttention.length > 1 ? 's' : ''} ready for 3+ days
                </p>
                <div className="space-y-2">
                  {needsAttention.slice(0, 5).map((order) => (
                    <div key={order.order_id} className="flex items-center justify-between text-sm">
                      <span className="text-offwhite">{getCustomerName(order.customer_id)}</span>
                      <span className="text-charcoal">{formatDate(order.completed_date)}</span>
                    </div>
                  ))}
                </div>
                {needsAttention.length > 5 && (
                  <Link href="/orders?status=Ready" className="text-xs text-rust hover:underline">
                    View all {needsAttention.length} →
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div>
            <h2 className="font-display text-lg text-offwhite mb-4">Quick Stats</h2>
            <div className="card space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-charcoal">Total Customers</span>
                <span className="font-display text-offwhite">{customers.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-charcoal">Total Orders</span>
                <span className="font-display text-offwhite">{allOrders.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-charcoal">Avg Order Value</span>
                <span className="font-display text-offwhite">
                  ${allOrders.length > 0 
                    ? (allOrders.reduce((sum, o) => sum + calculateOrderTotal(o), 0) / allOrders.length).toFixed(2)
                    : '0.00'
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <div>
            <h2 className="font-display text-lg text-offwhite mb-4">Keyboard Shortcuts</h2>
            <div className="card space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-charcoal">New Order</span>
                <kbd className="px-2 py-1 bg-soulsonic rounded text-xs text-charcoal">⌘ N</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-charcoal">Search</span>
                <kbd className="px-2 py-1 bg-soulsonic rounded text-xs text-charcoal">⌘ K</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-charcoal">Orders</span>
                <kbd className="px-2 py-1 bg-soulsonic rounded text-xs text-charcoal">⌘ O</kbd>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
