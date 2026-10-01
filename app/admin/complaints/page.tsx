import type { Metadata } from 'next'
import { AdminComplaintsView } from '@/components/admin/admin-ops'

export const metadata: Metadata = { title: 'Complaints' }

export default function Page() {
  return <AdminComplaintsView />
}
