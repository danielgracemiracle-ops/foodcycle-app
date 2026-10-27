import 'server-only'
import { pool } from '@/lib/db'
import * as stock from '@/lib/stock'
import { ServiceError } from './utils'

/** Checkouts one account may start in the rolling window before being rate limited. */
const MAX_CHECKOUTS_PER_WINDOW = 6
const WINDOW_MINUTES = 10

export async function registerStock(items: { foodId: string; quantity: number }[]) {
  await stock.registerStock(items)
}

export async function setServerStock(foodId: string, quantity: number) {
  await stock.setStock(foodId, quantity)
}

export async function returnStock(items: { foodId: string; quantity: number }[]) {
  for (const item of items) await stock.restock(item.foodId, item.quantity)
}

export async function holdCheckout(key: string, holderId: string, items: stock.HoldItem[]) {
  const recent = await pool.query<{ total: string; active: string }>(
    `SELECT count(*) AS total,
            count(*) FILTER (WHERE status = 'held' AND expires_at > now()) AS active
       FROM checkouts
      WHERE holder_id = $1 AND created_at > now() - make_interval(mins => $2)`,
    [holderId, WINDOW_MINUTES],
  )
  const { total, active } = recent.rows[0]
  if (Number(active) > 0)
    throw new ServiceError('You already have a checkout in progress. Finish or cancel it before starting another.')
  if (Number(total) >= MAX_CHECKOUTS_PER_WINDOW)
    throw new ServiceError('Too many checkout attempts. Please wait a few minutes and try again.')
  try {
    return await stock.holdStock(key, holderId, items)
  } catch (error) {
    if (error instanceof stock.StockError) throw new ServiceError(error.message)
    throw error
  }
}

export async function confirmCheckout(key: string, holderId: string, orderIds: string[]) {
  try {
    return await stock.confirmCheckout(key, holderId, orderIds)
  } catch (error) {
    if (error instanceof stock.StockError) throw new ServiceError(error.message)
    throw error
  }
}

export async function releaseCheckout(key: string, holderId: string) {
  await stock.releaseCheckout(key, holderId)
}

/** Stock lives on the server now, so there is no client cache to refresh. */
export async function refreshStock() {}
