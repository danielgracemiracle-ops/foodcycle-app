import type { Food, FoodGrade, QualityAssessment, Review } from '@/types'

export const QUALITY_WEIGHTS = {
  freshness: 0.4,
  packaging: 0.2,
  restaurantRating: 0.2,
  customerFeedback: 0.2,
} as const

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)))

export function calculateQualityScore(input: Omit<QualityAssessment, 'score'>): QualityAssessment {
  const score =
    input.freshness * QUALITY_WEIGHTS.freshness +
    input.packaging * QUALITY_WEIGHTS.packaging +
    input.restaurantRating * QUALITY_WEIGHTS.restaurantRating +
    input.customerFeedback * QUALITY_WEIGHTS.customerFeedback
  return {
    freshness: clamp(input.freshness),
    packaging: clamp(input.packaging),
    restaurantRating: clamp(input.restaurantRating),
    customerFeedback: clamp(input.customerFeedback),
    score: clamp(score),
  }
}

export function ratingToScore(rating: number) {
  return clamp((rating / 5) * 100)
}

export function feedbackFromReviews(reviews: Review[], fallback: number) {
  if (reviews.length === 0) return fallback
  const avg =
    reviews.reduce((sum, r) => sum + (r.foodQuality + r.packaging + r.experience) / 3, 0) / reviews.length
  return ratingToScore(avg)
}

export type QualityLabel = 'Excellent' | 'Good' | 'Fair' | 'Review Needed'

export function qualityLabel(score: number): QualityLabel {
  if (score >= 90) return 'Excellent'
  if (score >= 75) return 'Good'
  if (score >= 60) return 'Fair'
  return 'Review Needed'
}

export const GRADE_INFO: Record<FoodGrade, { label: string; description: string }> = {
  A: { label: 'Very Good', description: 'Excellent condition and sufficient pickup time.' },
  B: { label: 'Good', description: 'Good condition with a shorter pickup window.' },
  C: { label: 'Urgent Pickup', description: 'Priority pickup recommended due to limited remaining time.' },
}

export const GRADE_DISCLAIMER =
  "Food Grade is an informational classification based on the platform's listed criteria. Food safety must still comply with applicable requirements."

export function hoursUntil(iso: string, now = Date.now()) {
  return (new Date(iso).getTime() - now) / 36e5
}

/** Grade criteria: overall condition (freshness + quality) and remaining pickup time. */
export function calculateGrade(
  food: Pick<Food, 'pickupEnd'> & { quality: Pick<QualityAssessment, 'freshness' | 'score'> },
  now = Date.now(),
): FoodGrade {
  const hoursLeft = hoursUntil(food.pickupEnd, now)
  const condition = (food.quality.freshness + food.quality.score) / 2
  if (condition >= 85 && hoursLeft >= 3) return 'A'
  if (condition >= 70 && hoursLeft >= 1.5) return 'B'
  return 'C'
}

export function discountPercent(original: number, price: number) {
  if (!original || original <= 0 || price >= original) return 0
  return Math.round(((original - price) / original) * 100)
}
