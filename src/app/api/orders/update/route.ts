import { NextResponse } from 'next/server'
import { updateOrder } from '@/lib/supabase'

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { order_id, ...updates } = body

    if (!order_id) {
      return NextResponse.json({ error: 'Missing order_id' }, { status: 400 })
    }

    const success = await updateOrder(order_id, {
      garment_type: updates.garment_type,
      service_type: updates.service_type,
      order_details: updates.order_details,
      quantity: updates.quantity,
      unit_cost: updates.unit_cost,
      tax_applied: updates.tax_applied === 'Yes' || updates.tax_applied === true,
      expected_date: updates.expected_date,
      internal_notes: updates.internal_notes || '',
    })

    if (!success) {
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}
