import 'server-only'
import type { Db, Donation, Order, OrderItem } from '@/types'
import { calculateGrade } from '@/lib/quality'
import { isPurchasable } from '@/lib/recommendation'
import { formatRupiah } from '@/lib/format'
import { commit, getDb, nextNumber, txQuery } from './services/mock-db'
import { confirmCheckout } from './services/stock-api'
import { notify, notifyAdmins, ServiceError, uid } from './services/utils'

/**
 * Not part of the client-callable services: fulfilment only runs after Duitku confirms the
 * money has arrived (signed callback or server-side status check).
 */

export function validateCart(db: Db, userId: string, stockHeld = false) {
  const cart = db.carts[userId] ?? []
  if (cart.length === 0) throw new ServiceError('Your cart is empty. Add at least one item to check out.')
  for (const item of cart) {
    const food = db.foods.find((f) => f.id === item.foodId)
    if (!food || !(stockHeld ? food.status === 'active' && new Date(food.pickupEnd).getTime() > Date.now() : isPurchasable(food)))
      throw new ServiceError(`${food?.name ?? 'An item'} is no longer available. Please remove it.`)
    if (!stockHeld && item.quantity > food.quantity) throw new ServiceError(`Only ${food.quantity} portion(s) of ${food.name} left.`)
  }
  return cart
}

/** Prices always come from the server's food records, never from the browser. */
export function cartTotal(db: Db, userId: string) {
  return (db.carts[userId] ?? []).reduce((s, c) => s + (db.foods.find((f) => f.id === c.foodId)?.price ?? 0) * c.quantity, 0)
}

export interface PaymentRow extends Record<string, unknown> {
  merchant_order_id: string
  user_id: string
  hold_key: string
  amount: number
  method_label: string
  status: 'pending' | 'paid' | 'failed' | 'unfulfilled'
  order_ids: string[]
  reference: string | null
}

export async function lockPayment(merchantOrderId: string) {
  const [row] = await txQuery<PaymentRow>('SELECT * FROM duitku_payments WHERE merchant_order_id = $1 FOR UPDATE', [merchantOrderId])
  return row
}

async function markUnfulfilled(row: PaymentRow, reason: string) {
  await txQuery("UPDATE duitku_payments SET status = 'unfulfilled', paid_at = now() WHERE merchant_order_id = $1", [row.merchant_order_id])
  commit((d) => {
    const paymentId = uid('pay')
    const now = new Date().toISOString()
    d.payments.unshift({
      id: paymentId,
      orderIds: [],
      userId: row.user_id,
      amount: row.amount,
      method: row.method_label,
      status: 'success',
      gatewayOrderId: row.merchant_order_id,
      gatewayReference: row.reference ?? undefined,
      createdAt: now,
    })
    d.refunds.unshift({ id: uid('rf'), paymentId, userId: row.user_id, orderId: row.merchant_order_id, amount: row.amount, reason, status: 'pending', createdAt: now })
    notify(d, row.user_id, 'order', 'Payment received, order not placed', `${reason} A full refund of ${formatRupiah(row.amount)} will be sent back to you.`, '/refunds')
    notifyAdmins(d, 'system', 'Refund needed', `${row.merchant_order_id}: ${formatRupiah(row.amount)} paid but not fulfilled. ${reason}`, '/admin/refunds')
  })
}

/**
 * Turns a verified Duitku payment into orders. Idempotent: the payment row is locked and
 * a row that is already settled returns its existing result.
 */
