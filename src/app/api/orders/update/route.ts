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
    const { order_id, garment_type, service_type, order_details, quantity, cost, expected_date, internal_notes } = body

    if (!order_id) {
      return NextResponse.json({ error: 'Missing order_id' }, { status: 400 })
    }

    // Get all orders to find the row
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Orders!A:P',
    })

    const rows = response.data.values
    if (!rows || rows.length < 2) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Find the row index (skip header)
    let rowIndex = -1
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === order_id) {
        rowIndex = i
        break
      }
    }

    if (rowIndex === -1) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Row in sheet (1-indexed)
    const sheetRow = rowIndex + 1

    // Update columns D through H (garment_type, service_type, order_details, quantity, cost)
    // and J (expected_date) and P (internal_notes)
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: [
          {
            range: `Orders!D${sheetRow}:H${sheetRow}`,
            values: [[garment_type, service_type, order_details, quantity, cost]],
          },
          {
            range: `Orders!J${sheetRow}`,
            values: [[expected_date]],
          },
          {
            range: `Orders!P${sheetRow}`,
            values: [[internal_notes]],
          },
        ],
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}
