'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { Pause, Pencil, Play, Plus, Trash2, UtensilsCrossed } from 'lucide-react'
import type { Food } from '@/types'
import { useAction } from '@/hooks/use-db'
import { useRestaurantData } from '@/hooks/use-restaurant'
import { formatRupiah, timeLeftLabel } from '@/lib/format'
import { calculateGrade } from '@/lib/quality'
import { deleteFood, setFoodStatus } from '@/services/food-service'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { GradeBadge } from '@/components/shared/grade-badge'
import { EmptyState, PageHeader } from '@/components/shared/page'
import { QualityPill } from '@/components/shared/quality-score'
import { StatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FoodFormDialog } from './food-form-dialog'

type Filter = 'all' | 'live' | 'paused' | 'expired'

function isExpired(f: Food) {
  return new Date(f.pickupEnd).getTime() <= Date.now()
}

export function ListingsView() {
  const data = useRestaurantData()
  const router = useRouter()
  const params = useSearchParams()
  const [filter, setFilter] = useState<Filter>('all')
  const [editing, setEditing] = useState<Food | undefined>()
  const [open, setOpen] = useState(params.get('new') === '1')
  const [toggle] = useAction(setFoodStatus, { success: 'Listing updated' })
  const [remove] = useAction(deleteFood, { success: 'Listing deleted' })

  if (!data) return <div className="h-96 animate-pulse rounded-3xl bg-muted" />
  const { restaurant, foods } = data

  const filtered = foods
    .filter((f) => {
      if (filter === 'live') return f.status === 'active' && !isExpired(f) && f.quantity > 0
      if (filter === 'paused') return f.status !== 'active'
      if (filter === 'expired') return isExpired(f)
      return true
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  function openForm(food?: Food) {
    setEditing(food)
    setOpen(true)
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next && params.get('new')) router.replace('/restaurant/listings')
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Food listings"
        description="Publish surplus portions before they go to waste."
        actions={<Button onClick={() => openForm()}><Plus data-icon="inline-start" />New listing</Button>}
      />

      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList>
          <TabsTrigger value="all">All ({foods.length})</TabsTrigger>
          <TabsTrigger value="live">Live</TabsTrigger>
          <TabsTrigger value="paused">Paused</TabsTrigger>
          <TabsTrigger value="expired">Expired</TabsTrigger>
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title="No listings here"
          description="Add your surplus food so customers nearby can rescue it."
          action={<Button onClick={() => openForm()}>Create listing</Button>}
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((f) => {
            const expired = isExpired(f)
            const statusLabel = f.status === 'disabled' ? 'Disabled' : expired ? 'Expired' : f.quantity === 0 ? 'Sold out' : f.status === 'paused' ? 'Paused' : 'Live'
            return (
              <li key={f.id} className="flex flex-col overflow-hidden rounded-2xl border bg-card">
                <div className="relative aspect-[16/10]">
                  <Image src={f.image} alt={f.name} fill sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw" className="object-cover" />
                  <div className="absolute top-3 left-3"><GradeBadge grade={calculateGrade(f)} /></div>
                  <div className="absolute top-3 right-3"><StatusBadge status={statusLabel} /></div>
                </div>
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <div className="flex flex-col gap-1">
                    <h3 className="font-heading font-semibold text-pretty">{f.name}</h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span>{f.category}</span>
                      <QualityPill score={f.quality.score} />
                      <span>{expired ? 'Pickup window closed' : timeLeftLabel(f.pickupEnd)}</span>
                    </div>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="flex items-baseline gap-2">
                      <span className="font-heading text-lg font-bold tabular-nums">{formatRupiah(f.price)}</span>
                      <span className="text-xs text-muted-foreground line-through tabular-nums">{formatRupiah(f.originalPrice)}</span>
                    </span>
                    <span className="text-sm tabular-nums">{f.quantity} left</span>
                  </div>
                  <div className="mt-auto flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => openForm(f)} disabled={f.status === 'disabled'}>
                      <Pencil data-icon="inline-start" />
                      Edit
                    </Button>
                    {f.status !== 'disabled' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => toggle(f.id, f.status === 'active' ? 'paused' : 'active')}
                      >
                        {f.status === 'active' ? <Pause data-icon="inline-start" /> : <Play data-icon="inline-start" />}
                        {f.status === 'active' ? 'Pause' : 'Resume'}
                      </Button>
                    )}
                    <ConfirmDialog
                      trigger={
                        <Button variant="ghost" size="icon-sm" aria-label={`Delete ${f.name}`}>
                          <Trash2 />
                        </Button>
                      }
                      title={`Delete ${f.name}?`}
                      description="This permanently removes the listing and clears it from customer carts."
                      confirmLabel="Delete"
                      destructive
                      onConfirm={() => remove(f.id)}
                    />
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <FoodFormDialog
        open={open}
        onOpenChange={handleOpenChange}
        food={editing}
        restaurantRating={restaurant?.rating ?? 4}
        defaultPickupMinutes={restaurant?.defaultPickupMinutes ?? 120}
      />
    </div>
  )
}
