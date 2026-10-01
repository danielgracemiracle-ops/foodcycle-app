'use client'

import { ChevronRight, HandHeart, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import type { Order } from '@/types'
import { useCurrentUser, useDb, useHydrated } from '@/hooks/use-db'
import { formatDateTime, formatRupiah } from '@/lib/format'
import { cn } from '@/lib/utils'
import { ButtonLink } from '@/components/shared/button-link'
import { EmptyState, PageHeader } from '@/components/shared/page'
import { StatusBadge } from '@/components/shared/status-badge'

const TABS = ['Active', 'Completed', 'Cancelled', 'All'] as const
type Tab = (typeof TABS)[number]

function matches(order: Order, tab: Tab) {
  if (tab === 'All') return true
  if (tab === 'Completed') return order.status === 'Completed'
  if (tab === 'Cancelled') return order.status === 'Cancelled'
  return order.status !== 'Completed' && order.status !== 'Cancelled'
}

export function OrdersView() {
  const db = useDb()
  const user = useCurrentUser()
  const hydrated = useHydrated()
  const [tab, setTab] = useState<Tab>('Active')

  if (!hydrated || !user) return <div className="h-80 animate-pulse rounded-3xl bg-muted" />

  const mine = db.orders.filter((o) => o.customerId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const visible = mine.filter((o) => matches(o, tab))

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="My Orders" description="Track your pickups and donation orders." />

      <div role="tablist" aria-label="Order filter" className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => {
          const count = mine.filter((o) => matches(o, t)).length
          return (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                tab === t ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:bg-muted',
              )}
            >
              {t}
              <span className="tabular-nums opacity-70">{count}</span>
            </button>
          )
        })}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title={`No ${tab.toLowerCase()} orders`}
          description="Rescue some surplus food and your orders will show up here."
          action={<ButtonLink href="/explore">Explore food</ButtonLink>}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((o) => {
            const restaurant = db.restaurants.find((r) => r.id === o.restaurantId)
            const first = o.items[0]
            return (
              <li key={o.id}>
                <Link
                  href={`/orders/${o.id}`}
                  className="flex items-center gap-4 rounded-2xl border bg-card p-3 transition-colors hover:border-primary/40 md:p-4"
                >
                  <img src={first?.image || '/placeholder.svg'} alt="" className="size-16 shrink-0 rounded-xl object-cover md:size-20" />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{o.id}</span>
                      <StatusBadge status={o.status} />
                      {o.type === 'donation' && (
                        <span className="flex items-center gap-1 text-xs font-medium text-primary">
                          <HandHeart className="size-3.5" aria-hidden="true" />
                          Donation
                        </span>
                      )}
                    </div>
                    <p className="truncate font-semibold">
                      {o.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {restaurant?.name} · {formatDateTime(o.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="hidden font-semibold tabular-nums sm:inline">{formatRupiah(o.total)}</span>
                    <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
