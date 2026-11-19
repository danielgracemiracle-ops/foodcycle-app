import { describe, expect, it } from 'vitest'
import { getRecommendations, isPurchasable } from '@/lib/recommendation'
import { NOW, hoursFromNow, makeFood, makeRestaurant } from '../fixtures'

describe('Recommendations (lib/recommendation.ts)', () => {
  it('UT-M01: only active, in-stock, not-expired food is purchasable', () => {
    expect(isPurchasable(makeFood(), NOW)).toBe(true)
    expect(isPurchasable(makeFood({ quantity: 0 }), NOW)).toBe(false)
    expect(isPurchasable(makeFood({ status: 'paused' }), NOW)).toBe(false)
    expect(isPurchasable(makeFood({ pickupEnd: hoursFromNow(-1) }), NOW)).toBe(false)
  })

  it('UT-M02: food from unverified restaurants is never recommended', () => {
    const result = getRecommendations({
      foods: [makeFood()],
      restaurants: [makeRestaurant({ verification: 'pending' } as never)],
      orders: [],
      now: NOW,
    })
    expect(result).toHaveLength(0)
  })

  it('UT-M03: favourite category ranks higher and explains why', () => {
    const fav = makeFood({ id: 'fav', category: 'Bakery' as never })
    const other = makeFood({ id: 'other' })
    const [first] = getRecommendations({
      foods: [other, fav],
      restaurants: [makeRestaurant()],
      orders: [],
      preferences: {
        favoriteCategories: ['Bakery'],
        priceRange: [0, 100000],
        maxDistance: 5,
        preferredPickupTime: 'any',
      } as never,
      now: NOW,
    })
    expect(first.food.id).toBe('fav')
    expect(first.reasons[0]).toContain('Bakery')
  })

  it('UT-M04: respects the limit and returns at most 2 reasons per item', () => {
    const foods = Array.from({ length: 12 }, (_, i) => makeFood({ id: `f${i}` }))
    const result = getRecommendations({ foods, restaurants: [makeRestaurant()], orders: [], now: NOW }, 5)
    expect(result).toHaveLength(5)
    for (const r of result) expect(r.reasons.length).toBeLessThanOrEqual(2)
  })
})
