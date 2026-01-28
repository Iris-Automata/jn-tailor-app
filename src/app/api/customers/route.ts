import { NextResponse } from 'next/server'
import { getCustomers, addCustomer } from '@/lib/supabase'

export async function GET() {
  try {
    const customers = await getCustomers()
    
    // Transform to match frontend expectations
    const transformed = customers.map(c => ({
      customer_id: c.id,
      first_name: c.first_name,
      last_name: c.last_name,
      phone: c.phone,
      email: c.email,
      notes: c.notes,
      notification_preference: c.notification_preference,
      created_date: c.created_at?.split('T')[0] || '',
    }))
    
    return NextResponse.json(transformed)
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const customer = await addCustomer({
      first_name: body.first_name,
      last_name: body.last_name,
      phone: body.phone,
      email: body.email || '',
      notes: body.notes || '',
      notification_preference: body.notification_preference || 'SMS',
    })

    return NextResponse.json({
      customer_id: customer.id,
      first_name: customer.first_name,
      last_name: customer.last_name,
      phone: customer.phone,
      email: customer.email,
      notes: customer.notes,
      notification_preference: customer.notification_preference,
      created_date: customer.created_at?.split('T')[0] || '',
    })
  } catch (error) {
    console.error('Error adding customer:', error)
    return NextResponse.json({ error: 'Failed to add customer' }, { status: 500 })
  }
}
