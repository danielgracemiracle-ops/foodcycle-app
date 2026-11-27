'use client'

import { Building2, MapPin, Package, Store } from 'lucide-react'
import type { Db, Order } from '@/types'
import { useAction } from '@/hooks/use-db'
import { formatDate, pickupLabel } from '@/lib/format'
import { deliveryStage } from '@/lib/delivery'
import { advanceDelivery, claimDelivery, releaseDelivery } from '@/services/order-service'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const STAGE_LABEL = {
  open: 'Available',
  pickup: 'Go to restaurant',
  transit: 'On the way',
  delivered: 'Delivered',
} as const

export function DeliveryCard({ order, db, mode }: { order: Order; db: Db; mode: 'open' | 'mine' }) {
  const [claim, claiming] = useAction(claimDelivery, { success: 'Delivery accepted' })
  const [advance, advancing] = useAction(advanceDelivery, { success: 'Delivery updated' })
  const [release, releasing] = useAction(releaseDelivery, { success: 'Delivery released' })

  const restaurant = db.restaurants.find((r) => r.id === order.restaurantId)
  const donation = db.donations.find((d) => d.id === order.donationId)
  const institution = db.institutions.find((i) => i.id === donation?.institutionId)
  const stage = mode === 'open' ? 'open' : order.status === 'Cancelled' ? 'delivered' : deliveryStage(order, db)
  const itemCount = order.items.reduce((n, i) => n + i.quantity, 0)

  return (
    <article className="flex flex-col gap-4 rounded-2xl border bg-card p-4">
      <header className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <h3 className="font-heading font-semibold">{order.id}</h3>
          <p className="text-xs text-muted-foreground">
            {itemCount} item{itemCount === 1 ? '' : 's'} · {formatDate(order.createdAt)}
          </p>
        </div>
        <Badge variant={stage === 'transit' ? 'default' : 'secondary'}>
          {order.status === 'Cancelled' ? 'Cancelled' : STAGE_LABEL[stage]}
        </Badge>
      </header>

      <ol className="flex flex-col gap-3 text-sm">
        <li className="flex gap-3">
          <Store className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Pick up from</span>
            <span className="font-medium">{restaurant?.name ?? 'Restaurant'}</span>
            {restaurant?.address && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3" aria-hidden="true" />
                {restaurant.address}
              </span>
            )}
            <span className="text-xs text-muted-foreground">Window {pickupLabel(order.pickupStart, order.pickupEnd)}</span>
          </div>
        </li>
        <li className="flex gap-3">
          <Building2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Deliver to</span>
            <span className="font-medium">{institution?.name ?? 'Social institution'}</span>
            {institution?.address && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3" aria-hidden="true" />
                {institution.address}
              </span>
            )}
          </div>
        </li>
      </ol>

      <ul className="flex flex-col gap-1 rounded-xl bg-muted p-3 text-xs text-muted-foreground">
        {order.items.map((i) => (
          <li key={i.id} className="flex items-center gap-2">
            <Package className="size-3" aria-hidden="true" />
            <span className="font-semibold tabular-nums text-foreground">{i.quantity}x</span> {i.name}
          </li>
        ))}
      </ul>

      {stage !== 'delivered' && (
        <footer className="flex flex-wrap justify-end gap-2">
          {stage === 'open' && (
            <Button size="sm" disabled={claiming} onClick={() => claim(order.id)}>
              Accept delivery
            </Button>
          )}
          {stage === 'pickup' && (
            <>
              <Button variant="ghost" size="sm" disabled={releasing} onClick={() => release(order.id)}>
                Release
              </Button>
              <Button size="sm" disabled={advancing} onClick={() => advance(order.id)}>
                Confirm picked up
              </Button>
            </>
          )}
          {stage === 'transit' && (
            <Button size="sm" disabled={advancing} onClick={() => advance(order.id)}>
              Confirm delivered
            </Button>
          )}
        </footer>
      )}
    </article>
  )
}
