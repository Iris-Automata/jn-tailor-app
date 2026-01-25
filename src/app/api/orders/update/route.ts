import { NextResponse } from 'next/server'
import { google } from 'googleapis'

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
})

const sheets = google.sheets({ version: 'v4', auth })
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { 
      order_id, 
      garment_type, 
      service_type, 
      order_details, 
      quantity, 
      unit_cost,
      tax_applied,
      expected_date, 
      internal_notes 
    } = body

    if (!order_id) {
      return NextResponse.json({ error: 'Missing order_id' }, { status: 400 })
    }

    // Get all orders to find the row
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Orders!A:Q',
    })

    const rows = response.data.values
    if (!rows || rows.length < 2) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Find the row index (skip header)
    let rowIndex = -1
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) === String(order_id)) {
        rowIndex = i + 1 // +1 for 1-based indexing
        break
      }
    }

    if (rowIndex === -1) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Update columns D-I (garment_type, service_type, order_details, quantity, unit_cost, tax_applied)
    // and K (expected_date) and Q (internal_notes)
    
    // Update D:I (garment_type through tax_applied)
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Orders!D${rowIndex}:I${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[garment_type, service_type, order_details, quantity, unit_cost, tax_applied]],
      },
    })

    // Update K (expected_date)
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Orders!K${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[expected_date]],
      },
    })

    // Update Q (internal_notes)
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Orders!Q${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[internal_notes || '']],
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}
