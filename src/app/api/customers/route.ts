import { NextResponse } from 'next/server'
import { getCustomers, addCustomer } from '@/lib/sheets'

export async function GET() {
  try {
    const customers = await getCustomers()
    return NextResponse.json(customers)
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const customer = await addCustomer(body)
    return NextResponse.json(customer)
  } catch (error) {
    console.error('Error adding customer:', error)
    return NextResponse.json({ error: 'Failed to add customer' }, { status: 500 })
  }
}
