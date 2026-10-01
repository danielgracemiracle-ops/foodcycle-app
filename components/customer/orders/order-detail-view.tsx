'use client'

import { ArrowLeft, CircleCheck, FastForward, HandHeart, MapPin, Receipt, XCircle } from 'lucide-react'
import { useCurrentUser, useAction, useDb, useHydrated } from '@/hooks/use-db'
import { formatDateTime, formatRupiah, pickupLabel } from '@/lib/format'
import { cancelOrder, confirmPickup, DONATION_FLOW, ORDER_FLOW, simulateOrderProgress } from '@/services/order-service'
import { ButtonLink } from '@/components/shared/button-link'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { EmptyState, Panel } from '@/components/shared/page'
import { StatusBadge } from '@/components/shared/status-badge'
import { StatusTimeline } from '@/components/shared/status-timeline'
import { Button } from '@/components/ui/button'
import { ReviewDialog } from './review-dialog'

export function OrderDetailView({ id }: { id: string }) {
  const db = useDb()
  const user = useCurrentUser()
  const hydrated = useHydrated()
  const [cancel, cancelling] = useAction(cancelOrder, { success: 'Order cancelled. Refund is on its way.' })
  const [pickup, pickingUp] = useAction(confirmPickup, { success: 'Pickup confirmed. Enjoy your food!' })
  const [simulate, simulating] = useAction(simulateOrderProgress, { success: 'Status advanced' })

  if (!hydrated || !user) return <div className="h-96 animate-pulse rounded-3xl bg-muted" />

  const order = db.orders.find((o) => o.id === id && o.customerId === user.id)
  if (!order) {
    return (
      <EmptyState
        icon={Receipt}
        title="Order not found"
        description="This order doesn't exist or belongs to another account."
        action={<ButtonLink href="/orders">Back to orders</ButtonLink>}
      />
    )
  }

  const restaurant = db.restaurants.find((r) => r.id === order.restaurantId)
  const payment = db.payments.find((p) => p.id === order.paymentId)
  const donation = order.donationId ? db.donations.find((d) => d.id === order.donationId) : undefined
  const institution = donation && db.institutions.find((i) => i.id === donation.institutionId)
  const finished = order.status === 'Completed' || order.status === 'Cancelled'
  const donationFinished = !donation || donation.status === 'Received' || donation.status === 'Rejected'
  const canSimulate = !(finished && donationFinished) && order.status !== 'Cancelled'

  return (
    <div className="flex flex-col gap-6">
      <ButtonLink href="/orders" variant="ghost" size="sm" className="self-start">
        <ArrowLeft data-icon="inline-start" />
        All orders
      </ButtonLink>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <p className="font-mono text-sm text-muted-foreground">{order.id}</p>
          <h1 className="flex flex-wrap items-center gap-3 text-2xl font-bold md:text-3xl">
            {order.type === 'donation' ? 'Donation order' : 'Pickup order'}
            <StatusBadge status={order.status} />
          </h1>
          <p className="text-sm text-muted-foreground">Placed {formatDateTime(order.createdAt)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {order.status === 'Payment Confirmed' && (
            <ConfirmDialog
              trigger={
                <Button variant="outline" disabled={cancelling}>
                  <XCircle data-icon="inline-start" />
                  Cancel order
                </Button>
              }
              title="Cancel this order?"
              description="You can cancel until the restaurant confirms. The full amount will be refunded."
              confirmLabel="Cancel order"
              destructive
              onConfirm={() => cancel(order.id)}
            />
          )}
          {order.type === 'self' && order.status === 'Ready for Pickup' && (
            <Button onClick={() => pickup(order.id)} disabled={pickingUp}>
              <CircleCheck data-icon="inline-start" />
              Confirm pickup
            </Button>
          )}
          {order.status === 'Completed' && !order.reviewed && <ReviewDialog order={order} />}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          <Panel
            title="Order status"
            action={
              canSimulate && (
                <Button variant="outline" size="sm" onClick={() => simulate(order.id)} disabled={simulating}>
                  <FastForward data-icon="inline-start" />
                  Simulate next step
                </Button>
              )
            }
          >
            <StatusTimeline flow={ORDER_FLOW} history={order.history} current={order.status} terminal={['Cancelled']} />
          </Panel>

          {donation && (
            <Panel title="Donation progress" description={institution ? `To ${institution.name}` : undefined}>
              <StatusTimeline flow={DONATION_FLOW} history={donation.history} current={donation.status} terminal={['Rejected']} />
              {donation.message && (
                <p className="rounded-xl bg-muted p-3 text-sm italic">&ldquo;{donation.message}&rdquo;</p>
              )}
            </Panel>
          )}
        </div>

        <div className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
          <Panel title="Items">
            <ul className="flex flex-col gap-3">
              {order.items.map((i) => (
                <li key={i.id} className="flex items-center gap-3">
                  <img src={i.image || '/placeholder.svg'} alt="" className="size-12 rounded-lg object-cover" />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium">{i.name}</span>
                    <span className="text-xs text-muted-foreground">{i.quantity} x {formatRupiah(i.price)}</span>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">{formatRupiah(i.price * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="flex flex-col gap-1.5 border-t pt-3 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Original price</dt><dd className="tabular-nums">{formatRupiah(order.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">You saved</dt><dd className="tabular-nums text-primary">-{formatRupiah(order.discount)}</dd></div>
              <div className="flex justify-between font-semibold"><dt>Total paid</dt><dd className="tabular-nums">{formatRupiah(order.total)}</dd></div>
              {payment && <div className="flex justify-between text-xs"><dt className="text-muted-foreground">Method</dt><dd>{payment.method}</dd></div>}
            </dl>
          </Panel>

          <Panel title="Pickup">
            <p className="flex items-start gap-2 text-sm">
              <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <span className="flex flex-col">
                <span className="font-semibold">{restaurant?.name}</span>
                <span className="text-muted-foreground">{restaurant?.address}, {restaurant?.city}</span>
                <span className="text-muted-foreground">{pickupLabel(order.pickupStart, order.pickupEnd)}</span>
              </span>
            </p>
            {institution && (
              <p className="flex items-start gap-2 text-sm">
                <HandHeart className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                Courier delivers to {institution.name}
              </p>
            )}
          </Panel>
        </div>
      </div>
    </div>
  )
}
