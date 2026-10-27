'use server'

import type { Db } from '@/types'
import { readAppDb, withAppDb } from '@/server/runtime'
import { scopeForViewer } from '@/server/scope'
import * as admin from '@/server/services/admin-service'
import * as authService from '@/server/services/auth-service'
import * as engagement from '@/server/services/engagement-service'
import * as food from '@/server/services/food-service'
import * as order from '@/server/services/order-service'
import * as profile from '@/server/services/profile-service'
import { ServiceError } from '@/server/services/utils'

const SERVICES: Record<string, Record<string, unknown>> = {
  admin,
  auth: authService,
  engagement,
  food,
  order,
  profile,
}

export type ServiceResult = { ok: true; result: unknown } | { ok: false; error: string }

/** Runs one service function on the server against the shared Neon document. */
export async function callService(service: string, method: string, args: unknown[]): Promise<ServiceResult> {
  const mod = Object.hasOwn(SERVICES, service) ? SERVICES[service] : undefined
  const fn = mod && Object.hasOwn(mod, method) ? mod[method] : undefined
  if (typeof fn !== 'function' || !Array.isArray(args)) return { ok: false, error: 'Unknown action.' }
  try {
    const result = await withAppDb(() => (fn as (...a: unknown[]) => Promise<unknown>)(...args))
    return { ok: true, result: result ?? null }
  } catch (error) {
    if (error instanceof ServiceError) return { ok: false, error: error.message }
    console.error(`[service] ${service}.${method} failed`, error)
    return { ok: false, error: 'Something went wrong. Please try again.' }
  }
}

/** Current app state, limited to what the signed-in user is allowed to see. */
export async function loadState(): Promise<Db> {
  return scopeForViewer(await readAppDb())
}
