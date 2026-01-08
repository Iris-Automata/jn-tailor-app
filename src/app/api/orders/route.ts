import { NextResponse } from 'next/server'
import { getOrders, addOrder } from '@/lib/sheets'

export async function GET() {
  try {
    const orders = await getOrders()
    return NextResponse.json(orders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const order = await addOrder(body)
    return NextResponse.json(order)
  } catch (error) {
    console.error('Error adding order:', error)
    return NextResponse.json({ error: 'Failed to add order' }, { status: 500 })
  }
}
