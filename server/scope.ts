import 'server-only'
import type { Db, User } from '@/types'

/**
 * Trims the shared document down to what the signed-in viewer may see.
 * Admins get everything; everyone else gets public catalog data plus their own records.
 */
export function scopeForViewer(db: Db): Db {
  const viewer = db.session ? db.users.find((u) => u.id === db.session!.userId) : undefined
  if (viewer?.role === 'admin' && viewer.status !== 'suspended') return db

  const id = viewer?.id
  const myRestaurant = viewer?.restaurantId
  const myInstitution = viewer?.institutionId
  const own = <T extends { userId: string }>(rows: T[]) => (id ? rows.filter((r) => r.userId === id) : [])

  const publicUser = (u: User): User =>
    u.id === id
      ? u
      : {
          id: u.id,
          name: u.name,
          email: '',
          role: u.role,
          avatarUrl: u.avatarUrl,
          location: u.location,
          status: u.status,
          createdAt: u.createdAt,
          restaurantId: u.restaurantId,
          institutionId: u.institutionId,
        }

  const donations = db.donations.filter(
    (d) =>
      (id && d.donorId === id) ||
      (myRestaurant && d.restaurantId === myRestaurant) ||
      (myInstitution && d.institutionId === myInstitution),
  )
  const visibleDonationIds = new Set(donations.map((d) => d.id))

  return {
    ...db,
    users: db.users.map(publicUser),
    restaurants: db.restaurants.map((r) => (r.id === myRestaurant ? r : { ...r, legal: undefined })),
    institutions: db.institutions.map((i) => (i.id === myInstitution ? i : { ...i, legal: undefined })),
    orders: db.orders.filter(
      (o) =>
        (id && o.customerId === id) ||
        (myRestaurant && o.restaurantId === myRestaurant) ||
        (o.donationId !== undefined && visibleDonationIds.has(o.donationId)),
    ),
    payments: own(db.payments),
    donations,
    notifications: own(db.notifications),
    favorites: own(db.favorites),
    complaints: own(db.complaints),
    preferences: own(db.preferences),
    carts: id ? { [id]: db.carts[id] ?? [] } : {},
    checkoutDrafts: id ? { [id]: db.checkoutDrafts[id] } : {},
  }
}
