import type { Role } from '@/types'
import type { LegalDraft } from '@/lib/registration'

export const ROLE_HOME: Record<Role, string> = {
  customer: '/home',
  restaurant: '/restaurant',
  institution: '/institution',
  admin: '/admin',
}

export interface RegisterInput {
  role: Role
  name: string
  email: string
  password: string
  phone?: string
  location?: string
  organization?: string
  legal?: LegalDraft
}
