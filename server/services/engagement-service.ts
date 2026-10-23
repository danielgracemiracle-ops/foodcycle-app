import type { ComplaintCategory } from '@/types'
import { calculateQualityScore, feedbackFromReviews } from '@/lib/quality'
import { commit, getDb } from './mock-db'
import { delay, notify, notifyAdmins, requireUser, ServiceError, uid } from './utils'

/* ---------------------------- reviews ---------------------------- */

export interface ReviewInput {
  orderId: string
  foodId: string
  foodQuality: number
  packaging: number
  experience: number
  comment: string
}

export async function submitReview(input: ReviewInput) {
  await delay(500)
  const user = requireUser('customer')
  const order = getDb().orders.find((o) => o.id === input.orderId)
  if (!order || order.customerId !== user.id) throw new ServiceError('Order not found.')
  if (order.status !== 'Completed') throw new ServiceError('You can review an order after it is completed.')
  if (order.reviewed) throw new ServiceError('You have already reviewed this order.')
  for (const v of [input.foodQuality, input.packaging, input.experience])
    if (!(v >= 1 && v <= 5)) throw new ServiceError('Please rate every category from 1 to 5 stars.')
  if (input.comment.length > 500) throw new ServiceError('Review must be 500 characters or fewer.')

  commit((d) => {
    const o = d.orders.find((x) => x.id === input.orderId)!
    o.reviewed = true
    const [first, ...rest] = user.name.split(' ')
    d.reviews.unshift({
      id: uid('rv'),
      orderId: o.id,
      foodId: input.foodId,
      restaurantId: o.restaurantId,
      userId: user.id,
      userName: `${first}${rest[0] ? ` ${rest[0][0]}.` : ''}`,
      foodQuality: input.foodQuality,
      packaging: input.packaging,
      experience: input.experience,
      comment: input.comment.trim(),
      createdAt: new Date().toISOString(),
    })

    // Customer feedback feeds back into the food quality score and ratings.
    const avg = (input.foodQuality + input.packaging + input.experience) / 3
    const food = d.foods.find((f) => f.id === input.foodId)
    if (food) {
      food.rating = Number(((food.rating * food.ratingCount + avg) / (food.ratingCount + 1)).toFixed(1))
      food.ratingCount += 1
      const reviews = d.reviews.filter((r) => r.foodId === food.id)
      food.quality = calculateQualityScore({ ...food.quality, customerFeedback: feedbackFromReviews(reviews, food.quality.customerFeedback) })
    }
    const restaurant = d.restaurants.find((r) => r.id === o.restaurantId)
    if (restaurant) {
      restaurant.rating = Number(((restaurant.rating * restaurant.reviewCount + avg) / (restaurant.reviewCount + 1)).toFixed(1))
      restaurant.reviewCount += 1
      notify(d, restaurant.ownerId, 'review', 'New review received', `${user.name} rated ${food?.name ?? 'an item'} ${avg.toFixed(1)} stars.`, '/restaurant/reviews')
    }
  })
}

/* --------------------------- favorites --------------------------- */

export async function toggleFavorite(targetType: 'food' | 'restaurant', targetId: string) {
  const user = requireUser('customer')
  let added = false
  commit((d) => {
    const existing = d.favorites.find((f) => f.userId === user.id && f.targetType === targetType && f.targetId === targetId)
    if (existing) d.favorites = d.favorites.filter((f) => f.id !== existing.id)
    else {
      d.favorites.unshift({ id: uid('fav'), userId: user.id, targetType, targetId, createdAt: new Date().toISOString() })
      added = true
    }
  })
  return added
}

/* ------------------------- notifications ------------------------- */

export async function markNotificationRead(id: string, read = true) {
  const user = requireUser()
  commit((d) => {
    const n = d.notifications.find((x) => x.id === id && x.userId === user.id)
    if (n) n.read = read
  })
}

export async function markAllNotificationsRead() {
  const user = requireUser()
  commit((d) => {
    for (const n of d.notifications) if (n.userId === user.id) n.read = true
  })
}

export async function deleteNotification(id: string) {
  const user = requireUser()
  commit((d) => {
    d.notifications = d.notifications.filter((n) => !(n.id === id && n.userId === user.id))
  })
}

/* --------------------------- complaints --------------------------- */

export async function submitComplaint(input: { category: ComplaintCategory; subject: string; description: string }) {
  await delay(500)
  const user = requireUser()
  if (input.subject.trim().length < 5) throw new ServiceError('Subject must be at least 5 characters.')
  if (input.description.trim().length < 15) throw new ServiceError('Please describe the issue in a bit more detail.')
  const id = `CMP-${String(getDb().complaints.length + 22).padStart(3, '0')}`
  commit((d) => {
    d.complaints.unshift({
      id,
      userId: user.id,
      userName: user.name,
      category: input.category,
      subject: input.subject.trim(),
      description: input.description.trim(),
      status: 'Open',
      responses: [],
      createdAt: new Date().toISOString(),
    })
    notifyAdmins(d, 'system', 'New complaint submitted', `${input.category} reported by ${user.name}.`, '/admin/complaints')
  })
  return id
}
