'use client'

import { useState, useEffect } from 'react'

const BUSINESS_SLUG = 'jn-tailor'
const SUPABASE_URL = 'https://bnytdgxgedktxlzyjbjp.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJueXRkZ3hnZWRrdHhsenlqYmpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc1MTcwNTIsImV4cCI6MjA1MzA5MzA1Mn0.tOGR1v-Jkg0ORgvT1F_VaCA_gGPvNFcdaJXHKWY8S5c'

const GARMENT_OPTIONS = ['Pants', 'Shirt', 'Dress', 'Suit', 'Jacket', 'Skirt', 'Coat', 'Other']
const SERVICE_OPTIONS = ['Hem', 'Taper', 'Repair', 'Shorten', 'Lengthen', 'Take In', 'Let Out', 'Zipper', 'Other']

export default function IntakeFormPage() {
  const [businessName, setBusinessName] = useState('Order Intake Form')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    garment_type: '',
    custom_garment: '',
    service_type: '',
    custom_service: '',
    order_details: '',
    sms_consent: false,
  })

  useEffect(() => {
    fetchBusinessName()
  }, [])

  async function fetchBusinessName() {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/businesses?slug=eq.${BUSINESS_SLUG}&select=name`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Content-Type': 'application/json'
          }
        }
      )
      const data = await response.json()
      
      if (data && data.length > 0) {
        setBusinessName(data[0].name)
      }
    } catch (err) {
      console.error('Error fetching business:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    // Validate
    if (!form.first_name || !form.last_name || !form.phone || !form.garment_type || !form.service_type) {
      setError('Please fill in all required fields')
      return
    }

    if (form.garment_type === 'Other' && !form.custom_garment) {
      setError('Please specify the garment type')
      return
    }

    if (form.service_type === 'Other' && !form.custom_service) {
      setError('Please specify the service type')
      return
    }

    setSubmitting(true)

    const finalGarmentType = form.garment_type === 'Other' ? form.custom_garment : form.garment_type
    const finalServiceType = form.service_type === 'Other' ? form.custom_service : form.service_type

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/intake-submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_slug: BUSINESS_SLUG,
          first_name: form.first_name,
          last_name: form.last_name,
          phone: form.phone,
          email: form.email,
          garment_type: finalGarmentType,
          service_type: finalServiceType,
          order_details: form.order_details,
          sms_consent: form.sms_consent
        })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
      } else {
        setError(data.error || 'Failed to submit order. Please try again.')
      }
    } catch (err) {
      console.error('Submit error:', err)
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function resetForm() {
    setForm({
      first_name: '',
      last_name: '',
      phone: '',
      email: '',
      garment_type: '',
      custom_garment: '',
      service_type: '',
      custom_service: '',
      order_details: '',
      sms_consent: false,
    })
    setSuccess(false)
    setError('')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-taupe/30 border-t-sage rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-charcoal">Loading...</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-sage rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-soulsonic" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="font-display text-3xl text-offwhite mb-4">Order Submitted!</h1>
          <p className="text-charcoal mb-8">
            Thank you! {businessName} has received your order request and will review it shortly.
            <br /><br />
            You'll be contacted when your order is ready.
          </p>
          <button
            onClick={resetForm}
            className="btn-secondary"
          >
            Submit Another Order
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-display text-2xl text-offwhite mb-2">{businessName}</h1>
          <p className="text-charcoal">Submit your alteration request</p>
        </div>

        {/* Form Card */}
        <div className="card">
          <h2 className="font-display text-lg text-offwhite mb-6">Your Information</h2>

          {error && (
            <div className="bg-red/20 text-red p-3 rounded-sm mb-4 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-charcoal mb-1">
                  First Name <span className="text-red">*</span>
                </label>
                <input
                  type="text"
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  className="input-field"
                  placeholder="John"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-charcoal mb-1">
                  Last Name <span className="text-red">*</span>
                </label>
                <input
                  type="text"
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  className="input-field"
                  placeholder="Doe"
                  required
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm text-charcoal mb-1">
                Phone Number <span className="text-red">*</span>
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="input-field"
                placeholder="(555) 123-4567"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm text-charcoal mb-1">
                Email <span className="text-charcoal/50">(optional)</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input-field"
                placeholder="john@email.com"
              />
            </div>

            <h2 className="font-display text-lg text-offwhite pt-4">Order Details</h2>

            {/* Garment & Service Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-charcoal mb-1">
                  Garment Type <span className="text-red">*</span>
                </label>
                <select
                  value={form.garment_type}
                  onChange={(e) => setForm({ ...form, garment_type: e.target.value, custom_garment: '' })}
                  className="input-field"
                  required
                >
                  <option value="">Select...</option>
                  {GARMENT_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                {form.garment_type === 'Other' && (
                  <input
                    type="text"
                    value={form.custom_garment}
                    onChange={(e) => setForm({ ...form, custom_garment: e.target.value })}
                    className="input-field mt-2"
                    placeholder="Specify garment..."
                    required
                  />
                )}
              </div>
              <div>
                <label className="block text-sm text-charcoal mb-1">
                  Service Type <span className="text-red">*</span>
                </label>
                <select
                  value={form.service_type}
                  onChange={(e) => setForm({ ...form, service_type: e.target.value, custom_service: '' })}
                  className="input-field"
                  required
                >
                  <option value="">Select...</option>
                  {SERVICE_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                {form.service_type === 'Other' && (
                  <input
                    type="text"
                    value={form.custom_service}
                    onChange={(e) => setForm({ ...form, custom_service: e.target.value })}
                    className="input-field mt-2"
                    placeholder="Specify service..."
                    required
                  />
                )}
              </div>
            </div>

            {/* Additional Details */}
            <div>
              <label className="block text-sm text-charcoal mb-1">
                Additional Details <span className="text-charcoal/50">(optional)</span>
              </label>
              <textarea
                value={form.order_details}
                onChange={(e) => setForm({ ...form, order_details: e.target.value })}
                className="input-field resize-none"
                rows={3}
                placeholder="Any specific instructions or measurements..."
              />
            </div>

            {/* SMS Consent */}
            <div className="bg-soulsonic/50 p-4 rounded-sm">
              <p className="text-sm text-offwhite mb-3">
                SMS Notifications <span className="text-charcoal">(optional)</span>
              </p>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.sms_consent}
                  onChange={(e) => setForm({ ...form, sms_consent: e.target.checked })}
                  className="w-5 h-5 mt-0.5 accent-sage"
                />
                <span className="text-xs text-charcoal leading-relaxed">
                  Yes, I would like to receive SMS notifications about my order status from JN Tailor & Alterations. 
                  Message and data rates may apply. Message frequency varies. 
                  Reply STOP to unsubscribe or HELP for help. 
                  View our <a href="https://irisautomata.com/privacy-policy/" target="_blank" className="text-sage underline">Privacy Policy</a> and <a href="https://irisautomata.com/terms-of-service/" target="_blank" className="text-sage underline">Terms of Service</a>.
                </span>
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full btn-primary disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Order Request'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-xs text-charcoal">
          Powered by <a href="https://irisautomata.com" target="_blank" className="hover:text-offwhite transition-colors">Iris Automata</a>
        </div>
      </div>
    </div>
  )
}
