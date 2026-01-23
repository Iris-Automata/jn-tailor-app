'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

interface Order {
  order_id: string
  customer_id: string
  order_date: string
  garment_type: string
  service_type: string
  status: string
  cost: number
  expected_date: string
  completed_date: string
  picked_up_date: string
}

interface Customer {
  customer_id: string
  first_name: string
  last_name: string
}

interface TodayStats {
  received: number
  markedReady: number
  pickedUp: number
}

export default function Dashboard() {
  const [allOrders, setAllOrders] = useState<Order[]>([])
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [todayStats, setTodayStats] = useState<TodayStats>({ received: 0, markedReady: 0, pickedUp: 0 })
  
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
      setRecentOrders(ordersData.slice(0, 5))
      setCustomers(customersData)
      
      // Calculate today's stats
      const today = new Date().toISOString().split('T')[0]
      
      // Received: orders received today (regardless of current status)
      const todayReceived = ordersData.filter((o: Order) => o.order_date === today)
      
      // Marked Ready: orders marked ready today (regardless of current status)
      const todayMarkedReady = ordersData.filter((o: Order) => o.completed_date === today)
      
      // Picked Up: orders picked up today
      const todayPickedUp = ordersData.filter((o: Order) => o.picked_up_date === today)
      
      setTodayStats({
        received: todayReceived.length,
        markedReady: todayMarkedReady.length,
        pickedUp: todayPickedUp.length,
      })
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

  function openModal(type: 'received' | 'markedReady' | 'pickedUp') {
    const today = new Date().toISOString().split('T')[0]
    let orders: Order[] = []
    let title = ''

    if (type === 'received') {
      // All orders received today (regardless of current status)
      orders = allOrders.filter((o) => o.order_date === today)
      title = "Today's Received Orders"
    } else if (type === 'markedReady') {
      // All orders marked ready today (regardless of current status)
      orders = allOrders.filter((o) => o.completed_date === today)
      title = "Today's Marked Ready Orders"
    } else if (type === 'pickedUp') {
      // All orders picked up today
      orders = allOrders.filter((o) => o.picked_up_date === today)
      title = "Today's Picked Up Orders"
    }

    setModalOrders(orders)
    setModalTitle(title)
    setShowModal(true)
  }

  return (
    <div className="space-y-8">
      {/* Orders Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-charcoal/50 flex items-center justify-center z-50">
          <div className="bg-cardBg rounded-sm p-6 max-w-lg w-full mx-4 shadow-lg max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xl">{modalTitle}</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-taupe hover:text-charcoal transition-colors"
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
                <div className="space-y-3">
                  {modalOrders.map((order) => (
                    <div key={order.order_id} className="card">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{getCustomerName(order.customer_id)}</h4>
                          <p className="text-sm text-charcoal">
                            {order.garment_type} • {order.service_type}
                          </p>
                          <p className="text-xs text-charcoal">Order {order.order_id}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${order.cost}</p>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="font-display text-3xl mb-2">Dashboard</h1>
        <p className="text-charcoal">Manage your customers and orders</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/orders/new" className="card group hover:border-rust/50 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-display text-xl mb-2 group-hover:text-rust transition-colors">
                New Order
              </h2>
              <p className="text-charcoal text-sm">
                Create a new alteration order for a customer
              </p>
            </div>
            <span className="text-3xl text-taupe/30 group-hover:text-rust/50 transition-colors">
              +
            </span>
          </div>
        </Link>

        <Link href="/customers/new" className="card group hover:border-rust/50 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-display text-xl mb-2 group-hover:text-rust transition-colors">
                New Customer
              </h2>
              <p className="text-charcoal text-sm">
                Add a new customer to your records
              </p>
            </div>
            <span className="text-3xl text-taupe/30 group-hover:text-rust/50 transition-colors">
              +
            </span>
          </div>
        </Link>
      </div>

      {/* Today's Orders Overview */}
      <div>
        <h2 className="font-display text-xl mb-4">Today's Orders Overview</h2>
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => openModal('received')}
            className="card text-center border-gold/30 hover:border-gold/60 transition-colors cursor-pointer"
          >
            <div className="text-3xl font-display text-gold mb-1">
              {loading ? '—' : todayStats.received}
            </div>
            <div className="text-sm text-charcoal">Received</div>
          </button>
          <button
            onClick={() => openModal('markedReady')}
            className="card text-center border-rust/30 hover:border-rust/60 transition-colors cursor-pointer"
          >
            <div className="text-3xl font-display text-rust mb-1">
              {loading ? '—' : todayStats.markedReady}
            </div>
            <div className="text-sm text-charcoal">Marked Ready</div>
          </button>
          <button
            onClick={() => openModal('pickedUp')}
            className="card text-center border-sage/30 hover:border-sage/60 transition-colors cursor-pointer"
          >
            <div className="text-3xl font-display text-sage mb-1">
              {loading ? '—' : todayStats.pickedUp}
            </div>
            <div className="text-sm text-charcoal">Picked Up</div>
          </button>
        </div>
      </div>

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl">Recent Orders</h2>
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
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div key={order.order_id} className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium">{getCustomerName(order.customer_id)}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm text-charcoal">
                      {order.garment_type} • {order.service_type}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${order.cost}</p>
                    <p className="text-xs text-charcoal">Due: {formatDate(order.expected_date)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
