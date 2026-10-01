'use client'

import { Bell, CheckCheck, Gift, HandHeart, Info, Leaf, Package, ShoppingBag, Star, Trash2, type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import type { NotificationType } from '@/types'
import { useAction, useCurrentUser, useDb, useHydrated } from '@/hooks/use-db'
import { timeAgo } from '@/lib/format'
import { cn } from '@/lib/utils'
import { deleteNotification, markAllNotificationsRead, markNotificationRead } from '@/services/engagement-service'
import { EmptyState, PageHeader } from '@/components/shared/page'
import { Button } from '@/components/ui/button'

const ICONS: Record<NotificationType, LucideIcon> = {
  order: ShoppingBag,
  donation: HandHeart,
  system: Info,
  promo: Gift,
  review: Star,
  stock: Package,
  impact: Leaf,
}

export function NotificationsView() {
  const db = useDb()
  const user = useCurrentUser()
  const hydrated = useHydrated()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [markAll, markingAll] = useAction(markAllNotificationsRead, { success: 'All caught up' })
  const [markRead] = useAction(markNotificationRead)
  const [remove] = useAction(deleteNotification)

  if (!hydrated || !user) return <div className="h-80 animate-pulse rounded-3xl bg-muted" />

  const mine = db.notifications.filter((n) => n.userId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const unread = mine.filter((n) => !n.read).length
  const visible = filter === 'unread' ? mine.filter((n) => !n.read) : mine

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Notifications"
        description={unread ? `You have ${unread} unread notification${unread > 1 ? 's' : ''}.` : 'You are all caught up.'}
        actions={
          <Button variant="outline" onClick={() => markAll()} disabled={!unread || markingAll}>
            <CheckCheck data-icon="inline-start" />
            Mark all as read
          </Button>
        }
      />

      <div role="tablist" aria-label="Notification filter" className="flex gap-2">
        {(['all', 'unread'] as const).map((f) => (
          <button
            key={f}
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={cn(
              'rounded-full border px-4 py-1.5 text-sm font-medium capitalize transition-colors',
              filter === f ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:bg-muted',
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState icon={Bell} title={filter === 'unread' ? 'No unread notifications' : 'No notifications yet'} />
      ) : (
        <ul className="flex flex-col divide-y overflow-hidden rounded-2xl border bg-card">
          {visible.map((n) => {
            const Icon = ICONS[n.type] ?? Bell
            const body = (
              <>
                <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', n.read ? 'bg-muted text-muted-foreground' : 'bg-accent text-accent-foreground')}>
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className={cn('text-sm', n.read ? 'font-medium' : 'font-bold')}>{n.title}</span>
                  <span className="text-sm leading-relaxed text-muted-foreground">{n.message}</span>
                  <span className="text-xs text-muted-foreground">{timeAgo(n.createdAt)}</span>
                </span>
              </>
            )
            return (
              <li key={n.id} className={cn('flex items-start gap-2 p-4', !n.read && 'bg-accent/30')}>
                {n.href ? (
                  <Link href={n.href} onClick={() => !n.read && markRead(n.id)} className="flex flex-1 items-start gap-3">
                    {body}
                  </Link>
                ) : (
                  <button type="button" onClick={() => !n.read && markRead(n.id)} className="flex flex-1 items-start gap-3 text-left">
                    {body}
                  </button>
                )}
                <div className="flex shrink-0 items-center">
                  {!n.read && <span className="mr-1 size-2 rounded-full bg-primary" aria-label="Unread" />}
                  <Button variant="ghost" size="icon" aria-label="Delete notification" onClick={() => remove(n.id)}>
                    <Trash2 />
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
