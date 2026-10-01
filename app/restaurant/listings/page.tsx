import { Suspense } from 'react'
import { ListingsView } from '@/components/restaurant/listings-view'

export const metadata = { title: 'Food listings' }

export default function Page() {
  return (
    <Suspense>
      <ListingsView />
    </Suspense>
  )
}
