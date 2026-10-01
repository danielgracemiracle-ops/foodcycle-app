'use client'

import { useCallback, useState, useSyncExternalStore } from 'react'
import { toast } from 'sonner'
import type { Db, Restaurant, SocialInstitution, User } from '@/types'
import { getServerSnapshot, getSnapshot, subscribe } from '@/services/mock-db'

/** Reactive read access to the mock database. Swap for SWR + Supabase queries later. */
export function useDbSnapshot() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

export function useDb(): Db {
  return useDbSnapshot().db
}

export function useHydrated() {
  return useDbSnapshot().hydrated
}

export function useCurrentUser(): User | null {
  const db = useDb()
  if (!db.session) return null
  return db.users.find((u) => u.id === db.session!.userId) ?? null
}

export function useMyRestaurant(): Restaurant | undefined {
  const db = useDb()
  const user = useCurrentUser()
  return db.restaurants.find((r) => r.id === user?.restaurantId)
}

export function useMyInstitution(): SocialInstitution | undefined {
  const db = useDb()
  const user = useCurrentUser()
  return db.institutions.find((i) => i.id === user?.institutionId)
}

interface ActionOptions<R> {
  success?: string | ((result: R) => string)
  onSuccess?: (result: R) => void
}

/** Wraps an async service call with pending state and toast feedback. */
export function useAction<A extends unknown[], R>(fn: (...args: A) => Promise<R>, options: ActionOptions<R> = {}) {
  const [pending, setPending] = useState(false)
  const { success, onSuccess } = options

  const run = useCallback(
    async (...args: A): Promise<R | undefined> => {
      setPending(true)
      try {
        const result = await fn(...args)
        if (success) toast.success(typeof success === 'function' ? success(result) : success)
        onSuccess?.(result)
        return result
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
        return undefined
      } finally {
        setPending(false)
      }
    },
    [fn, success, onSuccess],
  )

  return [run, pending] as const
}
