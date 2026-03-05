// PayChangu Payment Integration
// Docs: https://paychangu.readme.io

const PAYCHANGU_SECRET = import.meta.env.VITE_PAYCHANGU_SECRET_KEY || ''
const PAYCHANGU_PUBLIC = import.meta.env.VITE_PAYCHANGU_PUBLIC_KEY || ''
const BASE_URL = 'https://api.paychangu.com'

export const PREMIUM_PLANS = {
  monthly: {
    id: 'premium-monthly',
    label: 'Monthly Plan',
    price: 2500, // MWK
    currency: 'MWK',
    description: 'Full premium access for 1 month',
    features: [
      'AI Exercise & Flashcard Generator',
      'Practical Experiment Visualizations',
      'AI Tutor',
      'Advanced Progress Analytics',
      'Custom Profile Picture',
    ]
  },
  termly: {
    id: 'premium-termly',
    label: 'School Term Plan',
    price: 6000, // MWK
    currency: 'MWK',
    description: 'Full premium access for one school term (~3 months)',
    features: [
      'Everything in Monthly',
      'Save 20% vs monthly',
      'Priority support',
    ]
  }
}

export interface PaymentPayload {
  amount: number
  currency: string
  email: string
  first_name: string
  last_name: string
  callback_url: string
  return_url: string
  tx_ref: string
  customization: {
    title: string
    description: string
    logo?: string
  }
}

export async function initiatePayment(payload: PaymentPayload): Promise<{ payment_url: string } | null> {
  try {
    const res = await fetch(`${BASE_URL}/payment/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PAYCHANGU_SECRET}`,
      },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error('Payment init failed')
    const data = await res.json()
    return data.data
  } catch (err) {
    console.error('PayChangu error:', err)
    return null
  }
}

export function generateTxRef(userId: string, plan: string): string {
  return `msce-${userId.slice(0, 8)}-${plan}-${Date.now()}`
}
