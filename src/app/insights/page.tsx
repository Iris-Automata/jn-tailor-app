'use client'

import { useState, useEffect } from 'react'

interface Stats {
  received: number
  ready: number
  picked_up: number
  total: number
}

export default function InsightsPage() {
  const [stats, setStats] = useState<Stats>({ received: 0, ready: 0, picked_up: 0, total: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    try {
      const res = await fetch('/api/stats')
      const data = await res.json()
      setStats(data)
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl mb-2">Insights</h1>
        <p className="text-charcoal">Analytics and business overview</p>
      </div>

      {/* Orders Overview */}
      <div>
        <h2 className="font-display text-xl mb-4">Orders Overview</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="card text-center border-gold/30">
            <div className="text-3xl font-display text-gold mb-1">
              {loading ? '—' : stats.received}
            </div>
            <div className="text-sm text-charcoal">Received</div>
          </div>
          <div className="card text-center border-rust/30">
            <div className="text-3xl font-display text-rust mb-1">
              {loading ? '—' : stats.ready}
            </div>
            <div className="text-sm text-charcoal">Ready</div>
          </div>
          <div className="card text-center border-sage/30">
            <div className="text-3xl font-display text-sage mb-1">
              {loading ? '—' : stats.picked_up}
            </div>
            <div className="text-sm text-charcoal">Picked Up</div>
          </div>
        </div>
      </div>

      {/* Placeholder for future analytics */}
      <div>
        <h2 className="font-display text-xl mb-4">Analytics</h2>
        <div className="card">
          <p className="text-charcoal text-center py-12">
            Charts and graphs coming soon...
          </p>
        </div>
      </div>
    </div>
  )
}
