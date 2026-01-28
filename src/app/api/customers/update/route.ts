import { NextResponse } from 'next/server'
import { updateCustomer } from '@/lib/supabase'

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { customer_id, ...updates } = body

    if (!customer_id) {
      return NextResponse.json({ error: 'Missing customer_id' }, { status: 400 })
    }

    const success = await updateCustomer(customer_id, {
      first_name: updates.first_name,
      last_name: updates.last_name,
      phone: updates.phone,
      email: updates.email,
      notes: updates.notes,
      notification_preference: updates.notification_preference,
    })

    if (!success) {
      return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating customer:', error)
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 })
  }
}
