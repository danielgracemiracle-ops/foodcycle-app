import type { Metadata } from 'next'
import { CourierEarningsView } from '@/components/courier/courier-earnings'

export const metadata: Metadata = { title: 'Earnings' }

export default function Page() {
  return <CourierEarningsView />
}
