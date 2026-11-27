import type { Db, Order, Restaurant } from '@/types'
import { deliveryStage } from './delivery'

export const DELIVERY_BASE_FEE = 8000
export const DELIVERY_FEE_PER_KM = 2000
/** Share of the delivery fee the courier keeps; FoodCycle keeps the rest for payment and platform costs. */
export const COURIER_SHARE = 0.9
export const MIN_PAYOUT = 50_000

/** One fee per restaurant pickup, priced by distance. */
export function deliveryFeeFor(restaurant: Pick<Restaurant, 'distanceKm'> | undefined) {
  const km = Math.max(1, Math.ceil(restaurant?.distanceKm ?? 1))
  return DELIVERY_BASE_FEE + DELIVERY_FEE_PER_KM * km
}

export const courierEarning = (order: Pick<Order, 'deliveryFee'>) => Math.floor((order.deliveryFee ?? 0) * COURIER_SHARE)

/** Delivery fees for a donation checkout: one per restaurant in the cart. */
export function donationDeliveryFees(restaurantIds: Iterable<string>, restaurants: Pick<Restaurant, 'id' | 'distanceKm'>[]) {
  let total = 0
  for (const id of new Set(restaurantIds)) total += deliveryFeeFor(restaurants.find((r) => r.id === id))
  return total
}

type BalanceDb = Pick<Db, 'orders' | 'donations' | 'courierPayouts'>

export function courierEarnings(db: BalanceDb, courierId: string) {
  return db.orders.filter(
    (o) => o.courierId === courierId && o.status !== 'Cancelled' && (o.deliveryFee ?? 0) > 0 && deliveryStage(o, db) === 'delivered',
  )
}

export function courierBalance(db: BalanceDb, courierId: string) {
  const earned = courierEarnings(db, courierId).reduce((s, o) => s + courierEarning(o), 0)
  const payouts = (db.courierPayouts ?? []).filter((p) => p.userId === courierId)
  const paid = payouts.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0)
  const requested = payouts.filter((p) => p.status === 'requested').reduce((s, p) => s + p.amount, 0)
  return { earned, paid, requested, available: earned - paid - requested }
}
