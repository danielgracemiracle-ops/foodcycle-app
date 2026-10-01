import type { Metadata } from 'next'
import { AdminFoodsView } from '@/components/admin/admin-tables'

export const metadata: Metadata = { title: 'Food listings' }

export default function Page() {
  return <AdminFoodsView />
}
