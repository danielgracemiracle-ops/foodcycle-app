import type { Db } from '@/types'
import { createSeed, DB_VERSION, DEMO_ACCOUNTS } from '@/data/seed'

/**
 * In-memory mock database persisted to localStorage.
 * Every service in /services reads and writes through this module only, so it can be
 * swapped for Supabase queries without touching UI components.
 */

const DB_KEY = 'foodcycle-db'
const AUTH_KEY = 'foodcycle-auth'

export interface DbSnapshot {
  db: Db
  hydrated: boolean
}

let snapshot: DbSnapshot = { db: createSeed(), hydrated: false }
const serverSnapshot = snapshot
const listeners = new Set<() => void>()

function emit() {
  for (const l of listeners) l()
}

function persist(db: Db) {
  try {
    window.localStorage.setItem(DB_KEY, JSON.stringify(db))
  } catch {
    // storage full or disabled — app keeps working in memory
  }
}

export function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const getSnapshot = () => snapshot
export const getServerSnapshot = () => serverSnapshot
export const getDb = () => snapshot.db

export function hydrateDb() {
  if (snapshot.hydrated || typeof window === 'undefined') return
  let db: Db | null = null
  try {
    const raw = window.localStorage.getItem(DB_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Db
      if (parsed.version === DB_VERSION) db = parsed
    }
  } catch {
    db = null
  }
  if (!db) {
    db = createSeed()
    persist(db)
  }
  snapshot = { db, hydrated: true }
  emit()
}

export function commit(mutator: (draft: Db) => void) {
  const draft = structuredClone(snapshot.db)
  mutator(draft)
  snapshot = { db: draft, hydrated: true }
  persist(draft)
  emit()
}

export function resetDb() {
  const session = snapshot.db.session
  const db = createSeed()
  db.session = session && db.users.some((u) => u.id === session.userId) ? session : null
  window.localStorage.removeItem(AUTH_KEY)
  snapshot = { db, hydrated: true }
  persist(db)
  emit()
}

/* ---------- credential vault (stands in for Supabase Auth) ---------- */

function hashPassword(password: string) {
  let h = 5381
  for (let i = 0; i < password.length; i++) h = (h * 33) ^ password.charCodeAt(i)
  return `h$${(h >>> 0).toString(16)}`
}

function readVault(): Record<string, string> {
  const base: Record<string, string> = {}
  for (const a of DEMO_ACCOUNTS) base[a.email] = hashPassword(a.password)
  try {
    const raw = window.localStorage.getItem(AUTH_KEY)
    return raw ? { ...base, ...JSON.parse(raw) } : base
  } catch {
    return base
  }
}

export function verifyPassword(email: string, password: string) {
  return readVault()[email.toLowerCase()] === hashPassword(password)
}

export function setPassword(email: string, password: string) {
  const vault = readVault()
  vault[email.toLowerCase()] = hashPassword(password)
  window.localStorage.setItem(AUTH_KEY, JSON.stringify(vault))
}

export function hasCredentials(email: string) {
  return Boolean(readVault()[email.toLowerCase()])
}
