import type { Metadata } from 'next'
import { AdminSettingsView } from '@/components/admin/admin-ops'

export const metadata: Metadata = { title: 'System settings' }

export default function Page() {
  return <AdminSettingsView />
}
