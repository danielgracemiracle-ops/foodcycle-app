import type { Food, Order, Restaurant, UserPreferences } from '@/types'
import { calculateGrade, hoursUntil } from './quality'

export interface Recommendation {
  food: Food
  score: number
  reasons: string[]
}

interface Context {
  foods: Food[]
  restaurants: Restaurant[]
  orders: Order[]
  preferences?: UserPreferences
  now?: number
}

export function isPurchasable(food: Food, now = Date.now()) {
  return food.status === 'active' && food.quantity > 0 && new Date(food.pickupEnd).getTime() > now
}

function pickupMatches(food: Food, pref: UserPreferences['preferredPickupTime']) {
  if (pref === 'any') return true
  const h = new Date(food.pickupStart).getHours()
  if (pref === 'afternoon') return h >= 12 && h < 17
  if (pref === 'evening') return h >= 17 && h < 21
  return h >= 20 || h < 2
}

/**
 * Rule-based scoring. Signals: favourite categories, purchase history, average spend,
 * distance, rating, grade, quality score and pickup availability.
 */
export function getRecommendations({ foods, restaurants, orders, preferences, now = Date.now() }: Context, limit = 8) {
  const historyCategories = new Map<string, number>()
  let spendTotal = 0
  let spendCount = 0
  for (const order of orders) {
    for (const item of order.items) {
      historyCategories.set(item.category, (historyCategories.get(item.category) ?? 0) + item.quantity)
      spendTotal += item.price
      spendCount += 1
    }
  }
  const avgSpend = spendCount ? spendTotal / spendCount : undefined
  const restaurantById = new Map(restaurants.map((r) => [r.id, r]))

  const results: Recommendation[] = []
  for (const food of foods) {
    if (!isPurchasable(food, now)) continue
    const restaurant = restaurantById.get(food.restaurantId)
    if (!restaurant || restaurant.verification !== 'approved') continue

    let score = 0
    const reasons: string[] = []

    if (preferences?.favoriteCategories.includes(food.category)) {
      score += 25
      reasons.push(`Because you like ${food.category}`)
    }
    if ((historyCategories.get(food.category) ?? 0) > 0) {
      score += 15
      if (!reasons.length) reasons.push(`You often order ${food.category}`)
    }
    if (preferences) {
      const [min, max] = preferences.priceRange
      if (food.price >= min && food.price <= max) score += 10
    }
    if (avgSpend && Math.abs(food.price - avgSpend) / avgSpend < 0.35) score += 8

    const maxDistance = preferences?.maxDistance ?? 5
    if (restaurant.distanceKm <= maxDistance) {
      score += 12 * (1 - restaurant.distanceKm / Math.max(maxDistance, 1))
      if (restaurant.distanceKm <= 2) reasons.push('Near your location')
    } else {
      score -= 15
    }

    score += (restaurant.rating / 5) * 10
    if (restaurant.rating >= 4.7) reasons.push('Highly rated restaurant')

    const grade = calculateGrade(food, now)
    score += grade === 'A' ? 10 : grade === 'B' ? 6 : 3
    if (grade === 'A') reasons.push('Grade A quality')

    score += (food.quality.score / 100) * 10

    if (preferences && pickupMatches(food, preferences.preferredPickupTime)) score += 6
    const hoursLeft = hoursUntil(food.pickupEnd, now)
    if (hoursLeft > 0 && hoursLeft < 2) reasons.push('Pickup soon')

    if (reasons.length === 0) reasons.push('Popular near you')
    results.push({ food, score: Math.round(score), reasons: reasons.slice(0, 2) })
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit)
}
