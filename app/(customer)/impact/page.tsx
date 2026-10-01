import type { Metadata } from 'next'
import { ImpactView } from '@/components/customer/impact-view'

export const metadata: Metadata = { title: 'Your impact' }

export default function Page() {
  return <ImpactView />
}
