import 'server-only'
import { headers } from 'next/headers'
import type { PoolClient } from 'pg'
import type { Db } from '@/types'
import { createSeed } from '@/data/seed'
import { auth } from '@/lib/auth'
import { pool } from '@/lib/db'
import { dbContext } from './services/mock-db'

async function loadDoc(client: PoolClient, lock: boolean): Promise<Db> {
  const res = await client.query<{ doc: Db }>(`SELECT doc FROM app_state WHERE id = 1${lock ? ' FOR UPDATE' : ''}`)
  if (res.rowCount) return res.rows[0].doc
  const seed = createSeed()
  seed.session = null
  await client.query(
    'INSERT INTO app_state (id, doc, updated_at) VALUES (1, $1, now()) ON CONFLICT (id) DO NOTHING',
    [JSON.stringify(seed)],
  )
  const again = await client.query<{ doc: Db }>(`SELECT doc FROM app_state WHERE id = 1${lock ? ' FOR UPDATE' : ''}`)
  return again.rows[0].doc
}

async function attachSession(db: Db) {
  db.session = null
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return
  const email = session.user.email.toLowerCase()
  const user = db.users.find((u) => u.email.toLowerCase() === email)
  if (user)
    db.session = {
      userId: user.id,
      createdAt: new Date(session.session.createdAt).toISOString(),
      device: session.session.userAgent ?? 'Unknown device',
    }
}

/** Runs a service against the shared document. Writes are serialized by the row lock. */
export async function withAppDb<T>(fn: () => Promise<T>): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const db = await loadDoc(client, true)
    await attachSession(db)
    const ctx = {
      db,
      dirty: false,
      nextval: async (sequence: 'order_number_seq' | 'donation_number_seq') => {
        const res = await client.query<{ n: string }>('SELECT nextval($1::regclass) AS n', [sequence])
        return Number(res.rows[0].n)
      },
    }
    const result = await dbContext.run(ctx, fn)
    if (ctx.dirty)
      await client.query('UPDATE app_state SET doc = $1, updated_at = now() WHERE id = 1', [
        JSON.stringify({ ...ctx.db, session: null }),
      ])
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    throw error
  } finally {
    client.release()
  }
}

/** Read-only snapshot with the current session attached. */
export async function readAppDb(): Promise<Db> {
  const client = await pool.connect()
  try {
    const db = await loadDoc(client, false)
    await attachSession(db)
    return db
  } finally {
    client.release()
  }
}
