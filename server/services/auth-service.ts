import 'server-only'
import { headers } from 'next/headers'
import type { User } from '@/types'
import { DEMO_ACCOUNTS } from '@/data/seed'
import { auth } from '@/lib/auth'
import { toInstitutionLegal, toRestaurantLegal, validateLegal } from '@/lib/registration'
import type { RegisterInput } from '@/lib/roles'
import { uploadedDocsProblem } from '@/server/legal-docs'
import { commit, getDb } from './mock-db'
import { notifyAdmins, requireUser, ServiceError, uid } from './utils'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function startSession(user: User, device: string) {
  const db = getDb()
  db.session = { userId: user.id, createdAt: new Date().toISOString(), device }
}

async function signIn(email: string, password: string) {
  await auth.api.signInEmail({ body: { email, password }, headers: await headers() })
}

export async function login(email: string, password: string): Promise<User> {
  const normalized = email.trim().toLowerCase()
  const user = getDb().users.find((u) => u.email.toLowerCase() === normalized)
  if (!user) throw new ServiceError('Incorrect email or password.')
  if (user.status === 'suspended') throw new ServiceError('This account has been suspended. Please contact support.')
  try {
    await signIn(normalized, password)
  } catch {
    const demo = DEMO_ACCOUNTS.find((a) => a.email === normalized && a.password === password)
    if (!demo) throw new ServiceError('Incorrect email or password.')
    try {
      await auth.api.signUpEmail({ body: { email: normalized, password, name: user.name }, headers: await headers() })
    } catch {
      throw new ServiceError('Incorrect email or password.')
    }
  }
  startSession(user, (await headers()).get('user-agent') ?? 'Unknown device')
  return user
}

export async function register(input: RegisterInput): Promise<User> {
  const email = input.email.trim().toLowerCase()
  if (!EMAIL_RE.test(email)) throw new ServiceError('Please enter a valid email address.')
  if (input.password.length < 8) throw new ServiceError('Password must be at least 8 characters.')
  if (input.role !== 'customer' && input.role !== 'restaurant' && input.role !== 'institution')
    throw new ServiceError('This account type cannot be self-registered.')
  const partnerRole = input.role === 'restaurant' || input.role === 'institution' ? input.role : null
  if (partnerRole) {
    if (!input.legal) throw new ServiceError('Legal documents and a bank account are required.')
    const first = Object.values(validateLegal(partnerRole, input.legal))[0]
    if (first) throw new ServiceError(first)
    const docProblem = uploadedDocsProblem(partnerRole, input.legal.documents ?? {})
    if (docProblem) throw new ServiceError(docProblem)
  }
  if (getDb().users.some((u) => u.email.toLowerCase() === email))
    throw new ServiceError('An account with this email already exists.')

  try {
    await auth.api.signUpEmail({ body: { email, password: input.password, name: input.name.trim() }, headers: await headers() })
  } catch {
    throw new ServiceError('We could not create this account. Try a different email or sign in.')
  }

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
        legal: input.legal && toRestaurantLegal(input.legal),
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
        legal: input.legal && toInstitutionLegal(input.legal),
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
  })
  startSession(user, (await headers()).get('user-agent') ?? 'Unknown device')
  return user
}

export async function logout() {
  await auth.api.signOut({ headers: await headers() }).catch(() => {})
}

export async function requestPasswordReset(email: string) {
  if (!EMAIL_RE.test(email.trim())) throw new ServiceError('Please enter a valid email address.')
  // Always succeed to avoid leaking which emails are registered.
  return { email: email.trim().toLowerCase() }
}

export async function resetPassword(_email: string, _newPassword: string) {
  throw new ServiceError('Password reset by email is not available yet. Please contact support to recover your account.')
}

export async function changePassword(current: string, next: string) {
  requireUser()
  if (next.length < 8) throw new ServiceError('New password must be at least 8 characters.')
  if (current === next) throw new ServiceError('New password must be different from the current one.')
  try {
    await auth.api.changePassword({ body: { currentPassword: current, newPassword: next }, headers: await headers() })
  } catch {
    throw new ServiceError('Your current password is incorrect.')
  }
}

export async function logoutAllDevices() {
  requireUser()
  await auth.api.revokeSessions({ headers: await headers() }).catch(() => {})
}
