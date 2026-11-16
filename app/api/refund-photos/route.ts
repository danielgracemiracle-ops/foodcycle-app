import { randomUUID } from 'node:crypto'
import { get, put } from '@vercel/blob'
import { type NextRequest, NextResponse } from 'next/server'
import type { RefundPhoto } from '@/types'
import { MAX_REFUND_PHOTO_BYTES, type UploadedRefundPhoto } from '@/lib/refund'
import { readAppDb } from '@/server/runtime'
import { sniffType } from '@/server/legal-docs'
import { isRefundPhotoPath, refundPhotoPath, signRefundPhoto } from '@/server/refund-photos'

export const runtime = 'nodejs'

const fail = (error: string, status = 400) => NextResponse.json({ error }, { status })

function isSameOrigin(req: NextRequest) {
  const site = req.headers.get('sec-fetch-site')
  if (site) return site === 'same-origin'
  const origin = req.headers.get('origin')
  return !!origin && new URL(origin).host === req.headers.get('host')
}

async function currentUser() {
  const db = await readAppDb()
  const user = db.session && db.users.find((u) => u.id === db.session?.userId)
  return { db, user }
}

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return fail('Uploads must come from the FoodCycle app.', 403)
  const { user } = await currentUser()
  if (!user) return fail('Please log in.', 401)
  if (user.role !== 'customer') return fail('Only customers can upload refund photos.', 403)

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return fail('Send the photo as form data.')
  }
  const file = form.get('file')
  if (!(file instanceof File) || file.size === 0) return fail('Choose a photo to upload.')
  if (file.size > MAX_REFUND_PHOTO_BYTES) return fail('The photo is larger than 4 MB.')

  const bytes = new Uint8Array(await file.arrayBuffer())
  const type = sniffType(bytes)
  if (!type || !type.contentType.startsWith('image/')) return fail('Only JPG, PNG or WEBP photos are accepted.')

  try {
    const blob = await put(refundPhotoPath(randomUUID(), type.ext), Buffer.from(bytes), {
      access: 'private',
      contentType: type.contentType,
      addRandomSuffix: false,
    })
    const photo: RefundPhoto = {
      pathname: blob.pathname,
      contentType: type.contentType,
      size: file.size,
      uploadedAt: new Date().toISOString(),
    }
    const uploaded: UploadedRefundPhoto = { ...photo, token: signRefundPhoto(user.id, photo) }
    return NextResponse.json(uploaded)
  } catch (error) {
    console.error('[refund-photos] upload failed', error)
    return fail('Upload failed. Please try again.', 500)
  }
}

export async function GET(req: NextRequest) {
  const pathname = req.nextUrl.searchParams.get('pathname') ?? ''
  if (!isRefundPhotoPath(pathname)) return fail('Not found', 404)

  const { db, user } = await currentUser()
  if (!user) return fail('Please log in.', 401)

  const refund = db.refunds.find((r) => r.photos?.some((p) => p.pathname === pathname))
  if (!refund) return fail('Not found', 404)
  const order = db.orders.find((o) => o.id === refund.orderId)
  const allowed =
    user.role === 'admin' ||
    refund.userId === user.id ||
    (user.role === 'restaurant' && !!order && !!user.restaurantId && order.restaurantId === user.restaurantId)
  if (!allowed) return fail('Not found', 404)

  try {
    const result = await get(pathname, { access: 'private' })
    if (!result || result.statusCode !== 200) return fail('Not found', 404)
    return new NextResponse(result.stream, {
      headers: {
        'Content-Type': result.blob.contentType,
        'Content-Disposition': 'inline',
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    console.error('[refund-photos] read failed', error)
    return fail('Could not load the photo.', 500)
  }
}
