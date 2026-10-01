'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import type { Role } from '@/types'
import { ROLE_HOME } from '@/services/auth-service'
import { useCurrentUser, useHydrated } from '@/hooks/use-db'
import { LogoMark } from './logo'

export function RoleGuard({ role, children }: { role: Role; children: React.ReactNode }) {
  const hydrated = useHydrated()
  const user = useCurrentUser()
  const router = useRouter()
  const pathname = usePathname()

  const allowed = hydrated && user?.role === role

  useEffect(() => {
    if (!hydrated) return
    if (!user) router.replace(`/login?next=${encodeURIComponent(pathname)}`)
    else if (user.role !== role) router.replace(ROLE_HOME[user.role])
  }, [hydrated, user, role, router, pathname])

  if (!allowed) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3" role="status" aria-live="polite">
        <LogoMark className="size-10 animate-pulse" />
        <p className="text-sm text-muted-foreground">Loading your workspace…</p>
      </div>
    )
  }

  return <>{children}</>
}
