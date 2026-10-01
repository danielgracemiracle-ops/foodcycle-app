import type { Metadata } from 'next'
import { AdminUsersView } from '@/components/admin/admin-tables'

export const metadata: Metadata = { title: 'Users' }

export default function Page() {
  return <AdminUsersView />
}
