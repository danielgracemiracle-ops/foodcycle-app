'use client'

import { Logo } from '@/components/shared/logo'
import { ButtonLink } from '@/components/shared/button-link'
import { useCurrentUser } from '@/hooks/use-db'
import { ROLE_HOME } from '@/services/auth-service'

export function SiteHeader() {
  const user = useCurrentUser()
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 md:px-6">
        <Logo />
        <nav aria-label="Site" className="hidden flex-1 items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          <a href="#how-it-works" className="hover:text-foreground">How it works</a>
          <a href="#why" className="hover:text-foreground">Why FoodCycle</a>
          <a href="#impact" className="hover:text-foreground">Impact</a>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <ButtonLink href={ROLE_HOME[user.role]} size="lg" className="rounded-full px-4">
              Open dashboard
            </ButtonLink>
          ) : (
            <>
              <ButtonLink href="/login" variant="ghost" size="lg" className="rounded-full px-4">
                Log in
              </ButtonLink>
              <ButtonLink href="/register" size="lg" className="rounded-full px-4">
                Sign up
              </ButtonLink>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
