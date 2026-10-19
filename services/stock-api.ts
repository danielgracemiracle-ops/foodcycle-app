import { mutate } from 'swr'
import { ServiceError } from './utils'

export const STOCK_KEY = '/api/stock'

async function request<T>(path: string, method: string, body?: unknown): Promise<T> {
  let res: Response
  try {
    res = await fetch(path, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ServiceError('Could not reach the stock server. Check your connection and try again.')
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new ServiceError(data.error ?? 'The stock server is unavailable. Please try again.')
  return data as T
}

export const fetchStock = () => request<{ stock: Record<string, number> }>(STOCK_KEY, 'GET').then((d) => d.stock)
export const refreshStock = () => mutate(STOCK_KEY)

export const registerStock = (items: { foodId: string; quantity: number }[]) => request(STOCK_KEY, 'POST', { items })

export async function setServerStock(foodId: string, quantity: number) {
  await request(STOCK_KEY, 'PUT', { foodId, quantity })
  void refreshStock()
}

export async function returnStock(items: { foodId: string; quantity: number }[]) {
  await Promise.all(items.map((i) => request(STOCK_KEY, 'PATCH', i)))
  void refreshStock()
}

export async function holdCheckout(key: string, holderId: string, items: { foodId: string; name: string; quantity: number }[]) {
  const result = await request<{ status: 'held' | 'paid'; expiresAt: string }>('/api/checkout', 'POST', { action: 'hold', key, holderId, items })
  void refreshStock()
  return result
}

export const confirmCheckout = (key: string, holderId: string, orderIds: string[]) =>
  request<{ alreadyPaid: boolean; orderIds: string[] }>('/api/checkout', 'POST', { action: 'confirm', key, holderId, orderIds })

export async function releaseCheckout(key: string, holderId: string) {
  await request('/api/checkout', 'POST', { action: 'release', key, holderId })
  void refreshStock()
}
