'use client'

import { useState } from 'react'
import { FOOD_CATEGORIES, type FoodGrade } from '@/types'
import { EMPTY_FILTERS, type Filters, PICKUP_OPTIONS, PRICE_MAX, PRICE_MIN } from '@/lib/explore'
import { formatRupiah } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'

const GRADES: FoodGrade[] = ['A', 'B', 'C']
const QUALITY = [90, 75, 60]
const RATINGS = [4, 4.5]
const DISTANCES = [1, 3, 5, 10]

function toggle<T>(list: T[], value: T) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-3 border-b pb-5 last:border-b-0">
      <legend className="mb-3 text-sm font-semibold">{title}</legend>
      {children}
    </fieldset>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
        active ? 'border-primary bg-primary text-primary-foreground' : 'bg-background hover:border-primary/50',
      )}
    >
      {children}
    </button>
  )
}

export function FilterPanel({ initial, onApply }: { initial: Filters; onApply: (f: Filters) => void }) {
  const [draft, setDraft] = useState<Filters>(initial)
  const set = <K extends keyof Filters>(key: K, value: Filters[K]) => setDraft((d) => ({ ...d, [key]: value }))

  return (
    <div className="flex flex-col gap-5">
      <Group title="Category">
        <div className="flex flex-wrap gap-2">
          {FOOD_CATEGORIES.map((c) => (
            <Chip key={c} active={draft.categories.includes(c)} onClick={() => set('categories', toggle(draft.categories, c))}>
              {c}
            </Chip>
          ))}
        </div>
      </Group>

      <Group title="Price">
        <Slider
          aria-label="Price range"
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={2500}
          value={draft.price}
          onValueChange={(v) => Array.isArray(v) && set('price', [v[0], v[1]])}
        />
        <p className="text-sm tabular-nums text-muted-foreground">
          {formatRupiah(draft.price[0])} – {formatRupiah(draft.price[1])}
        </p>
      </Group>

      <Group title="Food Grade">
        <div className="flex flex-wrap gap-2">
          {GRADES.map((g) => (
            <Chip key={g} active={draft.grades.includes(g)} onClick={() => set('grades', toggle(draft.grades, g))}>
              Grade {g}
            </Chip>
          ))}
        </div>
      </Group>

      <Group title="Quality Score">
        <div className="flex flex-wrap gap-2">
          {QUALITY.map((q) => (
            <Chip key={q} active={draft.minQuality === q} onClick={() => set('minQuality', draft.minQuality === q ? 0 : q)}>
              {q}+
            </Chip>
          ))}
        </div>
      </Group>

      <Group title="Rating">
        <div className="flex flex-wrap gap-2">
          {RATINGS.map((r) => (
            <Chip key={r} active={draft.minRating === r} onClick={() => set('minRating', draft.minRating === r ? 0 : r)}>
              {r}+ stars
            </Chip>
          ))}
        </div>
      </Group>

      <Group title="Distance">
        <div className="flex flex-wrap gap-2">
          {DISTANCES.map((d) => (
            <Chip key={d} active={draft.maxDistance === d} onClick={() => set('maxDistance', draft.maxDistance === d ? 0 : d)}>
              {'≤ '}{d} km
            </Chip>
          ))}
        </div>
      </Group>

      <Group title="Pickup">
        <div className="flex flex-col gap-2.5">
          {PICKUP_OPTIONS.map((p) => (
            <label key={p.value} className="flex items-center gap-2.5 text-sm">
              <Checkbox checked={draft.pickup.includes(p.value)} onCheckedChange={() => set('pickup', toggle(draft.pickup, p.value))} />
              {p.label}
            </label>
          ))}
        </div>
      </Group>

      <Group title="Donation">
        <label className="flex items-center gap-2.5 text-sm">
          <Checkbox checked={draft.donation} onCheckedChange={(v) => set('donation', v === true)} />
          Available for Donation
        </label>
      </Group>

      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => {
            setDraft(EMPTY_FILTERS)
            onApply(EMPTY_FILTERS)
          }}
        >
          Clear Filters
        </Button>
        <Button className="flex-1" onClick={() => onApply(draft)}>
          Apply Filters
        </Button>
      </div>
    </div>
  )
}
