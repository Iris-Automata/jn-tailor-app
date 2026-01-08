# JN Tailor & Alterations App

A custom order management system for JN Tailor & Alterations, built with Next.js and powered by Iris Automata.

## Features

- **Customer Management**: Add, search, and manage customer records
- **Order Tracking**: Create and track alteration orders through their lifecycle
- **Status Workflow**: Received → In Progress → Ready → Picked Up
- **Google Sheets Backend**: All data syncs with your existing Google Sheet

## Tech Stack

- **Next.js 14** - React framework
- **Tailwind CSS** - Styling
- **Google Sheets API** - Database backend
- **Vercel** - Hosting (recommended)

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Google Sheets API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use existing)
3. Enable the Google Sheets API
4. Create a Service Account:
   - Go to APIs & Services → Credentials
   - Click "Create Credentials" → "Service Account"
   - Download the JSON key file
5. Share your Google Sheet with the service account email

### 3. Configure Environment Variables

Create a `.env.local` file:

```
GOOGLE_SHEETS_PRIVATE_KEY="your-private-key-from-json"
GOOGLE_SHEETS_CLIENT_EMAIL="your-service-account@project.iam.gserviceaccount.com"
GOOGLE_SHEETS_SPREADSHEET_ID="your-spreadsheet-id-from-url"
```

The spreadsheet ID is the long string in your Google Sheets URL:
`https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit`

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Deploy to Vercel

1. Push your code to GitHub
2. Connect the repo to [Vercel](https://vercel.com)
3. Add your environment variables in Vercel's project settings
4. Deploy!

## Project Structure

```
src/
├── app/
│   ├── layout.tsx        # Root layout with nav
│   ├── page.tsx           # Dashboard
│   ├── customers/
│   │   ├── page.tsx       # Customer list
│   │   └── new/
│   │       └── page.tsx   # New customer form
│   └── orders/
│       ├── page.tsx       # Order list
│       └── new/
│           └── page.tsx   # New order form
├── components/            # Reusable components
└── lib/
    └── sheets.ts          # Google Sheets API utilities
```

## Next Steps

- [ ] Connect Google Sheets API
- [ ] Implement customer search
- [ ] Add order creation with customer lookup
- [ ] Set up n8n for SMS notifications
- [ ] Add order status updates

---

Powered by **Iris Automata**
