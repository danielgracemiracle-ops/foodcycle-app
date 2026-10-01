import type { Metadata } from 'next'
import { PaymentSuccess } from '@/components/customer/checkout/payment-success'

export const metadata: Metadata = { title: 'Payment successful' }

export default async function PaymentSuccessPage({ searchParams }: { searchParams: Promise<{ orders?: string }> }) {
  const { orders } = await searchParams
  return <PaymentSuccess orderIds={(orders ?? '').split(',').filter(Boolean)} />
}
