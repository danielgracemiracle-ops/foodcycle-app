'use client'

import { ArrowLeft, Clock, HandHeart, Heart, MapPin, Minus, Package, Phone, Plus, ShoppingCart, Store, TriangleAlert, Zap } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { useCurrentUser, useDb, useHydrated } from '@/hooks/use-db'
import { calculateGrade, discountPercent } from '@/lib/quality'
import { isPurchasable } from '@/lib/recommendation'
import { formatDate, formatRupiah, pickupLabel, timeLeftLabel } from '@/lib/format'
import { cn } from '@/lib/utils'
import { calculateHealthScore, getMainIngredients, mainIngredientLabel } from '@/lib/food-tags'
import { HealthBadge } from '@/components/shared/health-badge'
import { toggleFavorite } from '@/services/engagement-service'
import { addToCart, MAX_QTY_PER_ITEM } from '@/services/order-service'
import { EntityAvatar } from '@/components/shared/entity-avatar'
import { GradeBadge, GradeDisclaimer } from '@/components/shared/grade-badge'
import { EmptyState, Panel } from '@/components/shared/page'
import { QualityBreakdown } from '@/components/shared/quality-score'
import { RatingInline, StarsDisplay } from '@/components/shared/rating-stars'
import { ButtonLink } from '@/components/shared/button-link'
import { Button } from '@/components/ui/button'

