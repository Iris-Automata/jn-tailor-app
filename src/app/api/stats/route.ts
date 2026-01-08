import { NextResponse } from 'next/server'
import { getOrderStats } from '@/lib/sheets'

export async function GET() {
  try {
    const stats = await getOrderStats()
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
