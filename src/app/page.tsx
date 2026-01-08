'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

interface Stats {
  received: number
  in_progress: number
  ready: number
  picked_up: number
  total: number
}

interface Order {
  order_id: string
  customer_id: string
  order_date: string
  garment_type: string
  service_type: string
  status: string
  cost: number
  expected_date: string
}

interface Customer {
  customer_id: string
  first_name: string
  last_name: string
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({ received: 0, in_progress: 0, ready: 0, picked_up: 0, total: 0 })
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [statsRes, ordersRes, customersRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/orders'),
        fetch('/api/customers'),
      ])
      const statsData = await statsRes.json()
      const ordersData = await ordersRes.json()
      const customersData = await customersRes.json()
      
      setStats(statsData)
      setRecentOrders(ordersData.slice(0, 5)) // Show last 5 orders
      setCustomers(customersData)
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl mb-2">Dashboard</h1>
        <p className="text-taupe">Manage your customers and orders</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/orders/new" className="card group hover:border-rust/50 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-display text-xl mb-2 group-hover:text-rust transition-colors">
                New Order
              </h2>
              <p className="text-taupe text-sm">
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
              <p className="text-taupe text-sm">
                Add a new customer to your records
              </p>
            </div>
            <span className="text-3xl text-taupe/30 group-hover:text-rust/50 transition-colors">
              +
            </span>
          </div>
        </Link>
      </div>

      {/* Status Overview */}
      <div>
        <h2 className="font-display text-xl mb-4">Orders Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card text-center">
            <div className="text-3xl font-display text-charcoal mb-1">
              {loading ? '—' : stats.received}
            </div>
            <div className="text-sm text-taupe">Received</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-display text-charcoal mb-1">
              {loading ? '—' : stats.in_progress}
            </div>
            <div className="text-sm text-taupe">In Progress</div>
          </div>
          <div className="card text-center border-rust/30">
            <div className="text-3xl font-display text-rust mb-1">
              {loading ? '—' : stats.ready}
            </div>
            <div className="text-sm text-taupe">Ready</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-display text-sage mb-1">
              {loading ? '—' : stats.picked_up}
            </div>
            <div className="text-sm text-taupe">Picked Up</div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl">Recent Orders</h2>
          <Link href="/orders" className="text-sm text-taupe hover:text-rust transition-colors">
            View all →
          </Link>
        </div>
        {loading ? (
          <div className="card">
            <p className="text-taupe text-center py-8">Loading...</p>
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="card">
            <p className="text-taupe text-center py-8">No orders yet</p>
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
                    <p className="text-sm text-taupe">
                      {order.garment_type} • {order.service_type}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${order.cost}</p>
                    <p className="text-xs text-taupe">Due: {order.expected_date}</p>
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
