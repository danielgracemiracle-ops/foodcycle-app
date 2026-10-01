import type { Metadata } from 'next'
import { ReviewsView } from '@/components/restaurant/reviews-view'

export const metadata: Metadata = { title: 'Reviews' }

export default function Page() {
  return <ReviewsView />
}
