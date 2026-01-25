import { google } from 'googleapis'

// Initialize Google Sheets API
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
})

const sheets = google.sheets({ version: 'v4', auth })
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID

// Type definitions
export interface Customer {
  customer_id: string
  first_name: string
  last_name: string
  phone: string
  email: string
  created_date: string
  notes: string
  notification_preference: string
}

export interface Order {
  order_id: string
  customer_id: string
  order_date: string
  garment_type: string
  service_type: string
  order_details: string
  quantity: number
  unit_cost: number
  tax_applied: string
  status: string
  expected_date: string
  payment_date: string
  completed_date: string
  picked_up_date: string
  notification_sent: string
  reminder_sent: string
  internal_notes: string
}

// Helper to convert row array to object
function rowToCustomer(row: string[], headers: string[]): Customer {
  const obj: Record<string, string> = {}
  headers.forEach((header, index) => {
    obj[header] = row[index] || ''
  })
  return obj as unknown as Customer
}

function rowToOrder(row: string[], headers: string[]): Order {
  const obj: Record<string, string | number> = {}
  headers.forEach((header, index) => {
    const value = row[index] || ''
    if (header === 'quantity' || header === 'unit_cost') {
      obj[header] = parseFloat(value) || 0
    } else {
      obj[header] = value
    }
  })
  return obj as unknown as Order
}

// CUSTOMERS
// Column order: A:customer_id, B:first_name, C:last_name, D:phone, E:email, F:created_date, G:notes, H:notification_preference

export async function getCustomers(): Promise<Customer[]> {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Customers!A:H',
  })

  const rows = response.data.values
  if (!rows || rows.length < 2) return []

  const headers = rows[0] as string[]
  return rows.slice(1).map(row => rowToCustomer(row as string[], headers))
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
  const customers = await getCustomers()
  return customers.find(c => c.customer_id === customerId) || null
}

export async function addCustomer(customer: Omit<Customer, 'customer_id' | 'created_date'>): Promise<Customer> {
  const customer_id = `C${Date.now()}`
  const created_date = new Date().toISOString().split('T')[0]
  
  const newCustomer: Customer = {
    customer_id,
    created_date,
    ...customer,
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Customers!A:H',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        newCustomer.customer_id,        // A
        newCustomer.first_name,         // B
        newCustomer.last_name,          // C
        newCustomer.phone,              // D
        newCustomer.email,              // E
        newCustomer.created_date,       // F
        newCustomer.notes,              // G
        newCustomer.notification_preference, // H
      ]],
    },
  })

  return newCustomer
}

// ORDERS
// Column order: A:order_id, B:customer_id, C:order_date, D:garment_type, E:service_type, 
// F:order_details, G:quantity, H:unit_cost, I:tax_applied, J:status, K:expected_date, 
// L:payment_date, M:completed_date, N:picked_up_date, O:notification_sent, P:reminder_sent, Q:internal_notes

export async function getOrders(): Promise<Order[]> {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Orders!A:Q',
  })

  const rows = response.data.values
  if (!rows || rows.length < 2) return []

  const headers = rows[0] as string[]
  return rows.slice(1).map(row => rowToOrder(row as string[], headers))
}

export async function getOrdersByStatus(status: string): Promise<Order[]> {
  const orders = await getOrders()
  return orders.filter(order => order.status === status)
}

export async function getOrdersByCustomerId(customerId: string): Promise<Order[]> {
  const orders = await getOrders()
  return orders.filter(order => order.customer_id === customerId)
}

export async function addOrder(order: Omit<Order, 'order_id' | 'order_date' | 'status' | 'completed_date' | 'picked_up_date' | 'notification_sent' | 'reminder_sent'>): Promise<Order> {
  // Generate a unique 7-digit order ID
  const existingOrders = await getOrders()
  const existingIds = new Set(existingOrders.map(o => o.order_id))
  
  let order_id: string
  do {
    order_id = String(Math.floor(1000000 + Math.random() * 9000000))
  } while (existingIds.has(order_id))
  
  const order_date = new Date().toISOString().split('T')[0]
  
  const newOrder: Order = {
    order_id,
    order_date,
    status: 'Received',
    completed_date: '',
    picked_up_date: '',
    notification_sent: 'No',
    reminder_sent: 'No',
    ...order,
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Orders!A:Q',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        newOrder.order_id,          // A
        newOrder.customer_id,       // B
        newOrder.order_date,        // C
        newOrder.garment_type,      // D
        newOrder.service_type,      // E
        newOrder.order_details,     // F
        newOrder.quantity,          // G
        newOrder.unit_cost,         // H
        newOrder.tax_applied,       // I
        newOrder.status,            // J
        newOrder.expected_date,     // K
        newOrder.payment_date,      // L
        newOrder.completed_date,    // M
        newOrder.picked_up_date,    // N
        newOrder.notification_sent, // O
        newOrder.reminder_sent,     // P
        newOrder.internal_notes,    // Q
      ]],
    },
  })

  return newOrder
}

export async function updateOrderStatus(orderId: string, newStatus: string): Promise<boolean> {
  const orders = await getOrders()
  const orderIndex = orders.findIndex(o => String(o.order_id) === String(orderId))
  
  if (orderIndex === -1) return false

  const currentOrder = orders[orderIndex]
  const currentStatus = currentOrder.status

  // Row index + 2 (1 for header, 1 for 0-based to 1-based)
  const sheetRow = orderIndex + 2
  const today = new Date().toISOString().split('T')[0]
  
  // Update status (column J)
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `Orders!J${sheetRow}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[newStatus]],
    },
  })

  // Handle date updates based on status transitions
  if (newStatus === 'Ready') {
    // Set completed_date when marking as Ready (column M)
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Orders!M${sheetRow}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[today]],
      },
    })
    // Clear picked_up_date if going back to Ready (column N)
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Orders!N${sheetRow}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [['']],
      },
    })
  } else if (newStatus === 'Picked Up') {
    // Only set picked_up_date if coming from Ready status (column N)
    if (currentStatus === 'Ready') {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `Orders!N${sheetRow}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[today]],
        },
      })
    }
  } else if (newStatus === 'Received') {
    // Going back to Received - clear both dates (columns M and N)
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Orders!M${sheetRow}:N${sheetRow}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [['', '']],
      },
    })
  }

  return true
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
