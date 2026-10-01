import type { Metadata } from 'next'
import { FavoritesView } from '@/components/customer/favorites-view'

export const metadata: Metadata = { title: 'Favorites' }

export default function Page() {
  return <FavoritesView />
}
