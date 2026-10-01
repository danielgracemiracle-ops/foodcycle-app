'use client'

import { Heart, MapPin, Store } from 'lucide-react'
import { useAction, useCurrentUser, useDb, useHydrated } from '@/hooks/use-db'
import { marketplaceFoods } from '@/lib/selectors'
import { toggleFavorite } from '@/services/engagement-service'
import { ButtonLink } from '@/components/shared/button-link'
import { EntityAvatar } from '@/components/shared/entity-avatar'
import { EmptyState, PageHeader, SectionHeader } from '@/components/shared/page'
import { RatingInline } from '@/components/shared/rating-stars'
import { FoodCard } from '@/components/food/food-card'
import { Button } from '@/components/ui/button'

export function FavoritesView() {
  const db = useDb()
  const user = useCurrentUser()
  const hydrated = useHydrated()
  const [toggle, pending] = useAction(toggleFavorite, { success: 'Removed from favorites' })
  if (!hydrated || !user) return <div className="h-80 animate-pulse rounded-3xl bg-muted" />

  const favs = db.favorites.filter((f) => f.userId === user.id)
  const foodIds = new Set(favs.filter((f) => f.targetType === 'food').map((f) => f.targetId))
  const foods = db.foods.filter((f) => foodIds.has(f.id))
  const available = new Set(marketplaceFoods(db).map((f) => f.id))
  const restaurants = db.restaurants.filter((r) => favs.some((f) => f.targetType === 'restaurant' && f.targetId === r.id))

  if (foods.length === 0 && restaurants.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Favorites" />
        <EmptyState
          icon={Heart}
          title="No favorites yet"
          description="Tap the heart on any food or restaurant to save it here."
          action={<ButtonLink href="/explore">Explore food</ButtonLink>}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Favorites" description="Your saved food and restaurants." />

      {foods.length > 0 && (
        <section className="flex flex-col gap-4">
          <SectionHeader title="Food" description={`${foods.length} saved`} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {foods.map((f) =>
              available.has(f.id) ? (
                <FoodCard key={f.id} food={f} />
              ) : (
                <div key={f.id} className="relative opacity-60">
                  <FoodCard food={f} reason="Not available right now" />
                </div>
              ),
            )}
          </div>
        </section>
      )}

      {restaurants.length > 0 && (
        <section className="flex flex-col gap-4">
          <SectionHeader title="Restaurants" description={`${restaurants.length} saved`} />
          <ul className="grid gap-3 md:grid-cols-2">
            {restaurants.map((r) => {
              const activeCount = marketplaceFoods(db).filter((f) => f.restaurantId === r.id).length
              return (
                <li key={r.id} className="flex items-center gap-4 rounded-2xl border bg-card p-4">
                  <EntityAvatar name={r.name} color={r.logoColor} />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="truncate font-semibold">{r.name}</span>
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="size-3.5" aria-hidden="true" />
                      {r.city} · {r.distanceKm.toFixed(1)} km
                    </span>
                    <div className="flex items-center gap-3 text-sm">
                      <RatingInline rating={r.rating} count={r.reviewCount} />
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Store className="size-3.5" aria-hidden="true" />
                        {activeCount} available
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${r.name} from favorites`}
                    disabled={pending}
                    onClick={() => toggle('restaurant', r.id)}
                  >
                    <Heart className="fill-primary text-primary" />
                  </Button>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </div>
  )
}
