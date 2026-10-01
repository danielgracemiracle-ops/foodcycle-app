import type { Metadata } from 'next'
import { InstitutionDonationsView } from '@/components/institution/institution-views'

export const metadata: Metadata = { title: 'Donations' }

export default function Page() {
  return <InstitutionDonationsView />
}
