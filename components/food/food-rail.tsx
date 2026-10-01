'use client'

import { ArrowRight, type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import type { Food } from '@/types'
import { FoodCard } from './food-card'

export function FoodRail({
  title,
  description,
  icon: Icon,
  items,
  href,
  emptyText = 'Nothing here right now. Check back soon.',
}: {
  title: string
  description?: string
  icon?: LucideIcon
  items: { food: Food; reason?: string }[]
  href?: string
  emptyText?: string
}) {
  return (
    <section className="flex flex-col gap-4" aria-label={title}>
      <div className="flex items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          {Icon && (
            <span className="flex size-9 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <Icon className="size-4.5" aria-hidden="true" />
            </span>
          )}
          <div>
            <h2 className="text-lg font-bold md:text-xl">{title}</h2>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
        </div>
        {href && (
          <Link href={href} className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline">
            See all <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        )}
      </div>
      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <div className="-mx-4 flex snap-x snap-mandatory gap-3 sm:gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 md:pb-0 xl:grid-cols-4">
          {items.map(({ food, reason }) => (
            <FoodCard key={food.id} food={food} reason={reason} className="w-44 shrink-0 snap-start sm:w-64 md:w-auto" />
          ))}
        </div>
      )}
    </section>
  )
}
