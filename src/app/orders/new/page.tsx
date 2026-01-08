import Link from 'next/link'

export default function NewOrderPage() {
  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <Link href="/orders" className="text-sm text-taupe hover:text-rust transition-colors">
          ← Back to Orders
        </Link>
        <h1 className="font-display text-3xl mt-4 mb-2">New Order</h1>
        <p className="text-taupe">Create a new alteration order</p>
      </div>

      {/* Form */}
      <form className="space-y-6">
        {/* Customer Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Customer</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search for customer..."
              className="input-field"
              required
            />
          </div>
          <p className="text-sm text-taupe mt-2">
            Can't find customer?{' '}
            <Link href="/customers/new" className="text-rust hover:underline">
              Add new customer
            </Link>
          </p>
        </div>

        {/* Garment & Service */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Garment Type</label>
            <select name="garment_type" className="input-field" required>
              <option value="">Select garment...</option>
              <option value="pants">Pants</option>
              <option value="jacket">Jacket</option>
              <option value="shirt">Shirt</option>
              <option value="dress">Dress</option>
              <option value="skirt">Skirt</option>
              <option value="suit">Suit</option>
              <option value="coat">Coat</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Service Type</label>
            <select name="service_type" className="input-field" required>
              <option value="">Select service...</option>
              <option value="hem">Hem</option>
              <option value="taper">Taper</option>
              <option value="take_in">Take In</option>
              <option value="let_out">Let Out</option>
              <option value="shorten">Shorten</option>
              <option value="lengthen">Lengthen</option>
              <option value="repair">Repair</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>

        {/* Order Details */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Order Details & Measurements
          </label>
          <textarea
            name="order_details"
            rows={4}
            className="input-field resize-none"
            placeholder="Describe the work needed, include measurements..."
            required
          />
        </div>

        {/* Quantity */}
        <div className="w-32">
          <label className="block text-sm font-medium mb-2">Quantity</label>
          <input
            type="number"
            name="quantity"
            min="1"
            defaultValue="1"
            className="input-field"
            required
          />
        </div>

        {/* Cost & Date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Cost ($)</label>
            <input
              type="number"
              name="cost"
              min="0"
              step="0.01"
              className="input-field"
              placeholder="0.00"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Expected Ready Date</label>
            <input
              type="date"
              name="expected_date"
              className="input-field"
              required
            />
          </div>
        </div>

        {/* Internal Notes */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Internal Notes <span className="text-taupe font-normal">(optional)</span>
          </label>
          <textarea
            name="internal_notes"
            rows={2}
            className="input-field resize-none"
            placeholder="Notes for staff only..."
          />
        </div>

        <div className="flex gap-4 pt-4">
          <button type="submit" className="btn-primary">
            Create Order
          </button>
          <Link href="/orders" className="btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
