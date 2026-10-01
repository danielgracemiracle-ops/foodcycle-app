import type { Db, SocialInstitution } from '@/types'

function isSameLocalDay(iso: string, now: Date) {
  const d = new Date(iso)
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
}

/** Meals already donated to an institution today. Cancelled/refunded donations free their capacity again. */
export function institutionUsedToday(db: Db, institutionId: string, now = new Date()) {
  return db.donations
    .filter((d) => d.institutionId === institutionId && d.status !== 'Rejected' && isSameLocalDay(d.createdAt, now))
    .reduce((s, d) => s + d.quantity, 0)
}

export function institutionCapacity(db: Db, institution: SocialInstitution, now = new Date()) {
  const limit = institution.maxDailyCapacity
  const used = institutionUsedToday(db, institution.id, now)
  const remaining = Math.max(0, limit - used)
  return { limit, used, remaining, isFull: remaining === 0 }
}

export function limitErrorMessage(institution: SocialInstitution, remaining: number, requested: number) {
  if (remaining === 0)
    return `${institution.name} has reached its daily limit of ${institution.maxDailyCapacity} meals. Please choose another institution or try again tomorrow.`
  return `${institution.name} can only receive ${remaining} more meal(s) today, but your cart has ${requested}. Reduce the quantity or choose another institution.`
}
