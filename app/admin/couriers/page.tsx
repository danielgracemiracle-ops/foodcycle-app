import type { Metadata } from 'next'
import { AdminCouriersView } from '@/components/admin/admin-couriers'

export const metadata: Metadata = { title: 'Couriers' }

export default function Page() {
  return <AdminCouriersView />
}
