import { describe, expect, it, vi } from 'vitest'
import { asArray, asId, asQuantity, errorResponse, readJson } from '@/lib/stock-validation'
import { StockError } from '@/lib/stock'

describe('Stock API input validation (lib/stock-validation.ts)', () => {
  it('IT-S01: rejects ids that could carry injection payloads', () => {
    expect(asId('food_123', 'foodId')).toBe('food_123')
    expect(() => asId("1'; DROP TABLE foods;--", 'foodId')).toThrow(StockError)
    expect(() => asId(42, 'foodId')).toThrow(StockError)
  })

  it('IT-S02: quantities must be whole numbers inside the allowed range', () => {
    expect(asQuantity(3, 1, 10)).toBe(3)
    expect(() => asQuantity(0, 1, 10)).toThrow()
    expect(() => asQuantity(1.5, 1, 10)).toThrow()
    expect(() => asQuantity(11, 1, 10)).toThrow()
    expect(() => asQuantity('3', 1, 10)).toThrow()
  })

  it('IT-S03: item lists must be non-empty and capped at 50', () => {
    expect(() => asArray([], 'items')).toThrow()
    expect(() => asArray(new Array(51).fill(1), 'items')).toThrow()
    expect(asArray([1], 'items')).toEqual([1])
  })

  it('IT-S04: request body parsing rejects malformed JSON', async () => {
    const ok = new Request('http://x', { method: 'POST', body: JSON.stringify({ a: 1 }) })
    expect(await readJson(ok)).toEqual({ a: 1 })
    const bad = new Request('http://x', { method: 'POST', body: '{not json' })
    await expect(readJson(bad)).rejects.toThrow(StockError)
  })

  it('IT-S05: known errors keep their status; unknown errors hide internals behind a 500', async () => {
    const known = errorResponse(new StockError('Sold out', 409, { available: 0 }))
    expect(known.status).toBe(409)
    expect(await known.json()).toEqual({ error: 'Sold out', available: 0 })

    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const unknown = errorResponse(new Error('connection string leaked'))
    expect(unknown.status).toBe(500)
    expect(JSON.stringify(await unknown.json())).not.toContain('connection string')
    spy.mockRestore()
  })
})
