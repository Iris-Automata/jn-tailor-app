import { NextResponse } from 'next/server'
import { getOrders, addOrder, getCustomerById } from '@/lib/supabase'

export async function GET() {
  try {
    const orders = await getOrders()
    
    // Transform to match frontend expectations
    const transformed = orders.map(o => ({
      order_id: o.id,
      customer_id: o.customer_id,
      order_date: o.created_at?.split('T')[0] || '',
      garment_type: o.garment_type,
      service_type: o.service_type,
      order_details: o.order_details,
      quantity: o.quantity,
      unit_cost: o.unit_cost,
      tax_applied: o.tax_applied ? 'Yes' : 'No',
      status: o.status,
      expected_date: o.expected_date || '',
      payment_date: o.payment_date || '',
      completed_date: o.completed_date || '',
      picked_up_date: o.picked_up_date || '',
      notification_sent: o.notification_sent ? 'Yes' : 'No',
      reminder_sent: o.reminder_sent ? 'Yes' : 'No',
      internal_notes: o.internal_notes || '',
      rush_order: o.rush_order || false,
      paid: o.paid || false,
      paid_date: o.paid_date || '',
    }))
    
    return NextResponse.json(transformed)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const order = await addOrder({
      customer_id: body.customer_id,
      garment_type: body.garment_type,
      service_type: body.service_type,
      order_details: body.order_details,
      quantity: body.quantity || 1,
      unit_cost: body.unit_cost || 0,
      tax_applied: body.tax_applied === 'Yes' || body.tax_applied === true,
      expected_date: body.expected_date,
      payment_date: body.payment_date || null,
      internal_notes: body.internal_notes || '',
      rush_order: body.rush_order || false,
      paid: body.paid || false,
    })

    return NextResponse.json({
      order_id: order.id,
      customer_id: order.customer_id,
      order_date: order.created_at?.split('T')[0] || '',
      garment_type: order.garment_type,
      service_type: order.service_type,
      order_details: order.order_details,
      quantity: order.quantity,
      unit_cost: order.unit_cost,
      tax_applied: order.tax_applied ? 'Yes' : 'No',
      status: order.status,
      expected_date: order.expected_date || '',
      payment_date: order.payment_date || '',
      completed_date: order.completed_date || '',
      picked_up_date: order.picked_up_date || '',
      notification_sent: order.notification_sent ? 'Yes' : 'No',
      reminder_sent: order.reminder_sent ? 'Yes' : 'No',
      internal_notes: order.internal_notes || '',
      rush_order: order.rush_order || false,
      paid: order.paid || false,
      paid_date: order.paid_date || '',
    })
  } catch (error) {
    console.error('Error adding order:', error)
    return NextResponse.json({ error: 'Failed to add order' }, { status: 500 })
  }
}
