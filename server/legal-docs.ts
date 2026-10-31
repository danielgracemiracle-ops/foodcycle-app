import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'
import type { LegalDocument } from '@/types'
import { DOC_SPECS, type UploadedDoc } from '@/lib/legal-docs'

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000

function secret() {
  const s = process.env.BETTER_AUTH_SECRET
  if (!s) throw new Error('BETTER_AUTH_SECRET is not set')
  return s
}

const payload = (d: LegalDocument) => [d.kind, d.pathname, d.contentType, d.size, d.uploadedAt].join('|')

export const signDoc = (d: LegalDocument) => createHmac('sha256', secret()).update(payload(d)).digest('base64url')

/** Sniffs the real file type from its first bytes, so a renamed file cannot pass as a PDF or image. */
export function sniffType(bytes: Uint8Array): { contentType: string; ext: string } | null {
  const b = (i: number) => bytes[i]
  if (b(0) === 0x25 && b(1) === 0x50 && b(2) === 0x44 && b(3) === 0x46) return { contentType: 'application/pdf', ext: 'pdf' }
  if (b(0) === 0x89 && b(1) === 0x50 && b(2) === 0x4e && b(3) === 0x47) return { contentType: 'image/png', ext: 'png' }
  if (b(0) === 0xff && b(1) === 0xd8 && b(2) === 0xff) return { contentType: 'image/jpeg', ext: 'jpg' }
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to))
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return { contentType: 'image/webp', ext: 'webp' }
  return null
}

/** Returns an error message when any submitted file was not issued by our upload route. */
export function uploadedDocsProblem(role: 'restaurant' | 'institution', docs: Record<string, UploadedDoc | undefined>): string | null {
  const allowed = new Set(DOC_SPECS[role].map((s) => s.kind))
  for (const [key, doc] of Object.entries(docs)) {
    if (!doc) continue
    if (doc.kind !== key || !allowed.has(doc.kind) || !doc.pathname.startsWith('legal/'))
      return 'One of the uploaded documents is not valid. Please upload it again.'
    const age = Date.now() - Date.parse(doc.uploadedAt)
    if (!(age >= 0 && age < TOKEN_TTL_MS)) return 'An uploaded document has expired. Please upload it again.'
    const { token, ...stored } = doc
    const expected = Buffer.from(signDoc(stored))
    const given = Buffer.from(String(token))
    if (expected.length !== given.length || !timingSafeEqual(expected, given))
      return 'One of the uploaded documents is not valid. Please upload it again.'
  }
  return null
}
