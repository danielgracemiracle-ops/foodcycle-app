import type { Metadata } from 'next'
import { AdminInstitutionsView } from '@/components/admin/admin-tables'

export const metadata: Metadata = { title: 'Institutions' }

export default function Page() {
  return <AdminInstitutionsView />
}
