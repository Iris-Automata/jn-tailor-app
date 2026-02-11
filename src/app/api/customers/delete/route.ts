import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function DELETE(request: Request) {
  try {
    const { customer_id } = await request.json()

    if (!customer_id) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 })
    }

    // First delete all orders for this customer
    const { error: ordersError } = await supabase
      .from('orders')
      .delete()
      .eq('customer_id', customer_id)

    if (ordersError) {
      console.error('Error deleting customer orders:', ordersError)
      return NextResponse.json({ error: 'Failed to delete customer orders' }, { status: 500 })
    }

    // Then delete the customer
    const { error: customerError } = await supabase
      .from('customers')
      .delete()
      .eq('customer_id', customer_id)

    if (customerError) {
      console.error('Error deleting customer:', customerError)
      return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete customer error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
