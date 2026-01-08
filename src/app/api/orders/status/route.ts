import { NextResponse } from 'next/server'
import { updateOrderStatus } from '@/lib/sheets'

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { order_id, status } = body

    if (!order_id || !status) {
      return NextResponse.json({ error: 'Missing order_id or status' }, { status: 400 })
    }

    const success = await updateOrderStatus(order_id, status)
    
    if (!success) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating order status:', error)
    return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 })
  }
}
