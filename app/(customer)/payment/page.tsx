import type { Metadata } from 'next'
import { PaymentView } from '@/components/customer/checkout/payment-view'

export const metadata: Metadata = { title: 'Payment' }

export default function PaymentPage() {
  return <PaymentView />
}
