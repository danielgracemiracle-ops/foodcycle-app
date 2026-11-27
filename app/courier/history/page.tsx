import type { Metadata } from 'next'
import { CourierHistoryView } from '@/components/courier/courier-views'

export const metadata: Metadata = { title: 'Delivery history' }

export default function Page() {
  return <CourierHistoryView />
}
