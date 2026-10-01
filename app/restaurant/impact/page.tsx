import type { Metadata } from 'next'
import { RestaurantImpactView } from '@/components/restaurant/impact-view'

export const metadata: Metadata = { title: 'Impact' }

export default function Page() {
  return <RestaurantImpactView />
}
