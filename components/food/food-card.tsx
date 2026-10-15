'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Clock, HandHeart, Heart, Loader2, MapPin, Plus } from 'lucide-react'
import type { Food } from '@/types'
import { cn } from '@/lib/utils'
import { calculateGrade, discountPercent } from '@/lib/quality'
import { formatRupiah, timeLeftLabel } from '@/lib/format'
import { useAction, useCurrentUser, useDb } from '@/hooks/use-db'
import { toggleFavorite } from '@/services/engagement-service'
import { addToCart } from '@/services/order-service'
import { GradeBadge } from '@/components/shared/grade-badge'
import { HealthBadge } from '@/components/shared/health-badge'
import { calculateHealthScore } from '@/lib/food-tags'
import { QualityPill } from '@/components/shared/quality-score'
import { RatingInline } from '@/components/shared/rating-stars'
import { toast } from 'sonner'

export function FoodCard({ food, reason, className }: { food: Food; reason?: string; className?: string }) {
  const db = useDb()
  const user = useCurrentUser()
  const restaurant = db.restaurants.find((r) => r.id === food.restaurantId)
  const grade = calculateGrade(food)
  const discount = discountPercent(food.originalPrice, food.price)
  const favorited = db.favorites.some((f) => f.userId === user?.id && f.targetType === 'food' && f.targetId === food.id)
  const soldOut = food.quantity <= 0

  const [onAdd, adding] = useAction(() => addToCart(food.id, 1), { success: `${food.name} added to cart` })

  const onFavorite = async () => {
    try {
      await toggleFavorite('food', food.id)
      toast.success(favorited ? 'Removed from favorites' : 'Added to favorites')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not update favorites')
    }
  }

  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xs transition-shadow hover:shadow-md',
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <Image
          src={food.image || '/placeholder.svg'}
          alt={food.name}
          fill
          sizes="(min-width: 1024px) 280px, 50vw"
          className={cn('object-cover transition-transform duration-500 group-hover:scale-105', soldOut && 'grayscale')}
        />
        <div className="absolute top-2 left-2 flex flex-wrap items-center gap-1 sm:top-3 sm:left-3 sm:gap-1.5">
          {discount > 0 && (
            <span className="rounded-full bg-foreground px-1.5 py-0.5 text-[11px] font-semibold whitespace-nowrap text-background sm:px-2 sm:text-xs">
              -{discount}%
            </span>
          )}
          <GradeBadge grade={grade} compact className="h-5 sm:h-6" />
        </div>
        {user?.role === 'customer' && (
          <button
            type="button"
            onClick={onFavorite}
            aria-pressed={favorited}
            aria-label={favorited ? `Remove ${food.name} from favorites` : `Add ${food.name} to favorites`}
            className="absolute top-2 right-2 z-10 inline-flex size-8 items-center sm:top-3 sm:right-3 sm:size-9 justify-center rounded-full bg-background/90 shadow-sm backdrop-blur transition-colors hover:bg-background"
          >
            <Heart className={cn('size-4', favorited ? 'fill-destructive text-destructive' : 'text-foreground')} aria-hidden="true" />
          </button>
        )}
        {soldOut && (
          <span className="absolute inset-x-0 bottom-0 bg-foreground/80 py-1.5 text-center text-xs font-semibold text-background">Sold out</span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3 sm:gap-3 sm:p-4">
        <div className="flex flex-col gap-0.5 sm:gap-1">
          <p className="truncate text-[11px] font-medium text-muted-foreground sm:text-xs">{restaurant?.name}</p>
          <h3 className="line-clamp-2 font-heading text-sm font-semibold leading-snug text-pretty sm:line-clamp-1 sm:text-base">
            <Link href={`/food/${food.id}`} className="after:absolute after:inset-0 focus-visible:outline-none">
              {food.name}
            </Link>
          </h3>
          {reason && <p className="line-clamp-1 text-xs text-primary">{reason}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] whitespace-nowrap text-muted-foreground sm:gap-x-3 sm:gap-y-1.5 sm:text-xs">
          <RatingInline rating={food.rating} />
          {restaurant && (
            <span className="hidden items-center gap-1 sm:inline-flex">
              <MapPin className="size-3.5" aria-hidden="true" />
              {restaurant.distanceKm.toFixed(1)} km
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden="true" />
            {timeLeftLabel(food.pickupEnd)}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-[11px] whitespace-nowrap">
          <HealthBadge health={calculateHealthScore(food)} compact />
          <span className="hidden rounded-full bg-secondary px-2 py-0.5 font-medium text-secondary-foreground sm:inline">{food.category}</span>
          {!soldOut && (
            <span className={cn('font-medium', food.quantity <= 2 ? 'text-destructive' : 'text-muted-foreground')}>
              {food.quantity} left
            </span>
          )}
          {food.donationAvailable && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 font-medium text-accent-foreground">
              <HandHeart className="size-3" aria-hidden="true" />
              Donatable
            </span>
          )}
        </div>

        <div className="mt-auto flex items-end justify-between gap-2">
          <div className="flex min-w-0 flex-col">
            {discount > 0 && (
              <span className="truncate text-[11px] text-muted-foreground line-through sm:text-xs">{formatRupiah(food.originalPrice)}</span>
            )}
            <span className="truncate font-heading text-base font-bold text-foreground sm:text-lg">{formatRupiah(food.price)}</span>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <QualityPill score={food.quality.score} className="hidden sm:inline-flex" />
            {user?.role === 'customer' && (
              <button
                type="button"
                onClick={onAdd}
                disabled={soldOut || adding}
                aria-label={`Add ${food.name} to cart`}
                className="relative z-10 inline-flex size-8 items-center sm:size-9 justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {adding ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}

export function FoodCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <div className="aspect-[4/3] animate-pulse bg-muted" />
      <div className="flex flex-col gap-2 p-4">
        <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-5 w-1/4 animate-pulse rounded bg-muted" />
      </div>
    </div>
  )
}
