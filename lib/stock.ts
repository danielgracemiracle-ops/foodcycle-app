import { and, eq, gte, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { checkouts, foodStock, stockHolds } from '@/lib/db/schema'

export const HOLD_MINUTES = 10

type Executor = Pick<typeof db, 'execute'>

export class StockError extends Error {
  constructor(
    message: string,
    public status = 400,
    public extra: Record<string, unknown> = {},
  ) {
    super(message)
  }
}

export interface HoldItem {
  foodId: string
  name: string
  quantity: number
}

/** Returns the stock of every unpaid checkout whose 10-minute hold has run out. */
async function releaseExpiredHolds(executor: Executor) {
  await executor.execute(sql`
    WITH expired AS (
      UPDATE checkouts SET status = 'expired'
      WHERE status = 'held' AND expires_at < now()
      RETURNING idempotency_key
    ), returned AS (
      SELECT h.food_id, SUM(h.quantity)::int AS qty
      FROM stock_holds h JOIN expired e ON e.idempotency_key = h.checkout_key
      GROUP BY h.food_id
    )
    UPDATE food_stock s SET quantity = s.quantity + r.qty, updated_at = now()
    FROM returned r WHERE s.food_id = r.food_id
  `)
}

export async function getAllStock(): Promise<Record<string, number>> {
  await releaseExpiredHolds(db)
  const rows = await db.select({ foodId: foodStock.foodId, quantity: foodStock.quantity }).from(foodStock)
  return Object.fromEntries(rows.map((r) => [r.foodId, r.quantity]))
}

/** Registers foods the server has not seen yet; existing counts are never overwritten. */
export async function registerStock(items: { foodId: string; quantity: number }[]) {
  if (items.length === 0) return
  await db.insert(foodStock).values(items).onConflictDoNothing()
}

export async function setStock(foodId: string, quantity: number) {
  await db
    .insert(foodStock)
    .values({ foodId, quantity })
    .onConflictDoUpdate({ target: foodStock.foodId, set: { quantity, updatedAt: new Date() } })
}

export async function restock(foodId: string, quantity: number) {
  await db
    .update(foodStock)
    .set({ quantity: sql`${foodStock.quantity} + ${quantity}`, updatedAt: new Date() })
    .where(eq(foodStock.foodId, foodId))
}

export async function holdStock(key: string, holderId: string, items: HoldItem[]) {
  return db.transaction(async (tx) => {
    await releaseExpiredHolds(tx)

    const [created] = await tx
      .insert(checkouts)
      .values({ idempotencyKey: key, holderId, expiresAt: new Date(Date.now() + HOLD_MINUTES * 60_000) })
      .onConflictDoNothing()
      .returning()

    if (!created) {
      const [existing] = await tx.select().from(checkouts).where(eq(checkouts.idempotencyKey, key))
      if (!existing || existing.holderId !== holderId) throw new StockError('Checkout not found.', 404)
      if (existing.status === 'held' || existing.status === 'paid')
        return { status: existing.status, expiresAt: existing.expiresAt.toISOString() }
      throw new StockError('This checkout has expired. Please check out again.', 410)
    }

    // Lock rows in a stable order so two overlapping checkouts can never deadlock.
    const sorted = [...items].sort((a, b) => a.foodId.localeCompare(b.foodId))
    for (const item of sorted) {
      const [row] = await tx
        .update(foodStock)
        .set({ quantity: sql`${foodStock.quantity} - ${item.quantity}`, updatedAt: new Date() })
        .where(and(eq(foodStock.foodId, item.foodId), gte(foodStock.quantity, item.quantity)))
        .returning({ quantity: foodStock.quantity })

      if (!row) {
        const [current] = await tx
          .select({ quantity: foodStock.quantity })
          .from(foodStock)
          .where(eq(foodStock.foodId, item.foodId))
        const available = current?.quantity ?? 0
        throw new StockError(
          available === 0
            ? `${item.name} just sold out — another customer got the last portion.`
            : `Only ${available} portion(s) of ${item.name} left — another customer just bought some. Please lower the quantity.`,
          409,
          { foodId: item.foodId, available },
        )
      }
    }

    await tx.insert(stockHolds).values(sorted.map((i) => ({ checkoutKey: key, foodId: i.foodId, quantity: i.quantity })))
    return { status: 'held' as const, expiresAt: created.expiresAt.toISOString() }
  })
}

export async function confirmCheckout(key: string, holderId: string, orderIds: string[]) {
  return db.transaction(async (tx) => {
    await releaseExpiredHolds(tx)

    const [paid] = await tx
      .update(checkouts)
      .set({ status: 'paid', orderIds })
      .where(and(eq(checkouts.idempotencyKey, key), eq(checkouts.holderId, holderId), eq(checkouts.status, 'held')))
      .returning()
    if (paid) return { alreadyPaid: false, orderIds }

    const [existing] = await tx.select().from(checkouts).where(eq(checkouts.idempotencyKey, key))
    if (existing && existing.holderId === holderId && existing.status === 'paid')
      return { alreadyPaid: true, orderIds: existing.orderIds }
    throw new StockError('Your 10-minute stock hold has expired. Please go back to checkout to reserve the food again.', 410)
  })
}

export async function releaseCheckout(key: string, holderId: string) {
  return db.transaction(async (tx) => {
    const [released] = await tx
      .update(checkouts)
      .set({ status: 'released' })
      .where(and(eq(checkouts.idempotencyKey, key), eq(checkouts.holderId, holderId), eq(checkouts.status, 'held')))
      .returning()
    if (!released) return { released: false }

    await tx.execute(sql`
      UPDATE food_stock s SET quantity = s.quantity + h.qty, updated_at = now()
      FROM (
        SELECT food_id, SUM(quantity)::int AS qty FROM stock_holds
        WHERE checkout_key = ${key} GROUP BY food_id
      ) h
      WHERE s.food_id = h.food_id
    `)
    return { released: true }
  })
}
