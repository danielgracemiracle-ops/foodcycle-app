import type { Order } from '@/types'

export const REFUND_WINDOW_HOURS = 48
export const REFUND_REASON_MIN = 10
export const REFUND_REASON_MAX = 500

/** When the customer received the order, or undefined if it isn't finished yet. */
export function receivedAt(order: Order): string | undefined {
  if (order.status !== 'Completed' && order.status !== 'Picked Up') return undefined
  const event = [...order.history].reverse().find((h) => h.status === 'Picked Up' || h.status === 'Completed')
  return event?.at
}

/** Refund requests are accepted for finished orders within the window after receipt. */
export function refundDeadline(order: Order): Date | undefined {
  const at = receivedAt(order)
  if (!at) return undefined
  return new Date(new Date(at).getTime() + REFUND_WINDOW_HOURS * 3600_000)
}
