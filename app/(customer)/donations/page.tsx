import type { Metadata } from 'next'
import { DonationsView } from '@/components/customer/donations-view'

export const metadata: Metadata = { title: 'My donations' }

export default function Page() {
  return <DonationsView />
}
