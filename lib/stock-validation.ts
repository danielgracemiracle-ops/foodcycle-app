import { StockError } from '@/lib/stock'

const MAX_ITEMS = 50

export function asId(value: unknown, field: string): string {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(value)) throw new StockError(`Invalid ${field}.`)
  return value
}

export function asQuantity(value: unknown, min = 0, max = 1000): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max)
    throw new StockError(`Quantity must be a whole number between ${min} and ${max}.`)
  return value
}

export function asName(value: unknown): string {
  return typeof value === 'string' ? value.slice(0, 120) : 'This item'
}

export function asArray(value: unknown, field: string): unknown[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_ITEMS) throw new StockError(`Invalid ${field}.`)
  return value
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json()
    if (body && typeof body === 'object') return body as Record<string, unknown>
  } catch {}
  throw new StockError('Invalid request body.')
}

export function errorResponse(error: unknown) {
  if (error instanceof StockError) return Response.json({ error: error.message, ...error.extra }, { status: error.status })
  console.error('[stock] unexpected error', error)
  return Response.json({ error: 'The stock server is unavailable. Please try again.' }, { status: 500 })
}
