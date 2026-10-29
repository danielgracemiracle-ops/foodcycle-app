import type { CheckoutDraft, Db, Donation, DonationStatus, Order, OrderItem, OrderStatus, PaymentMethod } from '@/types'
import { calculateGrade } from '@/lib/quality'
import { isPurchasable } from '@/lib/recommendation'
import { formatRupiah } from '@/lib/format'
import { DONATION_FLOW, MAX_QTY_PER_ITEM, ORDER_FLOW } from '@/lib/order-flow'
import { commit, getDb, nextNumber } from './mock-db'
import { confirmCheckout, holdCheckout, refreshStock, releaseCheckout, returnStock } from './stock-api'
import { delay, notify, requireUser, ServiceError, uid } from './utils'

/** Any cart change invalidates the reserved stock, so the customer must check out again. */
function dropCheckoutHold(userId: string) {
  const key = getDb().checkoutDrafts[userId]?.holdKey
  if (!key) return
  commit((d) => {
    d.checkoutDrafts[userId] = undefined
  })
  void releaseCheckout(key, userId).catch(() => {})
}

/* ---------------------------- cart ---------------------------- */

export async function addToCart(foodId: string, quantity = 1, donate = false) {
  await delay(250)
  const user = requireUser('customer')
  const food = getDb().foods.find((f) => f.id === foodId)
  if (!food) throw new ServiceError('This food is no longer available.')
  if (!isPurchasable(food)) throw new ServiceError('This food is sold out or past its pickup deadline.')
  const existing = getDb().carts[user.id]?.find((c) => c.foodId === foodId)
  const nextQty = (existing?.quantity ?? 0) + quantity
  if (nextQty > food.quantity) throw new ServiceError(`Only ${food.quantity} portion(s) left.`)
  if (nextQty > MAX_QTY_PER_ITEM) throw new ServiceError(`You can order up to ${MAX_QTY_PER_ITEM} portions per item.`)
  dropCheckoutHold(user.id)
  commit((db) => {
    const cart = (db.carts[user.id] ??= [])
    const item = cart.find((c) => c.foodId === foodId)
    if (item) item.quantity = nextQty
    else cart.push({ foodId, quantity, donate: donate && food.donationAvailable })
  })
}

export async function updateCartQuantity(foodId: string, quantity: number) {
  const user = requireUser('customer')
  const food = getDb().foods.find((f) => f.id === foodId)
  if (!food) throw new ServiceError('This food is no longer available.')
  if (quantity < 1) throw new ServiceError('Quantity must be at least 1.')
  if (quantity > food.quantity) throw new ServiceError(`Only ${food.quantity} portion(s) left.`)
  if (quantity > MAX_QTY_PER_ITEM) throw new ServiceError(`Maximum ${MAX_QTY_PER_ITEM} portions per item.`)
  dropCheckoutHold(user.id)
  commit((db) => {
    const item = db.carts[user.id]?.find((c) => c.foodId === foodId)
    if (item) item.quantity = quantity
  })
}

export async function setCartDonate(foodId: string, donate: boolean) {
  const user = requireUser('customer')
  const food = getDb().foods.find((f) => f.id === foodId)
  if (donate && !food?.donationAvailable) throw new ServiceError('This item is not available for donation.')
  commit((db) => {
    const item = db.carts[user.id]?.find((c) => c.foodId === foodId)
    if (item) item.donate = donate
  })
}

export async function removeFromCart(foodId: string) {
  const user = requireUser('customer')
  dropCheckoutHold(user.id)
  commit((db) => {
    db.carts[user.id] = (db.carts[user.id] ?? []).filter((c) => c.foodId !== foodId)
  })
}

/* --------------------------- checkout --------------------------- */

