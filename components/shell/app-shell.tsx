'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Bell, LogOut, Menu, Settings, ShoppingCart, User as UserIcon } from 'lucide-react'
import type { Db, Role, User } from '@/types'
import { cn } from '@/lib/utils'
import { useCurrentUser, useDb } from '@/hooks/use-db'
import { logout } from '@/services/auth-service'
import { Logo } from '@/components/shared/logo'
import { EntityAvatar } from '@/components/shared/entity-avatar'
import { RoleGuard } from '@/components/shared/role-guard'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { isActive, NAV, type NavItem } from './nav-config'

const ROLE_BASE: Record<Role, string> = {
  customer: '',
  restaurant: '/restaurant',
  institution: '/institution',
  admin: '/admin',
}

function badgeCount(db: Db, user: User, badge: NavItem['badge']) {
  switch (badge) {
    case 'notifications':
      return db.notifications.filter((n) => n.userId === user.id && !n.read).length
    case 'cart':
      return (db.carts[user.id] ?? []).reduce((s, i) => s + i.quantity, 0)
    case 'pendingOrders':
      return db.orders.filter((o) => o.restaurantId === user.restaurantId && o.status === 'Payment Confirmed').length
    case 'pendingDonations':
      return db.donations.filter((d) => d.institutionId === user.institutionId && d.status === 'Purchased').length
    case 'adminQueue':
      return db.restaurants.filter((r) => r.verification === 'pending').length
    default:
      return 0
  }
}

function CountBadge({ count, className }: { count: number; className?: string }) {
  if (!count) return null
  return (
    <span
      className={cn(
        'inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold leading-5 text-primary-foreground',
        className,
      )}
    >
      {count > 99 ? '99+' : count}
      <span className="sr-only"> unread</span>
    </span>
  )
}

function SideNav({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  const pathname = usePathname()
  const db = useDb()
  const user = useCurrentUser()
  if (!user) return null
  return (
    <nav aria-label="Main" className="flex flex-col gap-1">
      {items.map((item) => {
        const active = isActive(pathname, item)
        const count = badgeCount(db, user, item.badge)
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
              active && 'bg-accent text-accent-foreground hover:bg-accent',
            )}
          >
            <item.icon className="size-[18px]" aria-hidden="true" />
            <span className="flex-1">{item.label}</span>
            <CountBadge count={count} />
          </Link>
        )
      })}
    </nav>
  )
}

function UserMenu({ user, base }: { user: User; base: string }) {
  const router = useRouter()
  const onLogout = async () => {
    await logout()
    router.replace('/login')
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-2 rounded-full p-0.5 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        aria-label="Open account menu"
      >
        <EntityAvatar name={user.name} src={user.avatarUrl} size="sm" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <span className="block truncate text-sm font-semibold text-foreground">{user.name}</span>
            <span className="block truncate text-xs font-normal text-muted-foreground">{user.email}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push(`${base}/profile`)}>
          <UserIcon aria-hidden="true" /> Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push(`${base}/settings`)}>
          <Settings aria-hidden="true" /> Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onLogout}>
          <LogOut aria-hidden="true" /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ShellChrome({ role, children }: { role: Role; children: React.ReactNode }) {
  const user = useCurrentUser()!
  const db = useDb()
  const pathname = usePathname()
  const nav = NAV[role]
  const base = ROLE_BASE[role]
  const unread = badgeCount(db, user, 'notifications')
  const cartCount = badgeCount(db, user, 'cart')
  const mobileHrefs = new Set(nav.mobile.map((i) => i.href))
  const overflow = nav.primary.filter((i) => !mobileHrefs.has(i.href))

  return (
    <div className="flex min-h-dvh bg-background">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-6 border-r border-border bg-sidebar px-4 py-5 lg:flex">
        <div className="flex flex-col gap-1 px-2">
          <Logo href={nav.primary[0].href} />
          <span className="pl-10 text-xs font-medium text-muted-foreground">{nav.label}</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          <SideNav items={nav.primary} />
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
          <EntityAvatar name={user.name} src={user.avatarUrl} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur md:px-6">
          <Sheet>
            <SheetTrigger
              render={<Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu" />}
            >
              <Menu />
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-4">
              <SheetHeader className="p-0">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <Logo href={nav.primary[0].href} />
              </SheetHeader>
              <SideNav items={nav.primary} />
            </SheetContent>
          </Sheet>
          <div className="lg:hidden">
            <Logo href={nav.primary[0].href} />
          </div>
          <div className="flex-1" />
          {role === 'customer' && (
            <Link
              href="/cart"
              className="relative inline-flex size-10 items-center justify-center rounded-full hover:bg-muted"
              aria-label={`Cart, ${cartCount} items`}
            >
              <ShoppingCart className="size-5" aria-hidden="true" />
              <CountBadge count={cartCount} className="absolute -top-0.5 -right-0.5" />
            </Link>
          )}
          <Link
            href={`${base}/notifications`}
            className="relative inline-flex size-10 items-center justify-center rounded-full hover:bg-muted"
            aria-label={`Notifications, ${unread} unread`}
          >
            <Bell className="size-5" aria-hidden="true" />
            <CountBadge count={unread} className="absolute -top-0.5 -right-0.5" />
          </Link>
          <UserMenu user={user} base={base} />
        </header>

        <main className="flex-1 px-4 pt-6 pb-28 md:px-6 lg:px-10 lg:pb-12">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>

      <nav
        aria-label="Mobile"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        <ul className="mx-auto flex max-w-lg items-stretch justify-around">
          {nav.mobile.map((item) => {
            const active = isActive(pathname, item) || (item.href.endsWith('/profile') && overflow.some((o) => isActive(pathname, o)))
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground',
                    active && 'text-primary',
                  )}
                >
                  <item.icon className="size-5" aria-hidden="true" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}

export function AppShell({ role, children }: { role: Role; children: React.ReactNode }) {
  return (
    <RoleGuard role={role}>
      <ShellChrome role={role}>{children}</ShellChrome>
    </RoleGuard>
  )
}
