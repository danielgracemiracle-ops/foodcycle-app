'use client'

import { SearchX, Search, SlidersHorizontal, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { FoodCategory } from '@/types'
import { useCurrentUser, useDb, useHydrated } from '@/hooks/use-db'
import { getRecommendations } from '@/lib/recommendation'
import { marketplaceFoods } from '@/lib/selectors'
import {
  activeFilterCount,
  applyFilters,
  EMPTY_FILTERS,
  type Filters,
  matchesQuery,
  SORT_OPTIONS,
  type SortValue,
  sortFoods,
} from '@/lib/explore'
import { FoodCard, FoodCardSkeleton } from '@/components/food/food-card'
import { EmptyState, PageHeader } from '@/components/shared/page'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { FilterPanel } from './filter-panel'

export interface ExploreInitial {
  q?: string
  category?: string
  sort?: string
  donation?: string
}

export function ExploreView({ initial }: { initial: ExploreInitial }) {
  const db = useDb()
  const user = useCurrentUser()
  const hydrated = useHydrated()
  const [query, setQuery] = useState(initial.q ?? '')
  const [focused, setFocused] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sort, setSort] = useState<SortValue>(
    SORT_OPTIONS.some((o) => o.value === initial.sort) ? (initial.sort as SortValue) : 'recommended',
  )
  const [filters, setFilters] = useState<Filters>({
    ...EMPTY_FILTERS,
    categories: initial.category ? [initial.category as FoodCategory] : [],
    donation: initial.donation === '1',
  })

  const restaurants = useMemo(() => new Map(db.restaurants.map((r) => [r.id, r])), [db.restaurants])
  const foods = useMemo(() => marketplaceFoods(db), [db])

  const recommendedOrder = useMemo(() => {
    if (!user) return []
    return getRecommendations(
      {
        foods,
        restaurants: db.restaurants,
        orders: db.orders.filter((o) => o.customerId === user.id),
        preferences: db.preferences.find((p) => p.userId === user.id),
      },
      foods.length,
    ).map((r) => r.food.id)
  }, [foods, db, user])

  const results = useMemo(() => {
    const searched = foods.filter((f) => matchesQuery(f, restaurants.get(f.restaurantId), query))
    return sortFoods(applyFilters(searched, restaurants, filters), restaurants, sort, recommendedOrder)
  }, [foods, restaurants, query, filters, sort, recommendedOrder])

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    const pool = new Set<string>()
    for (const f of foods) {
      if (f.name.toLowerCase().includes(q)) pool.add(f.name)
      if (f.category.toLowerCase().includes(q)) pool.add(f.category)
      const r = restaurants.get(f.restaurantId)
      if (r?.name.toLowerCase().includes(q)) pool.add(r.name)
    }
    return [...pool].filter((s) => s.toLowerCase() !== q).slice(0, 6)
  }, [foods, restaurants, query])

  const filterCount = activeFilterCount(filters)
  const apply = (f: Filters) => {
    setFilters(f)
    setSheetOpen(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Explore surplus food" description="Search by food, restaurant or category. Everything here is ready for pickup soon." />

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <label htmlFor="explore-search" className="sr-only">Search food, restaurants or categories</label>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            id="explore-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            placeholder="Search nasi goreng, bakery, Warung…"
            autoComplete="off"
            role="combobox"
            aria-expanded={focused && suggestions.length > 0}
            aria-controls="explore-suggestions"
            className="h-11 w-full rounded-xl border bg-card pr-10 pl-10 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
          {focused && suggestions.length > 0 && (
            <ul id="explore-suggestions" role="listbox" className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-xl border bg-popover p-1 shadow-lg">
              {suggestions.map((s) => (
                <li key={s} role="option" aria-selected={false}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setQuery(s)
                      setFocused(false)
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"
                  >
                    <Search className="size-3.5 text-muted-foreground" aria-hidden="true" />
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger render={<Button variant="outline" className="h-11 lg:hidden" />}>
              <SlidersHorizontal data-icon="inline-start" />
              Filters{filterCount > 0 && ` (${filterCount})`}
            </SheetTrigger>
            <SheetContent side="left" className="w-full overflow-y-auto sm:max-w-sm">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="px-4 pb-6">
                <FilterPanel key={JSON.stringify(filters)} initial={filters} onApply={apply} />
              </div>
            </SheetContent>
          </Sheet>

          <Select
            value={sort}
            onValueChange={(v) => v && setSort(v as SortValue)}
            items={SORT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          >
            <SelectTrigger className="h-11! min-w-48" aria-label="Sort results">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-8">
        <aside className="hidden w-72 shrink-0 lg:block" aria-label="Filters">
          <div className="sticky top-24 flex flex-col gap-4 rounded-2xl border bg-card p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">Filters</h2>
              {filterCount > 0 && <span className="text-xs text-muted-foreground">{filterCount} active</span>}
            </div>
            <FilterPanel key={JSON.stringify(filters)} initial={filters} onApply={apply} />
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col gap-4" aria-live="polite">
          <p className="text-sm text-muted-foreground">
            {hydrated ? `${results.length} ${results.length === 1 ? 'result' : 'results'}` : 'Loading…'}
            {query.trim() && hydrated && <> for &ldquo;{query.trim()}&rdquo;</>}
          </p>
          {!hydrated ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => <FoodCardSkeleton key={i} />)}
            </div>
          ) : results.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title={query.trim() ? 'No matching food found' : 'No food matches these filters'}
              description="Try a different keyword, widen your price range, or clear some filters."
              action={
                <Button
                  variant="outline"
                  onClick={() => {
                    setQuery('')
                    setFilters(EMPTY_FILTERS)
                  }}
                >
                  Reset search
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((food) => <FoodCard key={food.id} food={food} />)}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
