import type { Db, Notification, NotificationType, Role, User } from '@/types'
import { getDb } from './mock-db'

export class ServiceError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ServiceError'
  }
}

export const delay = (ms = 450) => new Promise((r) => setTimeout(r, ms))

export function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

export function currentUser(db: Db = getDb()): User | null {
  if (!db.session) return null
  return db.users.find((u) => u.id === db.session!.userId) ?? null
}

export function requireUser(roles?: Role | Role[], db: Db = getDb()): User {
  const user = currentUser(db)
  if (!user) throw new ServiceError('Please log in to continue.')
  if (user.status === 'suspended') throw new ServiceError('Your account is suspended. Contact support.')
  const allowed = roles ? (Array.isArray(roles) ? roles : [roles]) : null
  if (allowed && !allowed.includes(user.role)) throw new ServiceError('You do not have permission to do this.')
  return user
}

export function notify(
  draft: Db,
  userId: string | undefined,
  type: NotificationType,
  title: string,
  message: string,
  href?: string,
) {
  if (!userId) return
  const n: Notification = {
    id: uid('n'),
    userId,
    type,
    title,
    message,
    href,
    read: false,
    createdAt: new Date().toISOString(),
  }
  draft.notifications.unshift(n)
}

export function notifyAdmins(draft: Db, type: NotificationType, title: string, message: string, href?: string) {
  for (const admin of draft.users.filter((u) => u.role === 'admin')) notify(draft, admin.id, type, title, message, href)
}
