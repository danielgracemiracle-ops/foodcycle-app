import type { Metadata } from 'next'
import { PaymentReturn } from '@/components/customer/checkout/payment-return'

export const metadata: Metadata = { title: 'Checking payment' }

export default async function PaymentReturnPage({ searchParams }: { searchParams: Promise<{ merchantOrderId?: string }> }) {
  const { merchantOrderId } = await searchParams
  return <PaymentReturn merchantOrderId={typeof merchantOrderId === 'string' ? merchantOrderId : ''} />
}
