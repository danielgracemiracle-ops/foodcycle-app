import type { InstitutionLegal, RestaurantLegal } from '@/types'

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
}

export const EMPTY_LEGAL: LegalDraft = {
  ownerNik: '', nib: '', npwp: '', foodPermit: '', halalCertificate: '',
  deedNumber: '', skKemenkumham: '', domicileLetter: '', picName: '', picNik: '', beneficiaries: '',
  bankName: '', accountNumber: '', accountHolder: '', agreedRules: false,
}

const digits = (v: string) => v.replace(/\D/g, '')

type Errors = Partial<Record<keyof LegalDraft, string>>

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
    if (digits(d.ownerNik).length !== 16) e.ownerNik = 'NIK must be 16 digits.'
    if (digits(d.nib).length !== 13) e.nib = 'NIB must be 13 digits.'
    if (!d.foodPermit.trim()) e.foodPermit = 'PIRT or SLHS number is required.'
  } else {
    if (!d.deedNumber.trim()) e.deedNumber = 'Deed number is required.'
    if (!d.skKemenkumham.trim()) e.skKemenkumham = 'SK Kemenkumham number is required.'
    if (!d.domicileLetter.trim()) e.domicileLetter = 'Domicile letter number is required.'
    if (!d.picName.trim()) e.picName = 'Person in charge is required.'
    if (digits(d.picNik).length !== 16) e.picNik = 'NIK must be 16 digits.'
    const b = Number(d.beneficiaries)
    if (!Number.isInteger(b) || b < 1 || b > 100000) e.beneficiaries = 'Enter the number of people you serve.'
  }
  validateNpwp(d, e)
  validateBank(d, e)
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
