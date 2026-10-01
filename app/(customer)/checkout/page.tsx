import type { Metadata } from 'next'
import { CheckoutView } from '@/components/customer/checkout/checkout-view'

export const metadata: Metadata = { title: 'Checkout' }

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams
  return <CheckoutView initialType={type === 'donation' ? 'donation' : 'self'} />
}
