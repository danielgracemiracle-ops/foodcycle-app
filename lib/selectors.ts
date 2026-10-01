import type { Db, Food } from '@/types'
import { isPurchasable } from './recommendation'

/** Foods a customer can see in the marketplace: active listings from approved restaurants. */
export function marketplaceFoods(db: Db, now = Date.now()): Food[] {
  const approved = new Set(db.restaurants.filter((r) => r.verification === 'approved').map((r) => r.id))
  return db.foods.filter((f) => approved.has(f.restaurantId) && isPurchasable(f, now))
}

export function userImpact(db: Db, userId: string) {
  const records = db.impactRecords.filter((r) => r.userId === userId)
  return {
    meals: records.reduce((s, r) => s + r.meals, 0),
    wasteKg: records.reduce((s, r) => s + r.wasteKg, 0),
    donations: records.filter((r) => r.isDonation).length,
    donationValue: records.reduce((s, r) => s + r.donationValue, 0),
    records,
  }
}

export function cartLines(db: Db, userId: string) {
  return (db.carts[userId] ?? [])
    .map((item) => {
      const food = db.foods.find((f) => f.id === item.foodId)
      const restaurant = food && db.restaurants.find((r) => r.id === food.restaurantId)
      return food && restaurant ? { item, food, restaurant } : null
    })
    .filter((l): l is NonNullable<typeof l> => l !== null)
}

export function cartTotals(lines: ReturnType<typeof cartLines>) {
  const subtotal = lines.reduce((s, l) => s + l.food.originalPrice * l.item.quantity, 0)
  const total = lines.reduce((s, l) => s + l.food.price * l.item.quantity, 0)
  return { subtotal, discount: subtotal - total, total, count: lines.reduce((s, l) => s + l.item.quantity, 0) }
}

export function greeting(date = new Date()) {
  const h = date.getHours()
  if (h < 11) return 'Good morning'
  if (h < 15) return 'Good afternoon'
  if (h < 19) return 'Good evening'
  return 'Good night'
}
