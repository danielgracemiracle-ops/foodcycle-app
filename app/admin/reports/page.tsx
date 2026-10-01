import type { Metadata } from 'next'
import { AdminReportsView } from '@/components/admin/admin-ops'

export const metadata: Metadata = { title: 'Reports' }

export default function Page() {
  return <AdminReportsView />
}
