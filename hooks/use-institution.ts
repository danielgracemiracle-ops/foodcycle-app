'use client'

import type { Db } from '@/types'
import { useCurrentUser, useDb, useHydrated } from '@/hooks/use-db'

const ACTIVE = new Set(['Accepted', 'Restaurant Confirmed', 'Preparing', 'Picked Up', 'Delivered'])

export function institutionData(db: Db, institutionId: string) {
  const institution = db.institutions.find((i) => i.id === institutionId)
  const donations = db.donations
    .filter((d) => d.institutionId === institutionId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const incoming = donations.filter((d) => d.status === 'Purchased')
  const active = donations.filter((d) => ACTIVE.has(d.status))
  const history = donations.filter((d) => d.status === 'Received' || d.status === 'Rejected')
  const received = donations.filter((d) => d.status === 'Received')
  const mealsReceived = received.reduce((s, d) => s + d.quantity, 0)
  const valueReceived = received.reduce((s, d) => s + d.value, 0)
  return { institution, donations, incoming, active, history, received, mealsReceived, valueReceived }
}

/** Returns the signed-in institution's derived data, or null until the store has hydrated. */
export function useInstitutionData() {
  const db = useDb()
  const user = useCurrentUser()
  const hydrated = useHydrated()
  if (!hydrated || !user?.institutionId) return null
  return { db, user, ...institutionData(db, user.institutionId) }
}
