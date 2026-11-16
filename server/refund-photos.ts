import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'
import type { RefundPhoto } from '@/types'
import { REFUND_PHOTO_MAX, REFUND_PHOTO_MIN } from '@/lib/refund'

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000
const PREFIX = 'refunds/'

function secret() {
  const s = process.env.BETTER_AUTH_SECRET
  if (!s) throw new Error('BETTER_AUTH_SECRET is not set')
  return s
}

/** Binds the photo to the uploading customer so a token can't be reused on someone else's request. */
export function signRefundPhoto(userId: string, p: RefundPhoto) {
  const payload = ['refund-photo', userId, p.pathname, p.contentType, p.size, p.uploadedAt].join('|')
  return createHmac('sha256', secret()).update(payload).digest('base64url')
}

export const isRefundPhotoPath = (pathname: string) => pathname.startsWith(PREFIX) && !pathname.includes('..')
export const refundPhotoPath = (id: string, ext: string) => `${PREFIX}${id}.${ext}`

/** Validates photos sent with a refund request; returns the clean records or an error message. */
export function verifyRefundPhotos(userId: string, input: unknown): { photos: RefundPhoto[] } | { error: string } {
  const list = Array.isArray(input) ? input : []
  if (list.length < REFUND_PHOTO_MIN) return { error: 'Please add at least one photo of the problem.' }
  if (list.length > REFUND_PHOTO_MAX) return { error: `You can add up to ${REFUND_PHOTO_MAX} photos.` }
  const invalid = { error: 'One of the photos is not valid. Please upload it again.' }
  const seen = new Set<string>()
  const photos: RefundPhoto[] = []
  for (const raw of list) {
    if (!raw || typeof raw !== 'object') return invalid
    const { pathname, contentType, size, uploadedAt, token } = raw as Record<string, unknown>
    if (typeof pathname !== 'string' || !isRefundPhotoPath(pathname) || seen.has(pathname)) return invalid
    if (typeof contentType !== 'string' || typeof size !== 'number' || typeof uploadedAt !== 'string') return invalid
    const age = Date.now() - Date.parse(uploadedAt)
    if (!(age >= 0 && age < TOKEN_TTL_MS)) return { error: 'A photo has expired. Please upload it again.' }
    const photo: RefundPhoto = { pathname, contentType, size, uploadedAt }
    const expected = Buffer.from(signRefundPhoto(userId, photo))
    const given = Buffer.from(String(token))
    if (expected.length !== given.length || !timingSafeEqual(expected, given)) return invalid
    seen.add(pathname)
    photos.push(photo)
  }
  return { photos }
}
