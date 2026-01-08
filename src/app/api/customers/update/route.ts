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
    const { customer_id, first_name, last_name, phone, email, notes } = body

    if (!customer_id) {
      return NextResponse.json({ error: 'Missing customer_id' }, { status: 400 })
    }

    // Get all customers to find the row
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Customers!A:G',
    })

    const rows = response.data.values
    if (!rows || rows.length < 2) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Find the row index (skip header)
    let rowIndex = -1
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === customer_id) {
        rowIndex = i
        break
      }
    }

    if (rowIndex === -1) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Row in sheet (1-indexed, +1 for header)
    const sheetRow = rowIndex + 1

    // Update the row (columns B through G: first_name, last_name, phone, email, created_date stays, notes)
    // We only update B, C, D, E, and G (skip F which is created_date)
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: [
          {
            range: `Customers!B${sheetRow}:E${sheetRow}`,
            values: [[first_name, last_name, phone, email]],
          },
          {
            range: `Customers!G${sheetRow}`,
            values: [[notes]],
          },
        ],
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating customer:', error)
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 })
  }
}
