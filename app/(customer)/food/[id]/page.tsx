import type { Metadata } from 'next'
import { FoodDetailView } from '@/components/customer/food-detail-view'

export const metadata: Metadata = { title: 'Food detail' }

export default async function FoodDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <FoodDetailView id={id} />
}
