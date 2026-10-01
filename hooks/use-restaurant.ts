'use client'

import { useCurrentUser, useDb, useHydrated } from '@/hooks/use-db'
import { restaurantData } from '@/lib/restaurant'

/** Returns the signed-in restaurant's derived data, or null until the store has hydrated. */
export function useRestaurantData() {
  const db = useDb()
  const user = useCurrentUser()
  const hydrated = useHydrated()
  if (!hydrated || !user?.restaurantId) return null
  return { db, user, ...restaurantData(db, user.restaurantId) }
}
