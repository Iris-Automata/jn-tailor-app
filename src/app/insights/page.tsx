'use client'

import { useState, useEffect } from 'react'

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
  completed_date: string
  picked_up_date: string
}

interface Customer {
  customer_id: string
  first_name: string
  last_name: string
  created_date: string
}

const TAX_RATE = 0.0825

type DateRange = '7d' | '30d' | '90d' | 'all'

export default function InsightsPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<DateRange>('30d')

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
      setOrders(ordersData)
      setCustomers(customersData)
    } catch (err) {
      console.error('Failed to fetch data:', err)
    } finally {
      setLoading(false)
    }
  }

  function calculateOrderTotal(order: Order): number {
    const subtotal = order.unit_cost * order.quantity
    return order.tax_applied === 'Yes' ? subtotal + (subtotal * TAX_RATE) : subtotal
  }

  function getFilteredOrders(): Order[] {
    if (dateRange === 'all') return orders
    
    const now = new Date()
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    
    return orders.filter(o => new Date(o.order_date) >= cutoff)
  }

  function getFilteredCustomers(): Customer[] {
    if (dateRange === 'all') return customers
    
    const now = new Date()
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    
    return customers.filter(c => new Date(c.created_date) >= cutoff)
  }

  const filteredOrders = getFilteredOrders()
  const filteredCustomers = getFilteredCustomers()

  // Calculate stats
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + calculateOrderTotal(o), 0)
  const paidRevenue = filteredOrders.filter(o => o.payment_date).reduce((sum, o) => sum + calculateOrderTotal(o), 0)
  const unpaidRevenue = totalRevenue - paidRevenue
  const avgOrderValue = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0

  const statusCounts = {
    received: filteredOrders.filter(o => o.status === 'Received').length,
    ready: filteredOrders.filter(o => o.status === 'Ready').length,
    pickedUp: filteredOrders.filter(o => o.status === 'Picked Up').length,
  }

  // Garment type breakdown
  const garmentCounts: { [key: string]: number } = {}
  filteredOrders.forEach(o => {
    garmentCounts[o.garment_type] = (garmentCounts[o.garment_type] || 0) + 1
  })
  const sortedGarments = Object.entries(garmentCounts).sort((a, b) => b[1] - a[1])

  // Service type breakdown
  const serviceCounts: { [key: string]: number } = {}
  filteredOrders.forEach(o => {
    serviceCounts[o.service_type] = (serviceCounts[o.service_type] || 0) + 1
  })
  const sortedServices = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1])

  // Daily revenue for chart (last 7/30/90 days)
  function getDailyRevenue(): { date: string; revenue: number }[] {
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 30
    const result: { date: string; revenue: number }[] = []
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const dayOrders = orders.filter(o => o.order_date === dateStr)
      const dayRevenue = dayOrders.reduce((sum, o) => sum + calculateOrderTotal(o), 0)
      
      result.push({
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        revenue: dayRevenue,
      })
    }
    
    return result
  }

  const dailyRevenue = getDailyRevenue()
  const maxDailyRevenue = Math.max(...dailyRevenue.map(d => d.revenue), 1)

  // Top customers
  const customerRevenue: { [id: string]: number } = {}
  filteredOrders.forEach(o => {
    customerRevenue[o.customer_id] = (customerRevenue[o.customer_id] || 0) + calculateOrderTotal(o)
  })
  const topCustomers = Object.entries(customerRevenue)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, revenue]) => {
      const customer = customers.find(c => c.customer_id === id)
      return {
        name: customer ? `${customer.first_name} ${customer.last_name}` : 'Unknown',
        revenue,
        orderCount: filteredOrders.filter(o => o.customer_id === id).length,
      }
    })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-offwhite mb-1">Insights</h1>
          <p className="text-charcoal">Analytics and business performance</p>
        </div>
        
        {/* Date Range Filter */}
        <div className="flex gap-2">
          {(['7d', '30d', '90d', 'all'] as DateRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-2 rounded-sm text-sm transition-colors ${
                dateRange === range
                  ? 'bg-offwhite text-soulsonic'
                  : 'border border-taupe/30 text-charcoal hover:border-offwhite hover:text-offwhite'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="card">
          <p className="text-charcoal text-center py-12">Loading analytics...</p>
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-4 gap-4">
            <div className="card">
              <p className="text-charcoal text-sm mb-1">Total Revenue</p>
              <p className="text-3xl font-display text-offwhite">${totalRevenue.toFixed(2)}</p>
              <p className="text-xs text-charcoal mt-2">{filteredOrders.length} orders</p>
            </div>
            <div className="card">
              <p className="text-charcoal text-sm mb-1">Collected</p>
              <p className="text-3xl font-display text-sage">${paidRevenue.toFixed(2)}</p>
              <p className="text-xs text-charcoal mt-2">
                {filteredOrders.filter(o => o.payment_date).length} paid orders
              </p>
            </div>
            <div className="card border-red/30">
              <p className="text-charcoal text-sm mb-1">Outstanding</p>
              <p className="text-3xl font-display text-red">${unpaidRevenue.toFixed(2)}</p>
              <p className="text-xs text-charcoal mt-2">
                {filteredOrders.filter(o => !o.payment_date).length} unpaid orders
              </p>
            </div>
            <div className="card">
              <p className="text-charcoal text-sm mb-1">Avg Order Value</p>
              <p className="text-3xl font-display text-offwhite">${avgOrderValue.toFixed(2)}</p>
              <p className="text-xs text-charcoal mt-2">{filteredCustomers.length} new customers</p>
            </div>
          </div>

          {/* Order Status */}
          <div>
            <h2 className="font-display text-lg text-offwhite mb-4">Order Status</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="card text-center border-gold/30">
                <p className="text-4xl font-display text-gold">{statusCounts.received}</p>
                <p className="text-charcoal text-sm mt-1">Received</p>
                <div className="mt-3 bg-soulsonic/50 rounded-full h-2">
                  <div 
                    className="bg-gold h-2 rounded-full transition-all"
                    style={{ width: `${filteredOrders.length ? (statusCounts.received / filteredOrders.length * 100) : 0}%` }}
                  />
                </div>
              </div>
              <div className="card text-center border-rust/30">
                <p className="text-4xl font-display text-rust">{statusCounts.ready}</p>
                <p className="text-charcoal text-sm mt-1">Ready for Pickup</p>
                <div className="mt-3 bg-soulsonic/50 rounded-full h-2">
                  <div 
                    className="bg-rust h-2 rounded-full transition-all"
                    style={{ width: `${filteredOrders.length ? (statusCounts.ready / filteredOrders.length * 100) : 0}%` }}
                  />
                </div>
              </div>
              <div className="card text-center border-sage/30">
                <p className="text-4xl font-display text-sage">{statusCounts.pickedUp}</p>
                <p className="text-charcoal text-sm mt-1">Picked Up</p>
                <div className="mt-3 bg-soulsonic/50 rounded-full h-2">
                  <div 
                    className="bg-sage h-2 rounded-full transition-all"
                    style={{ width: `${filteredOrders.length ? (statusCounts.pickedUp / filteredOrders.length * 100) : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Chart */}
          {dateRange !== 'all' && (
            <div>
              <h2 className="font-display text-lg text-offwhite mb-4">Daily Revenue</h2>
              <div className="card">
                <div className="flex items-end gap-1 h-48">
                  {dailyRevenue.map((day, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div 
                        className="w-full bg-sage/80 rounded-t hover:bg-sage transition-colors"
                        style={{ 
                          height: `${(day.revenue / maxDailyRevenue) * 100}%`,
                          minHeight: day.revenue > 0 ? '4px' : '0'
                        }}
                        title={`${day.date}: $${day.revenue.toFixed(2)}`}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-xs text-charcoal">
                  <span>{dailyRevenue[0]?.date}</span>
                  <span>{dailyRevenue[Math.floor(dailyRevenue.length / 2)]?.date}</span>
                  <span>{dailyRevenue[dailyRevenue.length - 1]?.date}</span>
                </div>
              </div>
            </div>
          )}

          {/* Two Column Layout */}
          <div className="grid grid-cols-2 gap-6">
            {/* Popular Services */}
            <div>
              <h2 className="font-display text-lg text-offwhite mb-4">Popular Services</h2>
              <div className="card space-y-3">
                {sortedServices.length === 0 ? (
                  <p className="text-charcoal text-center py-4">No data yet</p>
                ) : (
                  sortedServices.slice(0, 6).map(([service, count], i) => (
                    <div key={service}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-offwhite">{service}</span>
                        <span className="text-charcoal text-sm">{count} orders</span>
                      </div>
                      <div className="bg-soulsonic/50 rounded-full h-2">
                        <div 
                          className="bg-rust h-2 rounded-full transition-all"
                          style={{ width: `${(count / sortedServices[0][1]) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Popular Garments */}
            <div>
              <h2 className="font-display text-lg text-offwhite mb-4">Popular Garments</h2>
              <div className="card space-y-3">
                {sortedGarments.length === 0 ? (
                  <p className="text-charcoal text-center py-4">No data yet</p>
                ) : (
                  sortedGarments.slice(0, 6).map(([garment, count], i) => (
                    <div key={garment}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-offwhite">{garment}</span>
                        <span className="text-charcoal text-sm">{count} orders</span>
                      </div>
                      <div className="bg-soulsonic/50 rounded-full h-2">
                        <div 
                          className="bg-lavender h-2 rounded-full transition-all"
                          style={{ width: `${(count / sortedGarments[0][1]) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Top Customers */}
          <div>
            <h2 className="font-display text-lg text-offwhite mb-4">Top Customers</h2>
            <div className="card p-0 overflow-hidden">
              {topCustomers.length === 0 ? (
                <p className="text-charcoal text-center py-8">No data yet</p>
              ) : (
                <table className="w-full">
                  <thead className="bg-soulsonic/50">
                    <tr className="text-left text-sm text-charcoal">
                      <th className="px-4 py-3 font-medium">Customer</th>
                      <th className="px-4 py-3 font-medium text-center">Orders</th>
                      <th className="px-4 py-3 font-medium text-right">Total Spent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-taupe/10">
                    {topCustomers.map((customer, i) => (
                      <tr key={i} className="hover:bg-cardBg/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-sage/20 flex items-center justify-center text-sage font-medium">
                              {i + 1}
                            </div>
                            <span className="font-medium text-offwhite">{customer.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-charcoal">
                          {customer.orderCount}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-offwhite">
                          ${customer.revenue.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Summary Stats */}
          <div>
            <h2 className="font-display text-lg text-offwhite mb-4">Summary</h2>
            <div className="grid grid-cols-4 gap-4">
              <div className="card text-center">
                <p className="text-3xl font-display text-offwhite">{customers.length}</p>
                <p className="text-charcoal text-sm">Total Customers</p>
              </div>
              <div className="card text-center">
                <p className="text-3xl font-display text-offwhite">{orders.length}</p>
                <p className="text-charcoal text-sm">Total Orders</p>
              </div>
              <div className="card text-center">
                <p className="text-3xl font-display text-offwhite">
                  {customers.length > 0 ? (orders.length / customers.length).toFixed(1) : '0'}
                </p>
                <p className="text-charcoal text-sm">Orders per Customer</p>
              </div>
              <div className="card text-center">
                <p className="text-3xl font-display text-offwhite">
                  ${orders.reduce((sum, o) => sum + calculateOrderTotal(o), 0).toFixed(2)}
                </p>
                <p className="text-charcoal text-sm">Lifetime Revenue</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
