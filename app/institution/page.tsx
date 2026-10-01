import type { Metadata } from 'next'
import { InstitutionDashboardView } from '@/components/institution/institution-views'

export const metadata: Metadata = { title: 'Institution dashboard' }

export default function Page() {
  return <InstitutionDashboardView />
}
