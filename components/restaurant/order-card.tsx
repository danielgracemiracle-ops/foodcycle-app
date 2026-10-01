'use client'

import { Check, HandHeart, X } from 'lucide-react'
import type { Db, Order } from '@/types'
import { useAction } from '@/hooks/use-db'
import { formatRupiah, pickupLabel, timeAgo } from '@/lib/format'
import { advanceOrder, rejectOrder } from '@/services/order-service'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { StatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'

const NEXT_LABEL: Partial<Record<Order['status'], string>> = {
  'Payment Confirmed': 'Accept order',
  'Restaurant Confirmed': 'Start preparing',
  Preparing: 'Mark ready for pickup',
  'Ready for Pickup': 'Confirm picked up',
  'Picked Up': 'Complete order',
}

export function RestaurantOrderCard({ order, db }: { order: Order; db: Db }) {
  const [advance, advancing] = useAction(advanceOrder, { success: 'Order updated' })
  const [reject] = useAction(rejectOrder, { success: 'Order rejected and refunded' })
  const customer = db.users.find((u) => u.id === order.customerId)
  const institution = order.donationId
    ? db.institutions.find((i) => i.id === db.donations.find((d) => d.id === order.donationId)?.institutionId)
    : undefined
  const next = NEXT_LABEL[order.status]
  const canReject = order.status === 'Payment Confirmed' || order.status === 'Restaurant Confirmed'

  return (
    <article className="flex flex-col gap-4 rounded-2xl border bg-card p-4">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <h3 className="font-heading font-semibold">{order.id}</h3>
            {order.type === 'donation' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
                <HandHeart className="size-3" aria-hidden="true" />
                Donation
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {customer?.name ?? 'Customer'} · {timeAgo(order.createdAt)}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </header>

      <ul className="flex flex-col gap-1 text-sm">
        {order.items.map((i) => (
          <li key={i.id} className="flex justify-between gap-2">
            <span>
              <span className="font-semibold tabular-nums">{i.quantity}x</span> {i.name}
            </span>
            <span className="tabular-nums text-muted-foreground">{formatRupiah(i.price * i.quantity)}</span>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-1 rounded-xl bg-muted p-3 text-xs text-muted-foreground">
        <span>Pickup {pickupLabel(order.pickupStart, order.pickupEnd)}</span>
        {institution && <span>Deliver to {institution.name}</span>}
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-heading font-bold tabular-nums">{formatRupiah(order.total)}</span>
        <div className="flex gap-2">
          {canReject && (
            <ConfirmDialog
              trigger={
                <Button variant="ghost" size="sm">
                  <X data-icon="inline-start" />
                  Reject
                </Button>
              }
              title={`Reject ${order.id}?`}
              description="Stock will be restored and the customer receives a full refund."
              confirmLabel="Reject order"
              destructive
              onConfirm={() => reject(order.id)}
            />
          )}
          {next && (
            <Button size="sm" onClick={() => advance(order.id)} disabled={advancing}>
              <Check data-icon="inline-start" />
              {next}
            </Button>
          )}
        </div>
      </footer>
    </article>
  )
}
