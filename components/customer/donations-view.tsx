'use client'

import { ChevronRight, HandHeart, Soup, Wallet } from 'lucide-react'
import Link from 'next/link'
import { useCurrentUser, useDb, useHydrated } from '@/hooks/use-db'
import { formatDate, formatRupiah } from '@/lib/format'
import { ButtonLink } from '@/components/shared/button-link'
import { EmptyState, PageHeader, StatCard } from '@/components/shared/page'
import { StatusBadge } from '@/components/shared/status-badge'

export function DonationsView() {
  const db = useDb()
  const user = useCurrentUser()
  const hydrated = useHydrated()
  if (!hydrated || !user) return <div className="h-80 animate-pulse rounded-3xl bg-muted" />

  const mine = db.donations.filter((d) => d.donorId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const valid = mine.filter((d) => d.status !== 'Rejected')
  const meals = valid.reduce((s, d) => s + d.quantity, 0)
  const value = valid.reduce((s, d) => s + d.value, 0)
  const institutions = new Set(valid.map((d) => d.institutionId)).size

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="My Donations"
        description="Food you bought for verified social institutions."
        actions={<ButtonLink href="/explore?donation=1"><HandHeart data-icon="inline-start" />Donate food</ButtonLink>}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Meals donated" value={meals} icon={Soup} />
        <StatCard label="Donation value" value={formatRupiah(value)} icon={Wallet} />
        <StatCard label="Institutions helped" value={institutions} icon={HandHeart} />
      </div>

      {mine.length === 0 ? (
        <EmptyState
          icon={HandHeart}
          title="No donations yet"
          description="Choose 'Donate' at checkout to send rescued food to an orphanage, shelter, or community kitchen."
          action={<ButtonLink href="/explore">Find donatable food</ButtonLink>}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {mine.map((d) => {
            const inst = db.institutions.find((i) => i.id === d.institutionId)
            const restaurant = db.restaurants.find((r) => r.id === d.restaurantId)
            return (
              <li key={d.id}>
                <Link
                  href={`/orders/${d.orderId}`}
                  className="flex items-center gap-4 rounded-2xl border bg-card p-4 transition-colors hover:border-primary/40"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                    <HandHeart className="size-5" aria-hidden="true" />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{inst?.name}</span>
                      <StatusBadge status={d.status} />
                    </div>
                    <p className="truncate text-sm text-muted-foreground">
                      {d.foodSummary} · from {restaurant?.name} · {formatDate(d.createdAt)}
                    </p>
                  </div>
                  <span className="hidden font-semibold tabular-nums sm:inline">{formatRupiah(d.value)}</span>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
