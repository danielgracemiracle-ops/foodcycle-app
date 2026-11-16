import type { Order, RefundPhoto } from '@/types'

export const REFUND_WINDOW_HOURS = 48
export const REFUND_REASON_MIN = 10
export const REFUND_REASON_MAX = 500
export const REFUND_PHOTO_MIN = 1
export const REFUND_PHOTO_MAX = 3
export const MAX_REFUND_PHOTO_BYTES = 4 * 1024 * 1024
export const REFUND_PHOTO_ACCEPT = 'image/jpeg,image/png,image/webp'

/** A photo returned by the upload route, with a server signature proving it was uploaded by this customer. */
export type UploadedRefundPhoto = RefundPhoto & { token: string }

export const refundPhotoUrl = (pathname: string) => `/api/refund-photos?pathname=${encodeURIComponent(pathname)}`

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
