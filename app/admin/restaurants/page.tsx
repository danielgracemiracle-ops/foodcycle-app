import type { Metadata } from 'next'
import { AdminRestaurantsView } from '@/components/admin/admin-tables'

export const metadata: Metadata = { title: 'Restaurants' }

export default function Page() {
  return <AdminRestaurantsView />
}
