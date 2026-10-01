import type { Metadata } from 'next'
import { OrderDetailView } from '@/components/customer/orders/order-detail-view'

export const metadata: Metadata = { title: 'Order detail' }

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <OrderDetailView id={id} />
}
