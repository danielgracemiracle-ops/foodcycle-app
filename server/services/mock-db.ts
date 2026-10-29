import 'server-only'
import { AsyncLocalStorage } from 'node:async_hooks'
import type { Db } from '@/types'

/**
 * Request-scoped view of the shared app document stored in Neon.
 * `server/runtime.ts` loads the document under a row lock, runs a service inside
 * this context, and writes it back only when a service called `commit`.
 */

export interface DbContext {
  db: Db
  dirty: boolean
  nextval?: (sequence: 'order_number_seq' | 'donation_number_seq') => Promise<number>
}

export const dbContext = new AsyncLocalStorage<DbContext>()

function context() {
  const ctx = dbContext.getStore()
  if (!ctx) throw new Error('Service called outside of a database context')
  return ctx
}

export const getDb = () => context().db

/** Database-generated, gap-tolerant and collision-free numbers (Postgres sequences are never reused). */
export async function nextNumber(sequence: 'order_number_seq' | 'donation_number_seq') {
  const nextval = context().nextval
  if (!nextval) throw new Error('Sequence access requires a write context')
  return nextval(sequence)
}

export function commit(mutator: (draft: Db) => void) {
  const ctx = context()
  const draft = structuredClone(ctx.db)
  mutator(draft)
  ctx.db = draft
  ctx.dirty = true
}
