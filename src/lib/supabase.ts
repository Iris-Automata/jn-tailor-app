import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Type definitions
export interface Customer {
  id: string
  business_id: string
  first_name: string
  last_name: string
  phone: string
  email: string
  notes: string
  notification_preference: string
  created_at: string
}

export interface Order {
  id: string
  business_id: string
  customer_id: string
  order_number: string
  garment_type: string
  service_type: string
  order_details: string
  quantity: number
  unit_cost: number
  tax_applied: boolean
  status: string
  expected_date: string
  payment_date: string
  completed_date: string
  picked_up_date: string
  notification_sent: boolean
  reminder_sent: boolean
  internal_notes: string
  rush_order: boolean
  paid: boolean
  paid_date: string
  created_at: string
}

// Hardcode JN Tailor's business ID for now
// Later this would come from auth/session
const BUSINESS_ID = 'b9d194d4-69ca-4078-8ded-60cc54343133'

// CUSTOMERS

export async function getCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('business_id', BUSINESS_ID)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function searchCustomers(query: string): Promise<Customer[]> {
  const customers = await getCustomers()
  const lowerQuery = query.toLowerCase()
  
  return customers.filter(customer => 
    customer.first_name.toLowerCase().includes(lowerQuery) ||
    customer.last_name.toLowerCase().includes(lowerQuery) ||
    customer.phone.includes(query)
  )
}

export async function getCustomerById(customerId: string): Promise<Customer | null> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .single()

  if (error) return null
  return data
}

export async function addCustomer(customer: Omit<Customer, 'id' | 'business_id' | 'created_at'>): Promise<Customer> {
  const { data, error } = await supabase
    .from('customers')
    .insert({
      business_id: BUSINESS_ID,
      first_name: customer.first_name,
      last_name: customer.last_name,
      phone: customer.phone,
      email: customer.email,
      notes: customer.notes,
      notification_preference: customer.notification_preference,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateCustomer(customerId: string, updates: Partial<Customer>): Promise<boolean> {
  const { error } = await supabase
    .from('customers')
    .update(updates)
    .eq('id', customerId)

  return !error
}

// ORDERS

export async function getOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('business_id', BUSINESS_ID)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getOrdersByStatus(status: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('business_id', BUSINESS_ID)
    .eq('status', status)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getOrdersByCustomerId(customerId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function addOrder(order: {
  customer_id: string
  garment_type: string
  service_type: string
  order_details: string
  quantity: number
  unit_cost: number
  tax_applied: boolean
  expected_date: string
  payment_date?: string
  internal_notes?: string
  rush_order?: boolean
  paid?: boolean
  paid_date?: string
}): Promise<Order> {
  // Generate a unique 7-digit order number
  const order_number = String(Math.floor(1000000 + Math.random() * 9000000))
  const today = new Date().toISOString().split('T')[0]
  
  const { data, error } = await supabase
    .from('orders')
    .insert({
      business_id: BUSINESS_ID,
      customer_id: order.customer_id,
      order_number,
      garment_type: order.garment_type,
      service_type: order.service_type,
      order_details: order.order_details,
      quantity: order.quantity,
      unit_cost: order.unit_cost,
      tax_applied: order.tax_applied,
      status: 'Received',
      expected_date: order.expected_date,
      payment_date: order.payment_date || null,
      internal_notes: order.internal_notes || '',
      notification_sent: false,
      reminder_sent: false,
      rush_order: order.rush_order || false,
      paid: order.paid || false,
      paid_date: order.paid ? today : null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateOrderStatus(orderId: string, newStatus: string): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0]
  
  // Get current order to check status
  const { data: currentOrder } = await supabase
    .from('orders')
    .select('status')
    .eq('id', orderId)
    .single()

  if (!currentOrder) return false

  const updates: Partial<Order> = { status: newStatus }

  // Handle date updates based on status transitions
  if (newStatus === 'Ready') {
    updates.completed_date = today
    updates.picked_up_date = null as any
  } else if (newStatus === 'Picked Up' && currentOrder.status === 'Ready') {
    updates.picked_up_date = today
  } else if (newStatus === 'Received') {
    updates.completed_date = null as any
    updates.picked_up_date = null as any
  }

  const { error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', orderId)

  return !error
}

export async function updateOrder(orderId: string, updates: Partial<Order>): Promise<boolean> {
  const { error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', orderId)

  return !error
}

export async function updatePaymentStatus(orderId: string, paymentDate: string | null): Promise<boolean> {
  const { error } = await supabase
    .from('orders')
    .update({ payment_date: paymentDate })
    .eq('id', orderId)

  return !error
}

export async function deleteOrder(orderId: string): Promise<boolean> {
  const { error } = await supabase
    .from('orders')
    .delete()
    .eq('id', orderId)

  return !error
}

// DASHBOARD STATS

export async function getOrderStats(): Promise<Record<string, number>> {
  const orders = await getOrders()
  
  return {
    received: orders.filter(o => o.status === 'Received').length,
    ready: orders.filter(o => o.status === 'Ready').length,
    picked_up: orders.filter(o => o.status === 'Picked Up').length,
    total: orders.length,
  }
}
