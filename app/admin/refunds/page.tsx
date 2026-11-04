import type { Metadata } from 'next'
import { AdminRefundsView } from '@/components/admin/admin-refunds'

export const metadata: Metadata = { title: 'Refunds' }

export default function Page() {
  return <AdminRefundsView />
}
