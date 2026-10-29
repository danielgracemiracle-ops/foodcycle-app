import type { LegalDocument } from '@/types'

export type DocKind =
  | 'ownerKtp'
  | 'nibDoc'
  | 'foodPermitDoc'
  | 'halalDoc'
  | 'deedDoc'
  | 'skDoc'
  | 'domicileDoc'
  | 'picKtp'

export interface DocSpec {
  kind: DocKind
  label: string
  required: boolean
}

export const DOC_SPECS: Record<'restaurant' | 'institution', DocSpec[]> = {
  restaurant: [
    { kind: 'ownerKtp', label: 'Owner KTP photo', required: true },
    { kind: 'nibDoc', label: 'NIB certificate (OSS)', required: true },
    { kind: 'foodPermitDoc', label: 'PIRT / SLHS certificate', required: true },
    { kind: 'halalDoc', label: 'Halal certificate', required: false },
  ],
  institution: [
    { kind: 'deedDoc', label: 'Deed of establishment', required: true },
    { kind: 'skDoc', label: 'SK Kemenkumham', required: true },
    { kind: 'domicileDoc', label: 'Domicile letter', required: true },
    { kind: 'picKtp', label: 'Person in charge KTP photo', required: true },
  ],
}

export const ALL_DOC_KINDS = new Set<DocKind>([...DOC_SPECS.restaurant, ...DOC_SPECS.institution].map((s) => s.kind))

export const DOC_LABEL = Object.fromEntries(
  [...DOC_SPECS.restaurant, ...DOC_SPECS.institution].map((s) => [s.kind, s.label]),
) as Record<DocKind, string>

export const MAX_DOC_BYTES = 4 * 1024 * 1024
export const DOC_ACCEPT = 'image/jpeg,image/png,image/webp,application/pdf'
export const DOC_HINT = 'JPG, PNG, WEBP or PDF · max 4 MB'

/** An upload as returned by /api/legal-docs. The token proves the server accepted it. */
export interface UploadedDoc extends LegalDocument {
  token: string
}

export const docUrl = (pathname: string) => `/api/legal-docs?pathname=${encodeURIComponent(pathname)}`

export function formatBytes(n: number) {
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}
