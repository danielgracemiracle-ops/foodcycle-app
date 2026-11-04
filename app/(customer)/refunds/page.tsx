import type { Metadata } from 'next'
import { RefundsView } from '@/components/customer/refunds-view'

export const metadata: Metadata = { title: 'My refunds' }

export default function RefundsPage() {
  return <RefundsView />
}
