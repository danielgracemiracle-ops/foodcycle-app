import 'server-only'
import { AsyncLocalStorage } from 'node:async_hooks'
import type { Db } from '@/types'

/**
 * Request-scoped view of the shared app document stored in Neon.
 * `server/runtime.ts` loads the document under a row lock, runs a service inside
 * this context, and writes it back only when a service called `commit`.
 */

export type Sequence = 'order_number_seq' | 'donation_number_seq' | 'payment_number_seq'

export interface DbContext {
  db: Db
  dirty: boolean
  nextval?: (sequence: Sequence) => Promise<number>
  /** Raw query on the same transaction as the document write, so both commit or roll back together. */
  sql?: <R extends Record<string, unknown>>(text: string, params?: unknown[]) => Promise<R[]>
}

export const dbContext = new AsyncLocalStorage<DbContext>()

function context() {
  const ctx = dbContext.getStore()
  if (!ctx) throw new Error('Service called outside of a database context')
  return ctx
}

export const getDb = () => context().db

/** Database-generated, gap-tolerant and collision-free numbers (Postgres sequences are never reused). */
export async function nextNumber(sequence: Sequence) {
  const nextval = context().nextval
  if (!nextval) throw new Error('Sequence access requires a write context')
  return nextval(sequence)
}

export async function txQuery<R extends Record<string, unknown>>(text: string, params?: unknown[]) {
  const sql = context().sql
  if (!sql) throw new Error('SQL access requires a write context')
  return sql<R>(text, params)
}

export function commit(mutator: (draft: Db) => void) {
  const ctx = context()
  const draft = structuredClone(ctx.db)
  mutator(draft)
  ctx.db = draft
  ctx.dirty = true
}
