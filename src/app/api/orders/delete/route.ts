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

export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const { order_id } = body

    console.log('DELETE request received for order_id:', order_id)

    if (!order_id) {
      return NextResponse.json({ error: 'Missing order_id' }, { status: 400 })
    }

    // Get all orders to find the row
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Orders!A:P',
    })

    const rows = response.data.values
    console.log('Total rows found:', rows?.length)
    console.log('First few order IDs in sheet:', rows?.slice(1, 5).map(r => r[0]))

    if (!rows || rows.length < 2) {
      return NextResponse.json({ error: 'No orders found' }, { status: 404 })
    }

    // Find the row index
    let rowIndex = -1
    for (let i = 1; i < rows.length; i++) {
      console.log(`Comparing: "${rows[i][0]}" with "${order_id}"`)
      if (String(rows[i][0]) === String(order_id)) {
        rowIndex = i
        break
      }
    }

    console.log('Found rowIndex:', rowIndex)

    if (rowIndex === -1) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Get spreadsheet info to find the Orders sheet ID
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    })

    const ordersSheet = spreadsheet.data.sheets?.find(
      (sheet) => sheet.properties?.title === 'Orders'
    )

    if (!ordersSheet?.properties?.sheetId && ordersSheet?.properties?.sheetId !== 0) {
      return NextResponse.json({ error: 'Orders sheet not found' }, { status: 404 })
    }

    const sheetId = ordersSheet.properties.sheetId

    // Delete the row
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheetId,
                dimension: 'ROWS',
                startIndex: rowIndex,
                endIndex: rowIndex + 1,
              },
            },
          },
        ],
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting order:', error)
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 })
  }
}
