import { randomUUID } from 'node:crypto'
import { get, put } from '@vercel/blob'
import { type NextRequest, NextResponse } from 'next/server'
import type { LegalDocument } from '@/types'
import { ALL_DOC_KINDS, MAX_DOC_BYTES, type DocKind, type UploadedDoc } from '@/lib/legal-docs'
import { readAppDb } from '@/server/runtime'
import { signDoc, sniffType } from '@/server/legal-docs'

export const runtime = 'nodejs'

const fail = (error: string, status = 400) => NextResponse.json({ error }, { status })

function isSameOrigin(req: NextRequest) {
  const site = req.headers.get('sec-fetch-site')
  if (site) return site === 'same-origin'
  const origin = req.headers.get('origin')
  return !!origin && new URL(origin).host === req.headers.get('host')
}

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return fail('Uploads must come from the FoodCycle app.', 403)
  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return fail('Send the file as form data.')
  }
  const kind = String(form.get('kind') ?? '') as DocKind
  const file = form.get('file')
  if (!ALL_DOC_KINDS.has(kind)) return fail('Unknown document type.')
  if (!(file instanceof File) || file.size === 0) return fail('Choose a file to upload.')
  if (file.size > MAX_DOC_BYTES) return fail('The file is larger than 4 MB.')

  const bytes = new Uint8Array(await file.arrayBuffer())
  const type = sniffType(bytes)
  if (!type) return fail('Only JPG, PNG, WEBP or PDF files are accepted.')

  try {
    const blob = await put(`legal/${randomUUID()}.${type.ext}`, Buffer.from(bytes), {
      access: 'private',
      contentType: type.contentType,
      addRandomSuffix: false,
    })
    const doc: LegalDocument = {
      kind,
      pathname: blob.pathname,
      name: file.name.slice(0, 120) || `document.${type.ext}`,
      contentType: type.contentType,
      size: file.size,
      uploadedAt: new Date().toISOString(),
    }
    const uploaded: UploadedDoc = { ...doc, token: signDoc(doc) }
    return NextResponse.json(uploaded)
  } catch (error) {
    console.error('[legal-docs] upload failed', error)
    return fail('Upload failed. Please try again.', 500)
  }
}

export async function GET(req: NextRequest) {
  const pathname = req.nextUrl.searchParams.get('pathname') ?? ''
  if (!pathname.startsWith('legal/')) return fail('Not found', 404)

  const db = await readAppDb()
  const user = db.session && db.users.find((u) => u.id === db.session?.userId)
  if (!user) return fail('Please log in.', 401)

  const owns = (docs?: LegalDocument[]) => !!docs?.some((d) => d.pathname === pathname)
  const allowed =
    user.role === 'admin' ||
    db.restaurants.some((r) => r.id === user.restaurantId && owns(r.legal?.documents)) ||
    db.institutions.some((i) => i.id === user.institutionId && owns(i.legal?.documents))
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
    console.error('[legal-docs] read failed', error)
    return fail('Could not load the file.', 500)
  }
}
