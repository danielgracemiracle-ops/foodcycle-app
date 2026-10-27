import type { Restaurant, SocialInstitution, User, UserPreferences } from '@/types'
import { commit } from './mock-db'
import { delay, requireUser, ServiceError } from './utils'

const PHONE_RE = /^[+\d][\d\s-]{6,}$/

export async function updateProfile(input: Pick<User, 'name' | 'phone' | 'location' | 'avatarUrl'>) {
  await delay(500)
  const user = requireUser()
  if (input.name.trim().length < 2) throw new ServiceError('Name must be at least 2 characters.')
  if (input.phone && !PHONE_RE.test(input.phone)) throw new ServiceError('Please enter a valid phone number.')
  commit((d) => {
    const u = d.users.find((x) => x.id === user.id)!
    u.name = input.name.trim()
    u.phone = input.phone?.trim()
    u.location = input.location?.trim()
    u.avatarUrl = input.avatarUrl
  })
}

export async function updatePreferences(patch: Partial<Omit<UserPreferences, 'userId'>>) {
  await delay(350)
  const user = requireUser()
  if (patch.priceRange && patch.priceRange[0] > patch.priceRange[1]) throw new ServiceError('Minimum price must be below maximum price.')
  commit((d) => {
    let prefs = d.preferences.find((p) => p.userId === user.id)
    if (!prefs) {
      prefs = {
        userId: user.id,
        favoriteCategories: [],
        priceRange: [5000, 50000],
        maxDistance: 5,
        preferredPickupTime: 'any',
        notifications: {},
        privacy: { showProfile: true, shareImpact: true, twoFactor: false },
      }
      d.preferences.push(prefs)
    }
    Object.assign(prefs, patch)
  })
}

export async function updateRestaurant(patch: Partial<Omit<Restaurant, 'id' | 'ownerId' | 'verification' | 'rating' | 'reviewCount'>>) {
  await delay(500)
  const user = requireUser('restaurant')
  if (patch.name !== undefined && patch.name.trim().length < 2) throw new ServiceError('Restaurant name is required.')
  if (patch.openTime && patch.closeTime && patch.openTime >= patch.closeTime) throw new ServiceError('Closing time must be after opening time.')
  commit((d) => {
    const r = d.restaurants.find((x) => x.id === user.restaurantId)
    if (!r) throw new ServiceError('Restaurant not found.')
    Object.assign(r, patch)
  })
}

export async function updateInstitution(patch: Partial<Omit<SocialInstitution, 'id' | 'ownerId' | 'verification'>>) {
  await delay(500)
  const user = requireUser('institution')
  if (patch.name !== undefined && patch.name.trim().length < 2) throw new ServiceError('Institution name is required.')
  if (patch.maxDailyCapacity !== undefined && patch.maxDailyCapacity < 1) throw new ServiceError('Capacity must be at least 1 meal.')
  commit((d) => {
    const i = d.institutions.find((x) => x.id === user.institutionId)
    if (!i) throw new ServiceError('Institution not found.')
    Object.assign(i, patch)
  })
}
