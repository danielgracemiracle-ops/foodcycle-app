import type { InstitutionLegal, LegalDocument, RestaurantLegal } from '@/types'
import { DOC_SPECS, type DocKind, type UploadedDoc } from '@/lib/legal-docs'

export const BANKS = ['BCA', 'BRI', 'BNI', 'Mandiri', 'BSI', 'CIMB Niaga', 'Permata', 'BTN', 'Danamon', 'Bank Jago', 'SeaBank'] as const

export const RESTAURANT_RULES = [
  'Listings must be safe, edible surplus food with an honest pickup window.',
  'Discount at least 30% from the normal price.',
  'Accounts are suspended below a 3.5 rating or after 3 food-safety complaints.',
]

export const INSTITUTION_RULES = [
  'Set a daily donation limit and confirm every donation you receive.',
  'Donated food must never be resold.',
  'Report changes to your legal documents or bank account to FoodCycle.',
]

export interface LegalDraft {
  ownerNik: string
  nib: string
  npwp: string
  foodPermit: string
  halalCertificate: string
  deedNumber: string
  skKemenkumham: string
  domicileLetter: string
  picName: string
  picNik: string
  beneficiaries: string
  bankName: string
  accountNumber: string
  accountHolder: string
  agreedRules: boolean
  documents: Partial<Record<DocKind, UploadedDoc>>
}

export const EMPTY_LEGAL: LegalDraft = {
  ownerNik: '', nib: '', npwp: '', foodPermit: '', halalCertificate: '',
  deedNumber: '', skKemenkumham: '', domicileLetter: '', picName: '', picNik: '', beneficiaries: '',
  bankName: '', accountNumber: '', accountHolder: '', agreedRules: false, documents: {},
}

const digits = (v: string) => v.replace(/\D/g, '')

export type LegalErrors = Partial<Record<keyof LegalDraft | DocKind, string>>
type Errors = LegalErrors

const PROVINCE_CODES = new Set([
  11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 31, 32, 33, 34, 35, 36, 51, 52, 53,
  61, 62, 63, 64, 65, 71, 72, 73, 74, 75, 76, 81, 82, 91, 92, 93, 94, 95, 96, 97,
])

/** Structural NIK check: province code, birth date (day +40 for women) and serial. */
export function nikProblem(raw: string): string | null {
  const v = digits(raw)
  if (v.length !== 16) return 'NIK must be 16 digits.'
  if (!PROVINCE_CODES.has(Number(v.slice(0, 2)))) return 'NIK province code is not valid.'
  const day = Number(v.slice(6, 8))
  const month = Number(v.slice(8, 10))
  const realDay = day > 40 ? day - 40 : day
  if (realDay < 1 || realDay > 31 || month < 1 || month > 12) return 'NIK birth date is not valid.'
  if (v.slice(12) === '0000') return 'NIK serial number is not valid.'
  return null
}

function validateDocuments(role: 'restaurant' | 'institution', d: LegalDraft, e: Errors) {
  for (const spec of DOC_SPECS[role]) {
    if (spec.required && !d.documents[spec.kind]) e[spec.kind] = `Upload the ${spec.label}.`
  }
  if (role === 'restaurant' && d.halalCertificate.trim() && !d.documents.halalDoc)
    e.halalDoc = 'Upload the halal certificate for the number you entered.'
}

const toDocuments = (role: 'restaurant' | 'institution', d: LegalDraft): LegalDocument[] =>
  DOC_SPECS[role].flatMap((s) => {
    const doc = d.documents[s.kind]
    if (!doc) return []
    const { token: _token, ...stored } = doc
    return [stored]
  })

function validateBank(d: LegalDraft, e: Errors) {
  if (!BANKS.includes(d.bankName as (typeof BANKS)[number])) e.bankName = 'Choose a bank.'
  const acc = digits(d.accountNumber)
  if (acc.length < 6 || acc.length > 20) e.accountNumber = 'Account number must be 6–20 digits.'
  if (!d.accountHolder.trim()) e.accountHolder = 'Account holder name is required.'
}

function validateNpwp(d: LegalDraft, e: Errors) {
  const n = digits(d.npwp).length
  if (n !== 15 && n !== 16) e.npwp = 'NPWP must be 15 or 16 digits.'
}

export function validateLegal(role: 'restaurant' | 'institution', d: LegalDraft): Errors {
  const e: Errors = {}
  if (role === 'restaurant') {
    const nik = nikProblem(d.ownerNik)
    if (nik) e.ownerNik = nik
    if (digits(d.nib).length !== 13) e.nib = 'NIB must be 13 digits.'
    if (!d.foodPermit.trim()) e.foodPermit = 'PIRT or SLHS number is required.'
  } else {
    if (!d.deedNumber.trim()) e.deedNumber = 'Deed number is required.'
    if (!d.skKemenkumham.trim()) e.skKemenkumham = 'SK Kemenkumham number is required.'
    if (!d.domicileLetter.trim()) e.domicileLetter = 'Domicile letter number is required.'
    if (!d.picName.trim()) e.picName = 'Person in charge is required.'
    const picNik = nikProblem(d.picNik)
    if (picNik) e.picNik = picNik
    const b = Number(d.beneficiaries)
    if (!Number.isInteger(b) || b < 1 || b > 100000) e.beneficiaries = 'Enter the number of people you serve.'
  }
  validateNpwp(d, e)
  validateBank(d, e)
  validateDocuments(role, d, e)
  if (!d.agreedRules) e.agreedRules = 'You must accept the partner rules.'
  return e
}

const bankOf = (d: LegalDraft) => ({ bankName: d.bankName, accountNumber: digits(d.accountNumber), accountHolder: d.accountHolder.trim() })

export function toRestaurantLegal(d: LegalDraft): RestaurantLegal {
  return {
    ownerNik: digits(d.ownerNik),
    nib: digits(d.nib),
    npwp: digits(d.npwp),
    foodPermit: d.foodPermit.trim(),
    halalCertificate: d.halalCertificate.trim() || undefined,
    documents: toDocuments('restaurant', d),
    bank: bankOf(d),
    agreedRules: d.agreedRules,
    submittedAt: new Date().toISOString(),
  }
}

export function toInstitutionLegal(d: LegalDraft): InstitutionLegal {
  return {
    deedNumber: d.deedNumber.trim(),
    skKemenkumham: d.skKemenkumham.trim(),
    npwp: digits(d.npwp),
    domicileLetter: d.domicileLetter.trim(),
    picName: d.picName.trim(),
    picNik: digits(d.picNik),
    beneficiaries: Number(d.beneficiaries),
    documents: toDocuments('institution', d),
    bank: bankOf(d),
    agreedRules: d.agreedRules,
    submittedAt: new Date().toISOString(),
  }
}

export const mask = (v: string, visible = 4) => (v.length <= visible ? v : `${'•'.repeat(Math.min(v.length - visible, 8))}${v.slice(-visible)}`)

export function formatNpwp(v: string) {
  const d = digits(v)
  if (d.length !== 15) return d
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}.${d.slice(8, 9)}-${d.slice(9, 12)}.${d.slice(12)}`
}
