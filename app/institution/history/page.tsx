import type { Metadata } from 'next'
import { InstitutionHistoryView } from '@/components/institution/institution-views'

export const metadata: Metadata = { title: 'Donation history' }

export default function Page() {
  return <InstitutionHistoryView />
}
