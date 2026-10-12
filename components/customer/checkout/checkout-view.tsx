'use client'

import { BadgeCheck, HandHeart, MapPin, ShoppingBag, ShoppingCart, User as UserIcon, Utensils } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import type { OrderType } from '@/types'
import { useCurrentUser, useDb, useHydrated } from '@/hooks/use-db'
import { cartLines, cartTotals } from '@/lib/selectors'
import { pickupLabel } from '@/lib/format'
import { cn } from '@/lib/utils'
import { saveCheckoutDraft } from '@/services/order-service'
import { ButtonLink } from '@/components/shared/button-link'
import { EmptyState, PageHeader, Panel } from '@/components/shared/page'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { SummaryLines, SummaryTotals } from './order-summary'

const MESSAGE_MAX = 200

export function CheckoutView({ initialType }: { initialType: OrderType }) {
  const db = useDb()
  const user = useCurrentUser()
  const hydrated = useHydrated()
  const router = useRouter()
  const saved = user ? db.checkoutDrafts[user.id] : undefined
  const [type, setType] = useState<OrderType>(saved?.type ?? initialType)
  const [institutionId, setInstitutionId] = useState<string | undefined>(saved?.institutionId)
  const [message, setMessage] = useState(saved?.message ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string>()

  if (!hydrated || !user) return <div className="h-80 animate-pulse rounded-3xl bg-muted" />

  const lines = cartLines(db, user.id)
  const totals = cartTotals(lines)
  const institutions = db.institutions.filter((i) => i.verification === 'approved' && i.acceptingDonations)
  const notDonatable = lines.filter((l) => !l.food.donationAvailable)
  const restaurants = [...new Map(lines.map((l) => [l.restaurant.id, l.restaurant])).values()]

  if (lines.length === 0) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title="Nothing to check out"
        description="Your cart is empty. Add food from the marketplace first."
        action={<ButtonLink href="/explore">Explore food</ButtonLink>}
      />
    )
  }

  const submit = async () => {
    setError(undefined)
    if (type === 'donation' && !institutionId) return setError('Please choose a social institution to receive your donation.')
    setSubmitting(true)
    try {
      await saveCheckoutDraft({ type, institutionId: type === 'donation' ? institutionId : undefined, message: type === 'donation' ? message : undefined })
      router.push('/payment')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not continue to payment'
      setError(msg)
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Checkout" description="Review your order and choose how this food will be used." />
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-6">
          <Panel title="Customer information">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <UserIcon className="size-5" aria-hidden="true" />
              </span>
              <div className="flex flex-col">
                <span className="font-semibold">{user.name}</span>
                <span className="text-sm text-muted-foreground">{user.email}{user.phone ? ` · ${user.phone}` : ''}</span>
              </div>
            </div>
          </Panel>

          <Panel title="Pickup information">
            <ul className="flex flex-col gap-3">
              {restaurants.map((r) => {
                const foods = lines.filter((l) => l.restaurant.id === r.id).map((l) => l.food)
                return (
                  <li key={r.id} className="flex items-start gap-3 rounded-xl bg-muted/60 p-3">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                    <div className="flex flex-col gap-0.5 text-sm">
                      <span className="font-semibold">{r.name}</span>
                      <span className="text-muted-foreground">{r.address}, {r.city}</span>
                      <span className="text-muted-foreground">Pickup {pickupLabel(foods[0].pickupStart, foods[0].pickupEnd)}</span>
                    </div>
                  </li>
                )
              })}
            </ul>
            {restaurants.length > 1 && (
              <p className="text-xs text-muted-foreground">Items from different restaurants become separate orders.</p>
            )}
          </Panel>

          <Panel title="How will this food be used?">
            <div role="radiogroup" aria-label="Food usage" className="grid gap-3 sm:grid-cols-2">
              {([
                { value: 'self', icon: Utensils, title: 'For Myself', body: 'Pick it up and enjoy it yourself.' },
                { value: 'donation', icon: HandHeart, title: 'Donate', body: 'Buy it for a verified social institution.' },
              ] as const).map((o) => (
                <button
                  key={o.value}
                  type="button"
                  role="radio"
                  aria-checked={type === o.value}
                  onClick={() => {
                    setType(o.value)
                    setError(undefined)
                  }}
                  className={cn(
                    'flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition-colors',
                    type === o.value ? 'border-primary bg-accent/60' : 'border-border hover:border-primary/40',
                  )}
                >
                  <o.icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                  <span className="flex flex-col gap-0.5">
                    <span className="font-semibold">{o.title}</span>
                    <span className="text-sm text-muted-foreground">{o.body}</span>
                  </span>
                </button>
              ))}
            </div>

            {type === 'donation' && notDonatable.length > 0 && (
              <p className="rounded-xl bg-warning/25 p-3 text-sm">
                {notDonatable.map((l) => l.food.name).join(', ')} {notDonatable.length > 1 ? 'are' : 'is'} not available for donation. Remove {notDonatable.length > 1 ? 'them' : 'it'} from your cart or buy for yourself.
              </p>
            )}
          </Panel>

          {type === 'donation' && (
            <Panel title="Choose a social institution" description="Only verified institutions currently accepting donations are shown.">
              <div role="radiogroup" aria-label="Social institution" className="flex flex-col gap-3">
                {institutions.map((inst) => (
                  <button
                    key={inst.id}
                    type="button"
                    role="radio"
                    aria-checked={institutionId === inst.id}
                    onClick={() => {
                      setInstitutionId(inst.id)
                      setError(undefined)
                    }}
                    className={cn(
                      'flex flex-col gap-2 rounded-2xl border-2 p-4 text-left transition-colors sm:flex-row sm:items-center sm:justify-between',
                      institutionId === inst.id ? 'border-primary bg-accent/60' : 'border-border hover:border-primary/40',
                    )}
                  >
                    <span className="flex flex-col gap-1">
                      <span className="flex items-center gap-1.5 font-semibold">
                        {inst.name}
                        <BadgeCheck className="size-4 text-primary" aria-label="Verified" />
                      </span>
                      <span className="text-sm text-muted-foreground">{inst.city} · {inst.address}</span>
                    </span>
                    <span className="flex gap-4 text-sm">
                      <span className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Meals needed</span>
                        <span className="font-semibold tabular-nums">{inst.mealsNeeded}</span>
                      </span>
                      <span className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Accepting</span>
                        <span className="font-semibold text-primary">Yes</span>
                      </span>
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="donation-message" className="text-sm font-medium">Message to the institution (optional)</label>
                <Textarea
                  id="donation-message"
                  value={message}
                  maxLength={MESSAGE_MAX}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Semoga bermanfaat"
                  rows={3}
                />
                <p className="text-right text-xs text-muted-foreground tabular-nums">{message.length}/{MESSAGE_MAX}</p>
              </div>
            </Panel>
          )}
        </div>

        <Panel title="Order summary" className="lg:sticky lg:top-24 lg:self-start">
          <SummaryLines lines={lines} />
          <SummaryTotals totals={totals} />
          {error && <p role="alert" className="text-sm font-medium text-destructive">{error}</p>}
          <Button size="lg" onClick={submit} disabled={submitting || (type === 'donation' && notDonatable.length > 0)}>
            <ShoppingBag data-icon="inline-start" />
            {submitting ? 'Saving…' : 'Continue to Payment'}
          </Button>
          <ButtonLink href="/cart" variant="ghost">Back to cart</ButtonLink>
        </Panel>
      </div>
    </div>
  )
}
