import type { Metadata } from 'next'
import { AdminDonationsView } from '@/components/admin/admin-tables'

export const metadata: Metadata = { title: 'Donations' }

export default function Page() {
  return <AdminDonationsView />
}
