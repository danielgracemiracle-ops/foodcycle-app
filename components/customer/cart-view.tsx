'use client'

import { HandHeart, Minus, Plus, ShoppingCart, Trash2, TriangleAlert } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'
import { useCurrentUser, useDb, useHydrated } from '@/hooks/use-db'
import { calculateGrade, discountPercent } from '@/lib/quality'
import { isPurchasable } from '@/lib/recommendation'
import { formatRupiah, pickupLabel } from '@/lib/format'
import { cartLines, cartTotals } from '@/lib/selectors'
import { MAX_QTY_PER_ITEM, removeFromCart, setCartDonate, updateCartQuantity } from '@/services/order-service'
import { ButtonLink } from '@/components/shared/button-link'
import { GradeBadge } from '@/components/shared/grade-badge'
import { EmptyState, PageHeader, Panel } from '@/components/shared/page'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { SummaryTotals } from './checkout/order-summary'

async function attempt(fn: () => Promise<unknown>, success?: string) {
  try {
    await fn()
    if (success) toast.success(success)
  } catch (e) {
    toast.error(e instanceof Error ? e.message : 'Something went wrong')
  }
}

export function CartView() {
  const db = useDb()
  const user = useCurrentUser()
  const hydrated = useHydrated()
  if (!hydrated || !user) return <div className="h-80 animate-pulse rounded-3xl bg-muted" />

  const lines = cartLines(db, user.id)
  const totals = cartTotals(lines)
  const hasUnavailable = lines.some((l) => !isPurchasable(l.food))

  if (lines.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Your cart" />
        <EmptyState
          icon={ShoppingCart}
          title="Your cart is empty"
          description="Rescue a meal from a restaurant near you — most items are 40–60% off."
          action={<ButtonLink href="/explore">Explore food</ButtonLink>}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Your cart" description={`${totals.count} item${totals.count === 1 ? '' : 's'} ready to rescue`} />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <ul className="flex flex-col gap-3">
          {lines.map(({ item, food, restaurant }) => {
            const available = isPurchasable(food)
            const max = Math.min(food.quantity, MAX_QTY_PER_ITEM)
            return (
              <li key={food.id} className="flex flex-col gap-4 rounded-2xl border bg-card p-4 sm:flex-row">
                <Link href={`/food/${food.id}`} className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-xl bg-muted sm:size-28 sm:aspect-auto">
                  <Image src={food.image || '/placeholder.svg'} alt={food.name} fill sizes="(min-width: 640px) 112px, 100vw" className="object-cover" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/food/${food.id}`} className="font-semibold hover:underline">{food.name}</Link>
                        <GradeBadge grade={calculateGrade(food)} />
                      </div>
                      <p className="text-xs text-muted-foreground">{restaurant.name} · Pickup {pickupLabel(food.pickupStart, food.pickupEnd)}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-semibold tabular-nums">{formatRupiah(food.price * item.quantity)}</p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        <span className="line-through">{formatRupiah(food.originalPrice * item.quantity)}</span> · -{discountPercent(food.originalPrice, food.price)}%
                      </p>
                    </div>
                  </div>

                  {!available && (
                    <p className="flex items-center gap-1.5 text-xs font-medium text-destructive">
                      <TriangleAlert className="size-3.5" aria-hidden="true" /> No longer available — please remove it.
                    </p>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-1 rounded-xl border p-1" role="group" aria-label={`Quantity for ${food.name}`}>
                      <Button size="icon-sm" variant="ghost" aria-label="Decrease quantity" disabled={item.quantity <= 1} onClick={() => attempt(() => updateCartQuantity(food.id, item.quantity - 1))}>
                        <Minus />
                      </Button>
                      <span className="w-8 text-center text-sm font-semibold tabular-nums">{item.quantity}</span>
                      <Button size="icon-sm" variant="ghost" aria-label="Increase quantity" disabled={item.quantity >= max} onClick={() => attempt(() => updateCartQuantity(food.id, item.quantity + 1))}>
                        <Plus />
                      </Button>
                    </div>
                    <div className="flex items-center gap-3">
                      {food.donationAvailable && (
                        <label className="flex items-center gap-2 text-xs font-medium">
                          <Switch checked={item.donate} onCheckedChange={(v) => attempt(() => setCartDonate(food.id, v))} />
                          <HandHeart className="size-3.5 text-primary" aria-hidden="true" /> Donate
                        </label>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => attempt(() => removeFromCart(food.id), `${food.name} removed`)}>
                        <Trash2 data-icon="inline-start" /> Remove
                      </Button>
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>

        <Panel title="Order summary" className="lg:sticky lg:top-24 lg:self-start">
          <SummaryTotals totals={totals} />
          <div className="flex flex-col gap-2">
            {hasUnavailable ? (
              <Button size="lg" disabled>Proceed to Checkout</Button>
            ) : (
              <ButtonLink href={lines.some((l) => l.item.donate) ? '/checkout?type=donation' : '/checkout'} size="lg">
                Proceed to Checkout
              </ButtonLink>
            )}
            <ButtonLink href="/explore" variant="outline" size="lg">Continue Shopping</ButtonLink>
          </div>
        </Panel>
      </div>
    </div>
  )
}
