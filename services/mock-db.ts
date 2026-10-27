import type { Db } from '@/types'
import { createSeed } from '@/data/seed'

/**
 * Client-side cache of the server state. The server (Neon) is the source of truth;
 * this store only holds the latest snapshot returned by `loadState`.
 */

export interface DbSnapshot {
  db: Db
  hydrated: boolean
}

const placeholder = createSeed()
placeholder.session = null

let snapshot: DbSnapshot = { db: placeholder, hydrated: false }
const serverSnapshot = snapshot
const listeners = new Set<() => void>()

export function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const getSnapshot = () => snapshot
export const getServerSnapshot = () => serverSnapshot

export function setDb(db: Db) {
  snapshot = { db, hydrated: true }
  for (const l of listeners) l()
}
