import type { AccountStatus, ComplaintStatus, SystemSettings, VerificationStatus } from '@/types'
import { commit } from './mock-db'
import { delay, notify, requireUser, ServiceError } from './utils'

export async function setUserStatus(userId: string, status: AccountStatus) {
  await delay(400)
  const admin = requireUser('admin')
  if (userId === admin.id) throw new ServiceError('You cannot suspend your own account.')
  commit((d) => {
    const u = d.users.find((x) => x.id === userId)
    if (!u) throw new ServiceError('User not found.')
    if (u.role === 'admin') throw new ServiceError('Admin accounts cannot be suspended here.')
    u.status = status
  })
}

export async function setRestaurantVerification(restaurantId: string, verification: VerificationStatus) {
  await delay(400)
  requireUser('admin')
  commit((d) => {
    const r = d.restaurants.find((x) => x.id === restaurantId)
    if (!r) throw new ServiceError('Restaurant not found.')
    r.verification = verification
    notify(d, r.ownerId, 'system', `Restaurant ${verification}`, verification === 'approved' ? `${r.name} is verified. You can now publish listings.` : `${r.name} verification status: ${verification}.`, '/restaurant')
    if (verification !== 'approved') for (const f of d.foods) if (f.restaurantId === r.id && f.status === 'active') f.status = 'paused'
  })
}

export async function setInstitutionVerification(institutionId: string, verification: VerificationStatus) {
  await delay(400)
  requireUser('admin')
  commit((d) => {
    const i = d.institutions.find((x) => x.id === institutionId)
    if (!i) throw new ServiceError('Institution not found.')
    i.verification = verification
    if (verification === 'approved') i.acceptingDonations = true
    notify(d, i.ownerId, 'system', `Institution ${verification}`, `${i.name} verification status: ${verification}.`, '/institution')
  })
}

export async function setFoodDisabled(foodId: string, disabled: boolean) {
  await delay(350)
  requireUser('admin')
  commit((d) => {
    const f = d.foods.find((x) => x.id === foodId)
    if (!f) throw new ServiceError('Listing not found.')
    f.status = disabled ? 'disabled' : 'active'
    const owner = d.restaurants.find((r) => r.id === f.restaurantId)?.ownerId
    notify(d, owner, 'system', disabled ? 'Listing disabled by admin' : 'Listing re-enabled', `${f.name} ${disabled ? 'was disabled for review.' : 'is visible again.'}`, '/restaurant/listings')
  })
}

export async function respondToComplaint(complaintId: string, message: string, status: ComplaintStatus) {
  await delay(400)
  requireUser('admin')
  if (message.trim().length < 3 && status !== 'Resolved') throw new ServiceError('Please write a response.')
  commit((d) => {
    const c = d.complaints.find((x) => x.id === complaintId)
    if (!c) throw new ServiceError('Complaint not found.')
    if (message.trim()) c.responses.push({ author: 'Admin', message: message.trim(), at: new Date().toISOString() })
    c.status = status
    notify(d, c.userId, 'system', `Complaint ${c.id} updated`, message.trim() || `Status changed to ${status}.`)
  })
}

/** Duitku has no refund API: the admin sends the money from the Duitku dashboard, then records it here. */
export async function completeRefund(refundId: string, note: string) {
  requireUser('admin')
  const trimmed = typeof note === 'string' ? note.trim().slice(0, 200) : ''
  if (trimmed.length < 3) throw new ServiceError('Add a short note, e.g. the transfer reference.')
  commit((d) => {
    const r = d.refunds.find((x) => x.id === refundId)
    if (!r) throw new ServiceError('Refund not found.')
    if (r.status === 'completed') throw new ServiceError('This refund is already marked as sent.')
    r.status = 'completed'
    r.completedAt = new Date().toISOString()
    r.note = trimmed
    notify(d, r.userId, 'order', 'Refund sent', `Your refund for ${r.orderId} has been sent. Reference: ${trimmed}`, '/orders')
  })
}

export async function updateSystemSettings(patch: Partial<SystemSettings>) {
  await delay(400)
  requireUser('admin')
  if (patch.platformFeePercent !== undefined && (patch.platformFeePercent < 0 || patch.platformFeePercent > 30))
    throw new ServiceError('Platform fee must be between 0% and 30%.')
  commit((d) => {
    Object.assign(d.systemSettings, patch)
  })
}
