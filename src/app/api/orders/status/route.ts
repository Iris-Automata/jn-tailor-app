import { NextResponse } from 'next/server'
import { updateOrderStatus, getOrders, getCustomerById } from '@/lib/supabase'

const N8N_WEBHOOK_URL = 'https://irisone.app.n8n.cloud/webhook/1cafaa3b-7b6c-4b14-b66d-afe631a6c755'
const TAX_RATE = 0.0825

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { order_id, status } = body

    if (!order_id || !status) {
      return NextResponse.json({ error: 'Missing order_id or status' }, { status: 400 })
    }

    // Update the order status in Supabase
    const success = await updateOrderStatus(order_id, status)
    
    if (!success) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // If status changed to "Ready", trigger notification via n8n
    if (status === 'Ready') {
      try {
        // Get order details
        const orders = await getOrders()
        const order = orders.find(o => o.id === order_id)
        
        if (order) {
          // Get customer details
          const customer = await getCustomerById(order.customer_id)
          
          // Calculate total cost
          const subtotal = order.unit_cost * order.quantity
          const total = order.tax_applied ? subtotal + (subtotal * TAX_RATE) : subtotal
          
          if (customer) {
            // Send data to n8n webhook
            await fetch(N8N_WEBHOOK_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                order_id: order.id,
                order_number: order.order_number,
                order_date: order.created_at?.split('T')[0] || '',
                customer_first_name: customer.first_name,
                customer_last_name: customer.last_name,
                customer_phone: customer.phone,
                customer_email: customer.email,
                notification_preference: customer.notification_preference,
                garment_type: order.garment_type,
                service_type: order.service_type,
                order_details: order.order_details,
                quantity: order.quantity,
                unit_cost: order.unit_cost,
                tax_applied: order.tax_applied,
                total_cost: Math.round(total * 100) / 100,
              }),
            })
          }
        }
      } catch (webhookError) {
        // Log webhook error but don't fail the status update
        console.error('Error triggering n8n webhook:', webhookError)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating order status:', error)
    return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 })
  }
}
