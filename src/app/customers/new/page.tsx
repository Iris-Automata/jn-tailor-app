import Link from 'next/link'

export default function NewCustomerPage() {
  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <Link href="/customers" className="text-sm text-taupe hover:text-rust transition-colors">
          ← Back to Customers
        </Link>
        <h1 className="font-display text-3xl mt-4 mb-2">New Customer</h1>
        <p className="text-taupe">Add a new customer to your records</p>
      </div>

      {/* Form */}
      <form className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">First Name</label>
            <input
              type="text"
              name="first_name"
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Last Name</label>
            <input
              type="text"
              name="last_name"
              className="input-field"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Phone Number</label>
          <input
            type="tel"
            name="phone"
            className="input-field"
            placeholder="(555) 123-4567"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Email <span className="text-taupe font-normal">(optional)</span>
          </label>
          <input
            type="email"
            name="email"
            className="input-field"
            placeholder="customer@email.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Notes <span className="text-taupe font-normal">(optional)</span>
          </label>
          <textarea
            name="notes"
            rows={3}
            className="input-field resize-none"
            placeholder="Preferences, special requests, etc."
          />
        </div>

        <div className="flex gap-4 pt-4">
          <button type="submit" className="btn-primary">
            Add Customer
          </button>
          <Link href="/customers" className="btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
