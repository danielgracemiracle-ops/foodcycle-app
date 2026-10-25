import 'server-only'
import { betterAuth } from 'better-auth'
import { nextCookies } from 'better-auth/next-js'
import { pool } from '@/lib/db'

const toOrigin = (value?: string) => {
  if (!value) return undefined
  const url = value.startsWith('http') ? value : `https://${value}`
  try {
    return new URL(url).origin
  } catch {
    return undefined
  }
}

const isDev = process.env.NODE_ENV === 'development'

const baseURL =
  process.env.BETTER_AUTH_URL ||
  toOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL) ||
  toOrigin(process.env.VERCEL_URL) ||
  process.env.V0_RUNTIME_URL

const trustedOrigins = (
  isDev
    ? [
        'http://localhost:3000',
        toOrigin(process.env.V0_RUNTIME_URL),
        toOrigin(process.env.V0_DEV_APP_URL),
        toOrigin(process.env.V0_BUILD_URL),
        toOrigin(process.env.V0_SANDBOX_URL),
      ]
    : [toOrigin(process.env.VERCEL_URL), toOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL)]
).filter((o): o is string => Boolean(o))

export const auth = betterAuth({
  database: pool,
  baseURL,
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  ...(isDev
    ? {
        advanced: {
          // Required by the cross-site v0 preview iframe. Without these
          // attributes, login succeeds but the next request appears signed out.
          defaultCookieAttributes: {
            sameSite: 'none' as const,
            secure: true,
          },
        },
      }
    : {}),
  plugins: [nextCookies()],
})
