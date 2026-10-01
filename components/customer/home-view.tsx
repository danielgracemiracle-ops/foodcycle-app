'use client'

import { Clock, Flame, HandHeart, Leaf, MapPin, Search, Sparkles, UtensilsCrossed } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { FOOD_CATEGORIES } from '@/types'
import { useCurrentUser, useDb } from '@/hooks/use-db'
import { getRecommendations } from '@/lib/recommendation'
import { greeting, marketplaceFoods, userImpact } from '@/lib/selectors'
import { FoodRail } from '@/components/food/food-rail'
import { ButtonLink } from '@/components/shared/button-link'

export function HomeView() {
  const db = useDb()
  const user = useCurrentUser()
  const router = useRouter()
  const [query, setQuery] = useState('')

  const data = useMemo(() => {
    if (!user) return null
    const foods = marketplaceFoods(db)
    const restaurantById = new Map(db.restaurants.map((r) => [r.id, r]))
    const preferences = db.preferences.find((p) => p.userId === user.id)
    const recommendations = getRecommendations({
      foods,
      restaurants: db.restaurants,
      orders: db.orders.filter((o) => o.customerId === user.id),
      preferences,
    })
    const dist = (id: string) => restaurantById.get(id)?.distanceKm ?? 99
    return {
      recommended: recommendations.map((r) => ({ food: r.food, reason: r.reasons[0] })),
      near: [...foods].sort((a, b) => dist(a.restaurantId) - dist(b.restaurantId)).slice(0, 4),
      popular: [...foods].sort((a, b) => b.soldCount - a.soldCount).slice(0, 4),
      donation: foods.filter((f) => f.donationAvailable).slice(0, 4),
      recent: [...foods].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4),
      impact: userImpact(db, user.id),
    }
  }, [db, user])

  if (!user || !data) return null
  const firstName = user.name.split(' ')[0]

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(query.trim() ? `/explore?q=${encodeURIComponent(query.trim())}` : '/explore')
  }

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-5 rounded-3xl bg-primary px-5 py-7 text-primary-foreground md:px-8 md:py-9">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-primary-foreground/80">{greeting()},</p>
          <h1 className="text-3xl font-bold text-balance md:text-4xl">{firstName}</h1>
          <p className="max-w-lg text-sm leading-relaxed text-pretty text-primary-foreground/85 md:text-base">
            Good food from restaurants near you, waiting to be rescued tonight.
          </p>
        </div>
        <form onSubmit={onSearch} role="search" className="flex max-w-xl items-center gap-2 rounded-2xl bg-background p-1.5">
          <label htmlFor="home-search" className="sr-only">Search food, restaurants or categories</label>
          <Search className="ml-2 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <input
            id="home-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search nasi goreng, bakery, Warung…"
            className="h-10 min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <button type="submit" className="h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            Search
          </button>
        </form>
        <ul className="flex flex-wrap gap-2" aria-label="Browse by category">
          {FOOD_CATEGORIES.map((c) => (
            <li key={c}>
              <Link
                href={`/explore?category=${c}`}
                className="inline-flex rounded-full bg-primary-foreground/15 px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary-foreground/25"
              >
                {c}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <FoodRail title="Recommended For You" description="Picked from your tastes, budget and location" icon={Sparkles} items={data.recommended.slice(0, 4)} href="/explore?sort=recommended" />

      <ImpactStrip meals={data.impact.meals} donations={data.impact.donations} wasteKg={data.impact.wasteKg} />

      <FoodRail title="Near You" description="Shortest walk to pickup" icon={MapPin} items={data.near.map((food) => ({ food }))} href="/explore?sort=distance" />
      <FoodRail title="Popular Surplus Food" description="What the neighbourhood is rescuing" icon={Flame} items={data.popular.map((food) => ({ food }))} href="/explore?sort=rating" />
      <FoodRail title="Available for Donation" description="Buy a meal for a verified social institution" icon={HandHeart} items={data.donation.map((food) => ({ food }))} href="/explore?donation=1" />
      <FoodRail title="Recently Added" description="Fresh listings in the last few hours" icon={Clock} items={data.recent.map((food) => ({ food }))} href="/explore" />
    </div>
  )
}

function ImpactStrip({ meals, donations, wasteKg }: { meals: number; donations: number; wasteKg: number }) {
  const stats = [
    { icon: UtensilsCrossed, label: 'Meals Saved', value: meals.toLocaleString('id-ID') },
    { icon: HandHeart, label: 'Donations', value: donations.toLocaleString('id-ID') },
    { icon: Leaf, label: 'Food Waste Prevented', value: `${wasteKg.toLocaleString('id-ID', { maximumFractionDigits: 1 })} kg` },
  ]
  return (
    <section aria-labelledby="impact-heading" className="flex flex-col gap-4 rounded-3xl border bg-card p-5 md:flex-row md:items-center md:justify-between md:p-6">
      <div className="flex flex-col gap-1">
        <h2 id="impact-heading" className="text-lg font-bold">Your Impact</h2>
        <p className="text-sm text-muted-foreground">Every rescued meal counts.</p>
      </div>
      <dl className="grid grid-cols-3 gap-3 md:flex md:gap-8">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col gap-1">
            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <s.icon className="size-3.5 text-primary" aria-hidden="true" />
              {s.label}
            </dt>
            <dd className="font-heading text-xl font-bold tabular-nums md:text-2xl">{s.value}</dd>
          </div>
        ))}
      </dl>
      <ButtonLink href="/impact" variant="outline" size="sm" className="self-start md:self-center">
        View impact
      </ButtonLink>
    </section>
  )
}
