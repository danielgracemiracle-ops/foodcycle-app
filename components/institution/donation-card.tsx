'use client'

import { PackageCheck } from 'lucide-react'
import type { Db, Donation } from '@/types'
import { useAction } from '@/hooks/use-db'
import { formatDateTime, formatRupiah } from '@/lib/format'
import { DONATION_FLOW, confirmDonationReceived } from '@/services/order-service'
import { EntityAvatar } from '@/components/shared/entity-avatar'
import { StatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

export function DonationCard({ donation, db }: { donation: Donation; db: Db }) {
  const restaurant = db.restaurants.find((r) => r.id === donation.restaurantId)
  const donor = db.users.find((u) => u.id === donation.donorId)
  const [receive, receiving] = useAction(confirmDonationReceived, { success: 'Receipt confirmed. Thank you!' })

  const step = DONATION_FLOW.indexOf(donation.status)
  const progress = donation.status === 'Rejected' ? 0 : ((step + 1) / DONATION_FLOW.length) * 100

  return (
    <article className="flex flex-col gap-4 rounded-2xl border bg-card p-4 md:p-5">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <EntityAvatar name={restaurant?.name ?? 'Restaurant'} color={restaurant?.logoColor} />
          <div>
            <p className="font-heading font-semibold">{restaurant?.name ?? 'Restaurant'}</p>
            <p className="text-xs text-muted-foreground">
              From {donor?.name ?? 'a donor'} &middot; {formatDateTime(donation.createdAt)}
            </p>
          </div>
        </div>
        <StatusBadge status={donation.status} />
      </header>

      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-pretty">{donation.foodSummary}</p>
        <p className="text-xs text-muted-foreground tabular-nums">
          {donation.quantity} meals &middot; worth {formatRupiah(donation.value)}
        </p>
        {donation.message && (
          <blockquote className="mt-2 rounded-xl bg-muted px-3 py-2 text-sm leading-relaxed italic text-muted-foreground">
            {`"${donation.message}"`}
          </blockquote>
        )}
      </div>

      {donation.status !== 'Rejected' && (
        <div className="flex flex-col gap-1.5">
          <Progress value={progress} aria-label="Donation progress" />
          <p className="text-xs text-muted-foreground">
            Step {step + 1} of {DONATION_FLOW.length}
          </p>
        </div>
      )}

      {donation.status === 'Delivered' && (
        <Button onClick={() => receive(donation.id)} disabled={receiving}>
          <PackageCheck data-icon="inline-start" />
          Confirm received
        </Button>
      )}
    </article>
  )
}
