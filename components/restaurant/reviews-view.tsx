'use client'

import { MessageSquareText } from 'lucide-react'
import { useRestaurantData } from '@/hooks/use-restaurant'
import { timeAgo } from '@/lib/format'
import { EntityAvatar } from '@/components/shared/entity-avatar'
import { EmptyState, PageHeader, Panel } from '@/components/shared/page'
import { StarsDisplay } from '@/components/shared/rating-stars'
import { Progress } from '@/components/ui/progress'

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)

export function ReviewsView() {
  const data = useRestaurantData()
  if (!data) return <div className="h-96 animate-pulse rounded-3xl bg-muted" />
  const { reviews, foods, restaurant } = data

  const dims = [
    { label: 'Food quality', value: avg(reviews.map((r) => r.foodQuality)) },
    { label: 'Packaging', value: avg(reviews.map((r) => r.packaging)) },
    { label: 'Experience', value: avg(reviews.map((r) => r.experience)) },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Reviews" description="What customers say about your rescued meals." />

      {reviews.length === 0 ? (
        <EmptyState icon={MessageSquareText} title="No reviews yet" description="Reviews appear after customers complete their pickup." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <Panel className="h-fit">
            <div className="flex flex-col gap-1">
              <p className="text-sm text-muted-foreground">Overall rating</p>
              <p className="font-heading text-5xl font-bold tabular-nums">{(restaurant?.rating ?? 0).toFixed(1)}</p>
              <StarsDisplay value={restaurant?.rating ?? 0} />
              <p className="text-xs text-muted-foreground">{reviews.length} reviews</p>
            </div>
            <div className="flex flex-col gap-4">
              {dims.map((d) => (
                <div key={d.label} className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-sm">
                    <span>{d.label}</span>
                    <span className="tabular-nums text-muted-foreground">{d.value.toFixed(1)}</span>
                  </div>
                  <Progress value={(d.value / 5) * 100} aria-label={`${d.label} average`} />
                </div>
              ))}
            </div>
          </Panel>

          <ul className="flex flex-col gap-3">
            {reviews.map((r) => {
              const food = foods.find((f) => f.id === r.foodId)
              const overall = (r.foodQuality + r.packaging + r.experience) / 3
              return (
                <li key={r.id} className="flex flex-col gap-3 rounded-2xl border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <EntityAvatar name={r.userName} />
                      <div>
                        <p className="text-sm font-medium">{r.userName}</p>
                        <p className="text-xs text-muted-foreground">{food?.name ?? 'Removed listing'} &middot; {timeAgo(r.createdAt)}</p>
                      </div>
                    </div>
                    <StarsDisplay value={overall} />
                  </div>
                  {r.comment && <p className="text-sm leading-relaxed text-pretty">{r.comment}</p>}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
