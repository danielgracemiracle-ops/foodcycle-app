'use client'

import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export function RatingInline({ rating, count, className }: { rating: number; count?: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium', className)}>
      <Star className="size-3.5 fill-warning text-warning" aria-hidden="true" />
      <span>
        <span className="sr-only">Rated </span>
        {rating.toFixed(1)}
      </span>
      {count !== undefined && <span className="text-muted-foreground">({count})</span>}
    </span>
  )
}

export function StarsDisplay({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)} aria-label={`${value} out of 5 stars`} role="img">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={cn('size-3.5', i <= Math.round(value) ? 'fill-warning text-warning' : 'text-border')} aria-hidden="true" />
      ))}
    </span>
  )
}

export function StarInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <fieldset className="flex items-center justify-between gap-4">
      <legend className="sr-only">{label}</legend>
      <span className="text-sm font-medium" aria-hidden="true">
        {label}
      </span>
      <div className="flex items-center gap-1" role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={value === i}
            aria-label={`${i} star${i > 1 ? 's' : ''}`}
            onClick={() => onChange(i)}
            className="rounded-md p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Star className={cn('size-6 transition-colors', i <= value ? 'fill-warning text-warning' : 'text-border hover:text-warning/60')} />
          </button>
        ))}
      </div>
    </fieldset>
  )
}