/** Once stock is held on the server the local quantity already excludes this cart, so skip that check. */
function validateCart(db: Db, userId: string, stockHeld = false) {
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

export async function saveCheckoutDraft(draft: CheckoutDraft) {
  await delay(400)
  const user = requireUser('customer')
  const db = getDb()
  const previousKey = db.checkoutDrafts[user.id]?.holdKey
  if (previousKey) await releaseCheckout(previousKey, user.id).catch(() => {})
  const cart = validateCart(db, user.id)
  if (draft.type === 'donation') {
    if (!draft.institutionId) throw new ServiceError('Please choose a social institution to receive your donation.')
    const inst = db.institutions.find((i) => i.id === draft.institutionId)
    if (!inst || inst.verification !== 'approved' || !inst.acceptingDonations)
      throw new ServiceError('This institution is not accepting donations right now.')
    const notDonatable = cart
      .map((c) => db.foods.find((f) => f.id === c.foodId)!)
      .filter((f) => !f.donationAvailable)
    if (notDonatable.length)
      throw new ServiceError(`${notDonatable.map((f) => f.name).join(', ')} cannot be donated. Remove it or buy for yourself.`)
    if (draft.message && draft.message.length > 200) throw new ServiceError('Donation message must be 200 characters or fewer.')
  }

  const holdKey = crypto.randomUUID()
  let hold: { expiresAt: string }
  try {
    hold = await holdCheckout(
      holdKey,
      user.id,
      cart.map((c) => ({ foodId: c.foodId, name: db.foods.find((f) => f.id === c.foodId)!.name, quantity: c.quantity })),
    )
  } catch (e) {
    void refreshStock()
    throw e
  }
  commit((d) => {
    d.checkoutDrafts[user.id] = { ...draft, holdKey, holdExpiresAt: hold.expiresAt }
  })
}

export async function processPayment(method: PaymentMethod, simulateFailure = false): Promise<string[]> {
  await delay(1600)
  const user = requireUser('customer')
  const db = getDb()
  const draft = db.checkoutDrafts[user.id]
  if (!draft?.holdKey || !draft.holdExpiresAt) throw new ServiceError('Your checkout session expired. Please review your cart again.')
  if (new Date(draft.holdExpiresAt).getTime() <= Date.now())
    throw new ServiceError('Your 10-minute stock hold has expired. Please go back to checkout to reserve the food again.')
  const holdKey = draft.holdKey
  const cart = validateCart(db, user.id, true)
  const total = cart.reduce((s, c) => s + (db.foods.find((f) => f.id === c.foodId)?.price ?? 0) * c.quantity, 0)

  if (simulateFailure) {
    commit((d) => {
      d.payments.unshift({ id: uid('pay'), orderIds: [], userId: user.id, amount: total, method, status: 'failed', createdAt: new Date().toISOString() })
    })
    throw new ServiceError('Payment was declined by the provider. No money was taken — please try again.')
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

  // The server is the single source of truth: a double click or retry with the same key never creates a second order.
  const confirmation = await confirmCheckout(holdKey, user.id, plannedIds)
  if (confirmation.alreadyPaid) {
    commit((d) => {
      d.carts[user.id] = []
      d.checkoutDrafts[user.id] = undefined
    })
    return confirmation.orderIds
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
        customerId: user.id,
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
          donorId: user.id,
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

    d.payments.unshift({ id: paymentId, orderIds, userId: user.id, amount: total, method, status: 'success', createdAt: now })
    d.carts[user.id] = []
    d.checkoutDrafts[user.id] = undefined
    notify(d, user.id, 'order', 'Payment successful', `${formatRupiah(total)} paid via ${method}. ${orderIds.length > 1 ? `${orderIds.length} orders` : orderIds[0]} confirmed.`, `/orders/${orderIds[0]}`)
  })
  void refreshStock()
  return orderIds
}

function returnOrderStock(order: Order | undefined) {
  if (!order) return Promise.resolve()
  return returnStock(order.items.map((i) => ({ foodId: i.foodId, quantity: i.quantity })))
}

/* ------------------------ order lifecycle ------------------------ */


function pushOrderStatus(order: Order, status: OrderStatus) {
  order.status = status
  order.history.push({ status, at: new Date().toISOString() })
}

function pushDonationStatus(donation: Donation, status: DonationStatus) {
  donation.status = status
  donation.history.push({ status, at: new Date().toISOString() })
}

function restoreStock(d: Db, order: Order) {
  for (const item of order.items) {
    const food = d.foods.find((f) => f.id === item.foodId)
    if (food) {
      food.quantity += item.quantity
      food.soldCount = Math.max(0, food.soldCount - item.quantity)
    }
  }
}

function recordImpact(d: Db, order: Order, isDonation: boolean) {
  const meals = order.items.reduce((s, i) => s + i.quantity, 0)
  const wasteKg = Number(order.items.reduce((s, i) => s + i.weightKg * i.quantity, 0).toFixed(2))
  d.impactRecords.unshift({
    id: uid('im'),
    userId: order.customerId,
    orderId: order.id,
    meals,
    wasteKg,
    donationValue: isDonation ? order.total : 0,
    isDonation,
    createdAt: new Date().toISOString(),
  })
  notify(d, order.customerId, 'impact', 'Impact updated', `You just saved ${meals} meal(s) and ${wasteKg} kg of food waste.`, '/impact')
}

/** Moves a restaurant order one step forward, keeping its donation record in sync. */
function advance(d: Db, order: Order) {
  const restaurant = d.restaurants.find((r) => r.id === order.restaurantId)
  const donation = order.donationId ? d.donations.find((x) => x.id === order.donationId) : undefined
  const inst = donation ? d.institutions.find((i) => i.id === donation.institutionId) : undefined

  switch (order.status) {
    case 'Payment Confirmed': {
      if (donation && donation.status === 'Purchased')
        throw new ServiceError('Waiting for the social institution to accept this donation.')
      pushOrderStatus(order, 'Restaurant Confirmed')
      if (donation) pushDonationStatus(donation, 'Restaurant Confirmed')
      notify(d, order.customerId, 'order', 'Order confirmed', `${restaurant?.name} confirmed ${order.id}.`, `/orders/${order.id}`)
      break
    }
    case 'Restaurant Confirmed':
      pushOrderStatus(order, 'Preparing')
      if (donation) pushDonationStatus(donation, 'Preparing')
      notify(d, order.customerId, 'order', 'Your order is being prepared', `${restaurant?.name} is preparing ${order.id}.`, `/orders/${order.id}`)
      break
    case 'Preparing':
      pushOrderStatus(order, 'Ready for Pickup')
      notify(d, order.customerId, 'order', donation ? 'Donation ready for courier' : 'Ready for pickup', donation ? `${order.id} is packed and waiting for the courier.` : `${order.id} is ready at ${restaurant?.name}. Pickup before the deadline.`, `/orders/${order.id}`)
      break
    case 'Ready for Pickup':
      pushOrderStatus(order, 'Picked Up')
      if (donation) {
        pushDonationStatus(donation, 'Picked Up')
        notify(d, inst?.ownerId, 'donation', 'Donation on the way', `${donation.quantity}x ${donation.foodSummary} has been picked up for delivery.`, '/institution/donations')
      }
      notify(d, order.customerId, 'order', donation ? 'Donation picked up' : 'Order picked up', `${order.id} has been picked up.`, `/orders/${order.id}`)
      break
    case 'Picked Up':
      if (donation) {
        if (donation.status !== 'Picked Up') throw new ServiceError('This donation has already been delivered.')
        pushDonationStatus(donation, 'Delivered')
        notify(d, inst?.ownerId, 'donation', 'Donation delivered', `${donation.quantity}x ${donation.foodSummary} has arrived. Please confirm receipt.`, '/institution/donations')
        notify(d, order.customerId, 'donation', 'Your donation was delivered', `${inst?.name} has received the delivery.`, '/donations')
      } else {
        pushOrderStatus(order, 'Completed')
        recordImpact(d, order, false)
        notify(d, order.customerId, 'review', 'How was your food?', `Rate your order from ${restaurant?.name}.`, `/orders/${order.id}`)
      }
      break
    default:
      throw new ServiceError('This order cannot be updated further.')
  }
}

export async function advanceOrder(orderId: string) {
  await delay(400)
  const user = requireUser('restaurant')
  commit((d) => {
    const order = d.orders.find((o) => o.id === orderId)
    if (!order) throw new ServiceError('Order not found.')
    if (order.restaurantId !== user.restaurantId) throw new ServiceError('You can only manage your own orders.')
    advance(d, order)
  })
}

export async function rejectOrder(orderId: string, reason = 'Restaurant unable to fulfil') {
  await delay(400)
  const user = requireUser(['restaurant', 'admin'])
  commit((d) => {
    const order = d.orders.find((o) => o.id === orderId)
    if (!order) throw new ServiceError('Order not found.')
    if (user.role === 'restaurant' && order.restaurantId !== user.restaurantId)
      throw new ServiceError('You can only manage your own orders.')
    if (!['Payment Confirmed', 'Restaurant Confirmed'].includes(order.status))
      throw new ServiceError('Orders can only be rejected before preparation starts.')
    pushOrderStatus(order, 'Cancelled')
    restoreStock(d, order)
    const donation = d.donations.find((x) => x.id === order.donationId)
    if (donation) pushDonationStatus(donation, 'Rejected')
    notify(d, order.customerId, 'order', 'Order cancelled', `${order.id} was cancelled: ${reason}. A full refund of ${formatRupiah(order.total)} is on its way.`, `/orders/${order.id}`)
  })
  await returnOrderStock(getDb().orders.find((o) => o.id === orderId))
}

export async function cancelOrder(orderId: string) {
  await delay(400)
  const user = requireUser('customer')
  commit((d) => {
    const order = d.orders.find((o) => o.id === orderId)
    if (!order || order.customerId !== user.id) throw new ServiceError('Order not found.')
    if (order.status !== 'Payment Confirmed') throw new ServiceError('This order can no longer be cancelled — the restaurant has already confirmed it.')
    pushOrderStatus(order, 'Cancelled')
    restoreStock(d, order)
    const donation = d.donations.find((x) => x.id === order.donationId)
    if (donation) pushDonationStatus(donation, 'Rejected')
    const restaurant = d.restaurants.find((r) => r.id === order.restaurantId)
    notify(d, restaurant?.ownerId, 'order', 'Order cancelled by customer', `${order.id} was cancelled.`, '/restaurant/orders')
    notify(d, user.id, 'order', 'Order cancelled', `Refund of ${formatRupiah(order.total)} will be returned to your payment method.`, `/orders/${order.id}`)
  })
  await returnOrderStock(getDb().orders.find((o) => o.id === orderId))
}

export async function confirmPickup(orderId: string) {
  await delay(400)
  const user = requireUser('customer')
  commit((d) => {
    const order = d.orders.find((o) => o.id === orderId)
    if (!order || order.customerId !== user.id) throw new ServiceError('Order not found.')
    if (order.type !== 'self') throw new ServiceError('Donation orders are picked up by the courier.')
    if (order.status !== 'Ready for Pickup') throw new ServiceError('This order is not ready for pickup yet.')
    pushOrderStatus(order, 'Picked Up')
    advance(d, order)
  })
}

/** Demo helper so a single user can walk an order through its whole lifecycle. */
export async function simulateOrderProgress(orderId: string) {
  await delay(500)
  const user = requireUser('customer')
  commit((d) => {
    const order = d.orders.find((o) => o.id === orderId)
    if (!order || order.customerId !== user.id) throw new ServiceError('Order not found.')
    const donation = d.donations.find((x) => x.id === order.donationId)
    if (donation?.status === 'Purchased') {
      pushDonationStatus(donation, 'Accepted')
      notify(d, user.id, 'donation', 'Donation accepted', `${d.institutions.find((i) => i.id === donation.institutionId)?.name} accepted your donation.`, '/donations')
      return
    }
    if (donation?.status === 'Delivered') {
      receive(d, donation)
      return
    }
    advance(d, order)
  })
}

/* --------------------------- donations --------------------------- */

function requireInstitutionDonation(d: Db, donationId: string, institutionId?: string) {
  const donation = d.donations.find((x) => x.id === donationId)
  if (!donation) throw new ServiceError('Donation not found.')
  if (donation.institutionId !== institutionId) throw new ServiceError('This donation is assigned to another institution.')
  return donation
}

export async function acceptDonation(donationId: string) {
  await delay(400)
  const user = requireUser('institution')
  commit((d) => {
    const donation = requireInstitutionDonation(d, donationId, user.institutionId)
    if (donation.status !== 'Purchased') throw new ServiceError('This donation has already been processed.')
    pushDonationStatus(donation, 'Accepted')
    const inst = d.institutions.find((i) => i.id === donation.institutionId)
    const restaurant = d.restaurants.find((r) => r.id === donation.restaurantId)
    notify(d, donation.donorId, 'donation', 'Donation accepted', `${inst?.name} accepted your donation of ${donation.foodSummary}.`, '/donations')
    notify(d, restaurant?.ownerId, 'donation', 'Donation accepted', `${inst?.name} accepted ${donation.orderId}. You can now confirm and prepare it.`, '/restaurant/orders')
  })
}

export async function rejectDonation(donationId: string) {
  await delay(400)
  const user = requireUser('institution')
  commit((d) => {
    const donation = requireInstitutionDonation(d, donationId, user.institutionId)
    if (donation.status !== 'Purchased') throw new ServiceError('Only new donations can be declined.')
    pushDonationStatus(donation, 'Rejected')
    const order = d.orders.find((o) => o.id === donation.orderId)
    if (order) {
      pushOrderStatus(order, 'Cancelled')
      restoreStock(d, order)
    }
    notify(d, donation.donorId, 'donation', 'Donation declined', `The institution could not accept this donation. A full refund of ${formatRupiah(donation.value)} is on its way.`, '/donations')
  })
  const orderId = getDb().donations.find((x) => x.id === donationId)?.orderId
  await returnOrderStock(getDb().orders.find((o) => o.id === orderId))
}

function receive(d: Db, donation: Donation) {
  pushDonationStatus(donation, 'Received')
  const order = d.orders.find((o) => o.id === donation.orderId)
  if (order && order.status !== 'Completed') {
    pushOrderStatus(order, 'Completed')
    recordImpact(d, order, true)
  }
  const inst = d.institutions.find((i) => i.id === donation.institutionId)
  notify(d, donation.donorId, 'donation', 'Donation received', `${inst?.name} confirmed they received your donation. Thank you!`, '/donations')
}

export async function confirmDonationReceived(donationId: string) {
  await delay(400)
  const user = requireUser('institution')
  commit((d) => {
    const donation = requireInstitutionDonation(d, donationId, user.institutionId)
    if (donation.status !== 'Delivered') throw new ServiceError('You can only confirm receipt after the food has been delivered.')
    receive(d, donation)
  })
}
