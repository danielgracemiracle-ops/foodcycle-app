import { describe, expect, it } from 'vitest'
import {
  calculateGrade,
  calculateQualityScore,
  discountPercent,
  feedbackFromReviews,
  qualityLabel,
  ratingToScore,
} from '@/lib/quality'
import type { Review } from '@/types'
import { NOW, hoursFromNow } from '../fixtures'

describe('Quality score & food grade (lib/quality.ts)', () => {
  it('UT-Q01: weighted score = 40% freshness + 20% packaging + 20% rating + 20% feedback', () => {
    const r = calculateQualityScore({ freshness: 100, packaging: 50, restaurantRating: 50, customerFeedback: 50 })
    expect(r.score).toBe(70)
  })

  it('UT-Q02: values are clamped to 0..100', () => {
    const r = calculateQualityScore({ freshness: 150, packaging: -20, restaurantRating: 100, customerFeedback: 100 })
    expect(r.freshness).toBe(100)
    expect(r.packaging).toBe(0)
    expect(r.score).toBeLessThanOrEqual(100)
  })

  it('UT-Q03: rating 5 stars maps to 100, 2.5 to 50', () => {
    expect(ratingToScore(5)).toBe(100)
    expect(ratingToScore(2.5)).toBe(50)
  })

  it('UT-Q04: feedback falls back when there are no reviews, otherwise averages them', () => {
    expect(feedbackFromReviews([], 77)).toBe(77)
    const reviews = [{ foodQuality: 5, packaging: 5, experience: 5 }, { foodQuality: 3, packaging: 3, experience: 3 }] as Review[]
    expect(feedbackFromReviews(reviews, 0)).toBe(80)
  })

  it('UT-Q05: label boundaries', () => {
    expect(qualityLabel(90)).toBe('Excellent')
    expect(qualityLabel(75)).toBe('Good')
    expect(qualityLabel(60)).toBe('Fair')
    expect(qualityLabel(59)).toBe('Review Needed')
  })

  it('UT-Q06: grade A needs good condition and >= 3h pickup left', () => {
    const quality = { freshness: 90, score: 90 }
    expect(calculateGrade({ pickupEnd: hoursFromNow(4), quality }, NOW)).toBe('A')
    expect(calculateGrade({ pickupEnd: hoursFromNow(2), quality }, NOW)).toBe('B')
    expect(calculateGrade({ pickupEnd: hoursFromNow(1), quality }, NOW)).toBe('C')
  })

  it('UT-Q07: poor condition is always grade C even with plenty of time', () => {
    expect(calculateGrade({ pickupEnd: hoursFromNow(10), quality: { freshness: 50, score: 60 } }, NOW)).toBe('C')
  })

  it('UT-Q08: discount percent, and 0 for invalid prices', () => {
    expect(discountPercent(30000, 15000)).toBe(50)
    expect(discountPercent(0, 10)).toBe(0)
    expect(discountPercent(10000, 12000)).toBe(0)
  })
})
