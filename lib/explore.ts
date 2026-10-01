import type { Food, FoodCategory, FoodGrade, Restaurant } from '@/types'
import { calculateGrade, hoursUntil } from './quality'
import { isSameDay } from './format'

export const PRICE_MIN = 0
export const PRICE_MAX = 60000

export type PickupFilter = 'today' | 'tomorrow' | 'evening' | 'deadline'
export const PICKUP_OPTIONS: { value: PickupFilter; label: string }[] = [
  { value: 'today', label: 'Available Today' },
  { value: 'tomorrow', label: 'Available Tomorrow' },
  { value: 'evening', label: 'Evening' },
  { value: 'deadline', label: 'Near Deadline' },
]

export const SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Rating' },
  { value: 'quality', label: 'Quality Score' },
  { value: 'distance', label: 'Distance' },
  { value: 'deadline', label: 'Pickup Deadline' },
] as const
export type SortValue = (typeof SORT_OPTIONS)[number]['value']

export interface Filters {
  categories: FoodCategory[]
  price: [number, number]
  grades: FoodGrade[]
  minQuality: number
  minRating: number
  maxDistance: number
  pickup: PickupFilter[]
  donation: boolean
}

export const EMPTY_FILTERS: Filters = {
  categories: [],
  price: [PRICE_MIN, PRICE_MAX],
  grades: [],
  minQuality: 0,
  minRating: 0,
  maxDistance: 0,
  pickup: [],
  donation: false,
}

export function activeFilterCount(f: Filters) {
  return (
    f.categories.length +
    f.grades.length +
    f.pickup.length +
    (f.price[0] !== PRICE_MIN || f.price[1] !== PRICE_MAX ? 1 : 0) +
    (f.minQuality ? 1 : 0) +
    (f.minRating ? 1 : 0) +
    (f.maxDistance ? 1 : 0) +
    (f.donation ? 1 : 0)
  )
}

function matchesPickup(food: Food, pickup: PickupFilter[], now: number) {
  if (pickup.length === 0) return true
  const start = new Date(food.pickupStart)
  const today = new Date(now)
  const tomorrow = new Date(now + 86_400_000)
  return pickup.some((p) => {
    if (p === 'today') return isSameDay(start, today)
    if (p === 'tomorrow') return isSameDay(start, tomorrow)
    if (p === 'evening') return start.getHours() >= 17
    return hoursUntil(food.pickupEnd, now) <= 2
  })
}

export function matchesQuery(food: Food, restaurant: Restaurant | undefined, query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return [food.name, food.category, restaurant?.name ?? ''].some((s) => s.toLowerCase().includes(q))
}

export function applyFilters(foods: Food[], restaurants: Map<string, Restaurant>, f: Filters, now = Date.now()) {
  return foods.filter((food) => {
    const r = restaurants.get(food.restaurantId)
    if (f.categories.length && !f.categories.includes(food.category)) return false
    if (food.price < f.price[0] || food.price > f.price[1]) return false
    if (f.grades.length && !f.grades.includes(calculateGrade(food, now))) return false
    if (f.minQuality && food.quality.score < f.minQuality) return false
    if (f.minRating && food.rating < f.minRating) return false
    if (f.maxDistance && (r?.distanceKm ?? 99) > f.maxDistance) return false
    if (f.donation && !food.donationAvailable) return false
    return matchesPickup(food, f.pickup, now)
  })
}

export function sortFoods(foods: Food[], restaurants: Map<string, Restaurant>, sort: SortValue, recommendedOrder: string[]) {
  const dist = (f: Food) => restaurants.get(f.restaurantId)?.distanceKm ?? 99
  const list = [...foods]
  switch (sort) {
    case 'price-asc':
      return list.sort((a, b) => a.price - b.price)
    case 'price-desc':
      return list.sort((a, b) => b.price - a.price)
    case 'rating':
      return list.sort((a, b) => b.rating - a.rating)
    case 'quality':
      return list.sort((a, b) => b.quality.score - a.quality.score)
    case 'distance':
      return list.sort((a, b) => dist(a) - dist(b))
    case 'deadline':
      return list.sort((a, b) => a.pickupEnd.localeCompare(b.pickupEnd))
    default: {
      const rank = new Map(recommendedOrder.map((id, i) => [id, i]))
      return list.sort((a, b) => (rank.get(a.id) ?? 999) - (rank.get(b.id) ?? 999))
    }
  }
}
