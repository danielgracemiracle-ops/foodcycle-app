import type { Role, User } from '@/types'
import { commit, getDb, hasCredentials, setPassword, verifyPassword } from './mock-db'
import { delay, notifyAdmins, requireUser, ServiceError, uid } from './utils'

export const ROLE_HOME: Record<Role, string> = {
  customer: '/home',
  restaurant: '/restaurant',
  institution: '/institution',
  admin: '/admin',
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function device() {
  if (typeof navigator === 'undefined') return 'Unknown device'
  const ua = navigator.userAgent
  const browser = /Edg/.test(ua) ? 'Edge' : /Chrome/.test(ua) ? 'Chrome' : /Safari/.test(ua) ? 'Safari' : /Firefox/.test(ua) ? 'Firefox' : 'Browser'
  const os = /Mac/.test(ua) ? 'macOS' : /Win/.test(ua) ? 'Windows' : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : 'Linux'
  return `${browser} on ${os}`
}

export async function login(email: string, password: string): Promise<User> {
  await delay(600)
  const normalized = email.trim().toLowerCase()
  const user = getDb().users.find((u) => u.email.toLowerCase() === normalized)
  if (!user || !verifyPassword(normalized, password)) throw new ServiceError('Incorrect email or password.')
  if (user.status === 'suspended') throw new ServiceError('This account has been suspended. Please contact support.')
  commit((db) => {
    db.session = { userId: user.id, createdAt: new Date().toISOString(), device: device() }
  })
  return user
}

export interface RegisterInput {
  role: Role
  name: string
  email: string
  password: string
  phone?: string
  location?: string
  organization?: string
}

export async function register(input: RegisterInput): Promise<User> {
  await delay(700)
  const email = input.email.trim().toLowerCase()
  if (!EMAIL_RE.test(email)) throw new ServiceError('Please enter a valid email address.')
  if (input.password.length < 8) throw new ServiceError('Password must be at least 8 characters.')
  if (input.role === 'admin') throw new ServiceError('Admin accounts cannot be self-registered.')
  const db = getDb()
  if (db.users.some((u) => u.email.toLowerCase() === email) || hasCredentials(email))
    throw new ServiceError('An account with this email already exists.')

  const now = new Date().toISOString()
  const userId = uid('u')
  const user: User = {
    id: userId,
    name: input.name.trim(),
    email,
    role: input.role,
    phone: input.phone,
    location: input.location,
    status: 'active',
    createdAt: now,
  }

  setPassword(email, input.password)
  commit((draft) => {
    if (input.role === 'restaurant') {
      const id = uid('r')
      user.restaurantId = id
      draft.restaurants.push({
        id,
        ownerId: userId,
        name: input.organization?.trim() || `${user.name}'s Kitchen`,
        description: 'Tell customers about your restaurant.',
        address: input.location ?? '',
        city: 'Jakarta',
        distanceKm: 2,
        openTime: '10:00',
        closeTime: '21:00',
        phone: input.phone ?? '',
        email,
        rating: 0,
        reviewCount: 0,
        verification: 'pending',
        defaultPickupMinutes: 90,
        logoColor: 'chart-1',
        createdAt: now,
      })
      notifyAdmins(draft, 'system', 'New restaurant registration', `${input.organization || user.name} is awaiting verification.`, '/admin/restaurants')
    }
    if (input.role === 'institution') {
      const id = uid('i')
      user.institutionId = id
      draft.institutions.push({
        id,
        ownerId: userId,
        name: input.organization?.trim() || user.name,
        description: 'Describe the community you serve.',
        address: input.location ?? '',
        city: 'Jakarta',
        phone: input.phone ?? '',
        email,
        verification: draft.systemSettings.autoApproveInstitutions ? 'approved' : 'pending',
        mealsNeeded: 20,
        acceptingDonations: true,
        openTime: '08:00',
        closeTime: '18:00',
        preferredCategories: ['Rice'],
        maxDailyCapacity: 30,
        preferredPickupTime: '16:00–18:00',
        createdAt: now,
      })
      notifyAdmins(draft, 'system', 'New institution registration', `${input.organization || user.name} is awaiting verification.`, '/admin/institutions')
    }
    draft.users.push(user)
    draft.preferences.push({
      userId,
      favoriteCategories: [],
      priceRange: [5000, 50000],
      maxDistance: 5,
      preferredPickupTime: 'any',
      notifications: { orders: true, donations: true, promotions: true, newFood: true, reviews: true, email: false },
      privacy: { showProfile: true, shareImpact: true, twoFactor: false },
    })
    draft.carts[userId] = []
    draft.session = { userId, createdAt: now, device: device() }
  })
  return user
}

export async function logout() {
  await delay(200)
  commit((db) => {
    db.session = null
  })
}

export async function requestPasswordReset(email: string) {
  await delay(700)
  if (!EMAIL_RE.test(email.trim())) throw new ServiceError('Please enter a valid email address.')
  // Always succeed to avoid leaking which emails are registered.
  return { email: email.trim().toLowerCase() }
}

export async function resetPassword(email: string, newPassword: string) {
  await delay(600)
  if (newPassword.length < 8) throw new ServiceError('Password must be at least 8 characters.')
  const exists = getDb().users.some((u) => u.email.toLowerCase() === email.toLowerCase())
  if (!exists) throw new ServiceError('This reset link is invalid or has expired.')
  setPassword(email, newPassword)
}

export async function changePassword(current: string, next: string) {
  await delay(500)
  const user = requireUser()
  if (!verifyPassword(user.email, current)) throw new ServiceError('Your current password is incorrect.')
  if (next.length < 8) throw new ServiceError('New password must be at least 8 characters.')
  if (current === next) throw new ServiceError('New password must be different from the current one.')
  setPassword(user.email, next)
}

export async function logoutAllDevices() {
  await delay(400)
  commit((db) => {
    db.session = null
  })
}
