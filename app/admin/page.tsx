import type { Metadata } from 'next'
import { AdminDashboardView } from '@/components/admin/admin-dashboard'

export const metadata: Metadata = { title: 'Admin dashboard' }

export default function Page() {
  return <AdminDashboardView />
}
