import { NextResponse } from 'next/server'
import { updatePaymentStatus } from '@/lib/supabase'

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { order_id, payment_date } = body

    if (!order_id) {
      return NextResponse.json({ error: 'Missing order_id' }, { status: 400 })
    }

    const success = await updatePaymentStatus(order_id, payment_date || null)

    if (!success) {
      return NextResponse.json({ error: 'Failed to update payment status' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating payment status:', error)
    return NextResponse.json({ error: 'Failed to update payment status' }, { status: 500 })
  }
}
