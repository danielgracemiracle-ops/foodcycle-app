import type { Metadata } from 'next'
import { CourierDashboardView } from '@/components/courier/courier-views'

export const metadata: Metadata = { title: 'Deliveries' }

export default function Page() {
  return <CourierDashboardView />
}