export function FoodDetailView({ id }: { id: string }) {
  const db = useDb()
  const user = useCurrentUser()
  const hydrated = useHydrated()
  const router = useRouter()
  const [qty, setQty] = useState(1)

  const food = db.foods.find((f) => f.id === id)
  const restaurant = food && db.restaurants.find((r) => r.id === food.restaurantId)

  const [adding, setAdding] = useState(false)

  if (!hydrated) return <div className="h-96 animate-pulse rounded-3xl bg-muted" />
  if (!food || !restaurant || food.status === 'disabled') {
    return (
      <EmptyState
        icon={Package}
        title="This food is no longer listed"
        description="It may have been sold out or removed by the restaurant."
        action={<ButtonLink href="/explore">Explore other food</ButtonLink>}
      />
    )
  }

  const grade = calculateGrade(food)
  const health = calculateHealthScore(food)
  const discount = discountPercent(food.originalPrice, food.price)
  const available = isPurchasable(food)
  const maxQty = Math.min(food.quantity, MAX_QTY_PER_ITEM)
  const reviews = db.reviews.filter((r) => r.foodId === food.id)
  const favorited = db.favorites.some((f) => f.userId === user?.id && f.targetType === 'food' && f.targetId === food.id)

  const onFavorite = async () => {
    try {
      await toggleFavorite('food', food.id)
      toast.success(favorited ? 'Removed from favorites' : 'Added to favorites')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not update favorites')
    }
  }

  const run = async (mode: 'cart' | 'buy' | 'donate') => {
    setAdding(true)
    try {
      await addToCart(food.id, qty, mode === 'donate')
      if (mode === 'cart') toast.success(`${qty}x ${food.name} added to cart`)
      else router.push(mode === 'donate' ? '/checkout?type=donation' : '/checkout')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not add to cart')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <Link href="/explore" className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" /> Back to explore
      </Link>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-muted lg:sticky lg:top-24 lg:self-start">
          <Image src={food.image || '/placeholder.svg'} alt={food.name} fill priority sizes="(min-width: 1024px) 50vw, 100vw" className={cn('object-cover', !available && 'grayscale')} />
          {discount > 0 && (
            <span className="absolute top-4 left-4 rounded-full bg-foreground px-3 py-1 text-sm font-bold text-background">{discount}% OFF</span>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">{food.category}</span>
              {food.donationAvailable && (
                <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                  <HandHeart className="size-3.5 text-primary" aria-hidden="true" /> Available for donation
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-balance md:text-4xl">{food.name}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <Store className="size-4 text-muted-foreground" aria-hidden="true" /> {restaurant.name}
              </span>
              <RatingInline rating={food.rating} count={food.ratingCount} />
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <MapPin className="size-4" aria-hidden="true" /> {restaurant.distanceKm} km away
              </span>
            </div>
          </div>

          <div className="flex items-end gap-3">
            <p className="font-heading text-4xl font-bold text-primary tabular-nums">{formatRupiah(food.price)}</p>
            {discount > 0 && <p className="pb-1 text-lg text-muted-foreground line-through tabular-nums">{formatRupiah(food.originalPrice)}</p>}
          </div>

          <dl className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1 rounded-2xl border bg-card p-4">
              <dt className="flex items-center gap-1.5 text-xs text-muted-foreground"><Clock className="size-3.5" aria-hidden="true" /> Pickup</dt>
              <dd className="text-sm font-semibold">{pickupLabel(food.pickupStart, food.pickupEnd)}</dd>
              <dd className="text-xs text-muted-foreground">{timeLeftLabel(food.pickupEnd)}</dd>
            </div>
            <div className="flex flex-col gap-1 rounded-2xl border bg-card p-4">
              <dt className="flex items-center gap-1.5 text-xs text-muted-foreground"><Package className="size-3.5" aria-hidden="true" /> Available</dt>
              <dd className={cn('text-sm font-semibold', food.quantity <= 2 && 'text-destructive')}>
                {food.quantity > 0 ? `${food.quantity} portion${food.quantity > 1 ? 's' : ''} left` : 'Sold out'}
              </dd>
              <dd className="text-xs text-muted-foreground">{food.soldCount} rescued so far</dd>
            </div>
          </dl>

          {user?.role === 'customer' && (
            <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4">
              {available ? (
                <>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-medium" id="qty-label">Quantity</span>
                    <div className="flex items-center gap-1 rounded-xl border p-1" role="group" aria-labelledby="qty-label">
                      <Button size="icon-sm" variant="ghost" aria-label="Decrease quantity" disabled={qty <= 1} onClick={() => setQty((q) => q - 1)}>
                        <Minus />
                      </Button>
                      <span className="w-8 text-center font-semibold tabular-nums" aria-live="polite">{qty}</span>
                      <Button size="icon-sm" variant="ghost" aria-label="Increase quantity" disabled={qty >= maxQty} onClick={() => setQty((q) => q + 1)}>
                        <Plus />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button size="lg" variant="outline" disabled={adding} onClick={() => run('cart')}>
                      <ShoppingCart data-icon="inline-start" /> Add to Cart
                    </Button>
                    <Button size="lg" disabled={adding} onClick={() => run('buy')}>
                      <Zap data-icon="inline-start" /> Buy Now
                    </Button>
                    {food.donationAvailable && (
                      <Button size="lg" variant="secondary" className="col-span-2" disabled={adding} onClick={() => run('donate')}>
                        <HandHeart data-icon="inline-start" /> Donate This Food
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <TriangleAlert className="size-4" aria-hidden="true" /> This item is sold out or past its pickup window.
                </p>
              )}
              <Button variant="ghost" onClick={onFavorite} aria-pressed={favorited}>
                <Heart data-icon="inline-start" className={cn(favorited && 'fill-destructive text-destructive')} />
                {favorited ? 'Saved to Favorites' : 'Add to Favorites'}
              </Button>
            </div>
          )}

          <Panel title="Food Grade">
            <GradeBadge grade={grade} size="lg" />
            <GradeDisclaimer />
          </Panel>

          <Panel title={`Quality Score: ${food.quality.score}/100`}>
            <QualityBreakdown quality={food.quality} />
          </Panel>

          <Panel title="Health label">
            <div className="flex flex-wrap items-center gap-2">
              <HealthBadge health={health} className="px-3 py-1 text-xs" />
              {getMainIngredients(food).map((m) => (
                <span key={m} className="rounded-full bg-muted px-2.5 py-1 text-xs">{mainIngredientLabel(m)}</span>
              ))}
            </div>
            {health.reasons.length > 0 && (
              <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
                {health.reasons.map((r) => (
                  <li key={r}>{'• '}{r}</li>
                ))}
              </ul>
            )}
            <p className="text-xs leading-relaxed text-muted-foreground">
              Estimasi berdasarkan bahan, mengacu pola &quot;Isi Piringku&quot;. Informasi umum, bukan saran medis.
            </p>
          </Panel>

          <Panel title="About this food">
            <p className="text-sm leading-relaxed text-pretty text-muted-foreground">{food.description}</p>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold">Ingredients</h3>
                <ul className="flex flex-wrap gap-1.5">
                  {food.ingredients.map((i) => (
                    <li key={i} className="rounded-full bg-muted px-2.5 py-1 text-xs">{i}</li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold">Allergens</h3>
                {food.allergens.length ? (
                  <ul className="flex flex-wrap gap-1.5">
                    {food.allergens.map((a) => (
                      <li key={a} className="rounded-full bg-warning/25 px-2.5 py-1 text-xs font-medium">{a}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground">No common allergens listed.</p>
                )}
              </div>
            </div>
          </Panel>

          <Panel title="Restaurant">
            <div className="flex items-start gap-3">
              <EntityAvatar name={restaurant.name} color={restaurant.logoColor} size="lg" />
              <div className="flex min-w-0 flex-col gap-1">
                <p className="font-semibold">{restaurant.name}</p>
                <RatingInline rating={restaurant.rating} count={restaurant.reviewCount} />
                <p className="text-sm leading-relaxed text-muted-foreground">{restaurant.description}</p>
              </div>
            </div>
            <ul className="flex flex-col gap-2 text-sm">
              <li className="flex items-start gap-2"><MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />{restaurant.address}, {restaurant.city} · {restaurant.distanceKm} km</li>
              <li className="flex items-center gap-2"><Clock className="size-4 text-muted-foreground" aria-hidden="true" />Open {restaurant.openTime}–{restaurant.closeTime}</li>
              <li className="flex items-center gap-2"><Phone className="size-4 text-muted-foreground" aria-hidden="true" />{restaurant.phone}</li>
            </ul>
          </Panel>

          <Panel title="Customer reviews" description={reviews.length ? `${reviews.length} review${reviews.length > 1 ? 's' : ''}` : undefined}>
            {reviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">No reviews yet. Be the first after your pickup.</p>
            ) : (
              <ul className="flex flex-col divide-y">
                {reviews.map((r) => (
                  <li key={r.id} className="flex flex-col gap-1.5 py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold">{r.userName}</span>
                      <span className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</span>
                    </div>
                    <StarsDisplay value={(r.foodQuality + r.packaging + r.experience) / 3} />
                    <p className="text-sm leading-relaxed text-muted-foreground">{r.comment}</p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  )
}
