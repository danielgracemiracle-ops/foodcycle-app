'use client'

import { CircleCheck, HandHeart, MapPin } from 'lucide-react'
import { useDb, useHydrated } from '@/hooks/use-db'
import { formatRupiah, pickupLabel } from '@/lib/format'
import { ButtonLink } from '@/components/shared/button-link'
import { EmptyState } from '@/components/shared/page'

export function PaymentSuccess({ orderIds }: { orderIds: string[] }) {
  const db = useDb()
  const hydrated = useHydrated()
  if (!hydrated) return <div className="mx-auto h-96 max-w-xl animate-pulse rounded-3xl bg-muted" />

  const orders = db.orders.filter((o) => orderIds.includes(o.id))
  if (orders.length === 0) {
    return (
      <EmptyState
        icon={CircleCheck}
        title="Order not found"
        description="We couldn't find this payment. Check your orders page."
        action={<ButtonLink href="/orders">View orders</ButtonLink>}
      />
    )
  }

  const total = orders.reduce((s, o) => s + o.total, 0)
  const isDonation = orders[0].type === 'donation'

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 py-6 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <CircleCheck className="size-8" aria-hidden="true" />
      </span>
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Payment Successful</h1>
        <p className="text-muted-foreground text-pretty">
          {isDonation ? 'Thank you — your donation is on its way to the institution for confirmation.' : 'Your food is reserved. Show your order ID at pickup.'}
        </p>
      </div>

      <dl className="grid w-full grid-cols-2 gap-3 text-left">
        <div className="rounded-2xl border bg-card p-4">
          <dt className="text-xs text-muted-foreground">Total paid</dt>
          <dd className="font-heading text-xl font-bold tabular-nums">{formatRupiah(total)}</dd>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <dt className="text-xs text-muted-foreground">Order type</dt>
          <dd className="font-semibold">{isDonation ? 'Donation' : 'For myself'}</dd>
        </div>
      </dl>

      <ul className="flex w-full flex-col gap-3 text-left">
        {orders.map((o) => {
          const restaurant = db.restaurants.find((r) => r.id === o.restaurantId)
          const donation = o.donationId ? db.donations.find((d) => d.id === o.donationId) : undefined
          const institution = donation && db.institutions.find((i) => i.id === donation.institutionId)
          return (
            <li key={o.id} className="flex flex-col gap-3 rounded-2xl border bg-card p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-sm font-semibold">{o.id}</span>
                <span className="text-sm tabular-nums">{formatRupiah(o.total)}</span>
              </div>
              <p className="text-sm text-muted-foreground">{o.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}</p>
              <p className="flex items-start gap-2 text-sm">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                {restaurant?.name} · Pickup {pickupLabel(o.pickupStart, o.pickupEnd)}
              </p>
              {institution && (
                <p className="flex items-start gap-2 text-sm">
                  <HandHeart className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  Donating to {institution.name} ({donation?.id})
                </p>
              )}
            </li>
          )
        })}
      </ul>

      <div className="flex w-full flex-col gap-2 sm:flex-row">
        <ButtonLink href={orders.length === 1 ? `/orders/${orders[0].id}` : '/orders'} size="lg" className="flex-1">
          Track order
        </ButtonLink>
        <ButtonLink href="/explore" size="lg" variant="outline" className="flex-1">
          Keep exploring
        </ButtonLink>
      </div>
    </div>
  )
}
