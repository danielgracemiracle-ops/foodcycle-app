import type { Metadata } from 'next'
import { SalesView } from '@/components/restaurant/sales-view'

export const metadata: Metadata = { title: 'Sales' }

export default function Page() {
  return <SalesView />
}
