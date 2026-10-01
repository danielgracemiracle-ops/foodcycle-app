import type { Db, Order } from '@/types'

const REVENUE_STATUSES = new Set<Order['status']>(['Payment Confirmed', 'Restaurant Confirmed', 'Preparing', 'Ready for Pickup', 'Picked Up', 'Completed'])

export function restaurantData(db: Db, restaurantId: string) {
  const restaurant = db.restaurants.find((r) => r.id === restaurantId)
  const foods = db.foods.filter((f) => f.restaurantId === restaurantId)
  const orders = db.orders.filter((o) => o.restaurantId === restaurantId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const paid = orders.filter((o) => REVENUE_STATUSES.has(o.status))
  const reviews = db.reviews.filter((r) => r.restaurantId === restaurantId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const donations = db.donations.filter((d) => d.restaurantId === restaurantId && d.status !== 'Rejected')

  const revenue = paid.reduce((s, o) => s + o.total, 0)
  const meals = paid.reduce((s, o) => s + o.items.reduce((n, i) => n + i.quantity, 0), 0)
  const wasteKg = paid.reduce((s, o) => s + o.items.reduce((n, i) => n + i.quantity * i.weightKg, 0), 0)
  const pending = orders.filter((o) => o.status === 'Payment Confirmed')
  const active = orders.filter((o) => ['Restaurant Confirmed', 'Preparing', 'Ready for Pickup'].includes(o.status))

  return { restaurant, foods, orders, paid, reviews, donations, revenue, meals, wasteKg, pending, active }
}

export function revenueByDay(orders: Order[], days = 7, now = new Date()) {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1 - i))
    const dayOrders = orders.filter((o) => {
      const od = new Date(o.createdAt)
      return od.getFullYear() === d.getFullYear() && od.getMonth() === d.getMonth() && od.getDate() === d.getDate()
    })
    return {
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      revenue: dayOrders.reduce((s, o) => s + o.total, 0),
      orders: dayOrders.length,
    }
  })
}
