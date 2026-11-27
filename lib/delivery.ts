import type { Db, Order } from '@/types'

/** A packed donation order no courier has claimed yet. */
export function isOpenDeliveryJob(order: Order) {
  return order.type === 'donation' && order.status === 'Ready for Pickup' && !order.courierId
}

/** Where a courier's delivery stands: waiting at the restaurant, on the road, or handed over. */
export function deliveryStage(order: Order, db: Pick<Db, 'donations'>): 'pickup' | 'transit' | 'delivered' {
  if (order.status === 'Ready for Pickup') return 'pickup'
  const donation = db.donations.find((d) => d.id === order.donationId)
  if (order.status === 'Picked Up' && donation?.status === 'Picked Up') return 'transit'
  return 'delivered'
}

/** Donation orders owned by this courier, split into in-progress and finished. */
export function courierDeliveries(db: Pick<Db, 'orders' | 'donations'>, courierId: string) {
  const mine = db.orders
    .filter((o) => o.courierId === courierId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return {
    active: mine.filter((o) => deliveryStage(o, db) !== 'delivered' && o.status !== 'Cancelled'),
    done: mine.filter((o) => deliveryStage(o, db) === 'delivered' || o.status === 'Cancelled'),
  }
}