export async function fulfillPayment(merchantOrderId: string, verified: { amount: number; reference: string | null }) {
  const row = await lockPayment(merchantOrderId)
  if (!row) throw new ServiceError('Payment not found.')
  if (row.status === 'paid') return { status: 'paid' as const, orderIds: row.order_ids }
  if (row.status === 'unfulfilled') return { status: 'unfulfilled' as const, orderIds: [] }
  if (verified.reference) row.reference = verified.reference

  if (verified.amount !== row.amount) {
    console.error('[duitku] amount mismatch', merchantOrderId, verified.amount, row.amount)
    await markUnfulfilled(row, 'The paid amount did not match the order total.')
    return { status: 'unfulfilled' as const, orderIds: [] }
  }

  const db = getDb()
  const userId = row.user_id
  const user = db.users.find((u) => u.id === userId)
  const draft = db.checkoutDrafts[userId]
  if (!user || !draft || draft.holdKey !== row.hold_key) {
    await markUnfulfilled(row, 'Your cart changed while the payment was in progress.')
    return { status: 'unfulfilled' as const, orderIds: [] }
  }
  let cart
  try {
    cart = validateCart(db, userId, true)
  } catch (e) {
    await markUnfulfilled(row, e instanceof ServiceError ? e.message : 'An item became unavailable.')
    return { status: 'unfulfilled' as const, orderIds: [] }
  }
  if (cartTotal(db, userId) !== row.amount) {
    await markUnfulfilled(row, 'Prices changed while the payment was in progress.')
    return { status: 'unfulfilled' as const, orderIds: [] }
  }

  const byRestaurant = new Map<string, typeof cart>()
  for (const c of cart) {
    const restaurantId = db.foods.find((f) => f.id === c.foodId)!.restaurantId
    byRestaurant.set(restaurantId, [...(byRestaurant.get(restaurantId) ?? []), c])
  }
  const plannedIds: string[] = []
  for (const _ of byRestaurant.keys()) plannedIds.push(`ORD-${await nextNumber('order_number_seq')}`)
  const donationIds: string[] = []
  if (draft.type === 'donation' && draft.institutionId)
    for (const _ of byRestaurant.keys()) donationIds.push(`DON-${await nextNumber('donation_number_seq')}`)

  try {
    await confirmCheckout(row.hold_key, userId, plannedIds)
  } catch (e) {
    await markUnfulfilled(row, e instanceof ServiceError ? e.message : 'The stock reservation expired.')
    commit((d) => {
      d.checkoutDrafts[userId] = undefined
    })
    return { status: 'unfulfilled' as const, orderIds: [] }
  }

  const orderIds: string[] = []
  commit((d) => {
    const now = new Date().toISOString()
    const paymentId = uid('pay')

    for (const [index, [restaurantId, lines]] of [...byRestaurant].entries()) {
      const orderId = plannedIds[index]
      const items: OrderItem[] = lines.map((c) => {
        const food = d.foods.find((f) => f.id === c.foodId)!
        food.soldCount += c.quantity
        return {
          id: uid('oi'),
          foodId: food.id,
          name: food.name,
          image: food.image,
          price: food.price,
          originalPrice: food.originalPrice,
          quantity: c.quantity,
          grade: calculateGrade(food),
          category: food.category,
          weightKg: food.weightKg,
        }
      })
      const subtotal = items.reduce((s, i) => s + i.originalPrice * i.quantity, 0)
      const orderTotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
      const foods = lines.map((c) => d.foods.find((f) => f.id === c.foodId)!)
      const order: Order = {
        id: orderId,
        customerId: userId,
        restaurantId,
        items,
        type: draft.type,
        status: 'Payment Confirmed',
        history: [
          { status: 'Pending', at: now },
          { status: 'Payment Confirmed', at: now },
        ],
        subtotal,
        discount: subtotal - orderTotal,
        total: orderTotal,
        pickupStart: foods.reduce((a, f) => (f.pickupStart > a ? f.pickupStart : a), foods[0].pickupStart),
        pickupEnd: foods.reduce((a, f) => (f.pickupEnd < a ? f.pickupEnd : a), foods[0].pickupEnd),
        paymentId,
        reviewed: false,
        createdAt: now,
      }

      const restaurant = d.restaurants.find((r) => r.id === restaurantId)
      if (draft.type === 'donation' && draft.institutionId) {
        const donation: Donation = {
          id: donationIds[index],
          orderId,
          donorId: userId,
          restaurantId,
          institutionId: draft.institutionId,
          foodSummary: items.map((i) => i.name).join(', '),
          quantity: items.reduce((s, i) => s + i.quantity, 0),
          value: orderTotal,
          message: draft.message?.trim() || undefined,
          status: 'Purchased',
          history: [{ status: 'Purchased', at: now }],
          createdAt: now,
        }
        order.donationId = donation.id
        d.donations.unshift(donation)
        const inst = d.institutions.find((i) => i.id === draft.institutionId)
        notify(d, inst?.ownerId, 'donation', 'New donation available', `${donation.quantity}x ${donation.foodSummary} from ${restaurant?.name}. Please accept or decline.`, '/institution/donations')
      }

      d.orders.unshift(order)
      orderIds.push(orderId)
      notify(d, restaurant?.ownerId, 'order', 'New order received', `${orderId} — ${items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}.`, '/restaurant/orders')
      for (const food of foods)
        if (food.quantity > 0 && food.quantity <= 2)
          notify(d, restaurant?.ownerId, 'stock', 'Stock running low', `${food.name} has only ${food.quantity} portion(s) left.`, '/restaurant/listings')
    }

    d.payments.unshift({
      id: paymentId,
      orderIds,
      userId,
      amount: row.amount,
      method: row.method_label,
      status: 'success',
      gatewayOrderId: row.merchant_order_id,
      gatewayReference: row.reference ?? undefined,
      createdAt: now,
    })
    d.carts[userId] = []
    d.checkoutDrafts[userId] = undefined
    notify(d, userId, 'order', 'Payment successful', `${formatRupiah(row.amount)} paid via ${row.method_label}. ${orderIds.length > 1 ? `${orderIds.length} orders` : orderIds[0]} confirmed.`, `/orders/${orderIds[0]}`)
  })

  await txQuery("UPDATE duitku_payments SET status = 'paid', order_ids = $2, reference = $3, paid_at = now() WHERE merchant_order_id = $1", [
    merchantOrderId,
    orderIds,
    row.reference,
  ])
  return { status: 'paid' as const, orderIds }
}

export async function markPaymentFailed(merchantOrderId: string) {
  await txQuery("UPDATE duitku_payments SET status = 'failed' WHERE merchant_order_id = $1 AND status = 'pending'", [merchantOrderId])
}

/** Queues a manual refund for a paid order (Duitku has no refund API). */
export function queueRefund(d: Db, order: Order, reason: string) {
  const payment = d.payments.find((p) => p.id === order.paymentId)
  if (!payment || payment.status !== 'success') return
  if (d.refunds.some((r) => r.orderId === order.id)) return
  d.refunds.unshift({
    id: uid('rf'),
    orderId: order.id,
    paymentId: payment.id,
    userId: order.customerId,
    amount: order.total,
    reason,
    status: 'pending',
    createdAt: new Date().toISOString(),
  })
  notifyAdmins(d, 'system', 'Refund needed', `${order.id}: refund ${formatRupiah(order.total)} — ${reason}`, '/admin/refunds')
}
