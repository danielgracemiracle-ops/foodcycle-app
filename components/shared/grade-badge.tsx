import { Info } from 'lucide-react'
import type { FoodGrade } from '@/types'
import { GRADE_DISCLAIMER, GRADE_INFO } from '@/lib/quality'
import { cn } from '@/lib/utils'

const GRADE_STYLE: Record<FoodGrade, string> = {
  A: 'bg-primary text-primary-foreground',
  B: 'bg-accent text-accent-foreground ring-1 ring-primary/25',
  C: 'bg-warning text-foreground',
}

export function GradeBadge({
  grade,
  size = 'sm',
  compact = false,
  className,
}: {
  grade: FoodGrade
  size?: 'sm' | 'lg'
  compact?: boolean
  className?: string
}) {
  const info = GRADE_INFO[grade]
  if (size === 'lg') {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <span
          className={cn('flex size-12 items-center justify-center rounded-xl font-heading text-2xl font-bold', GRADE_STYLE[grade])}
          aria-hidden="true"
        >
          {grade}
        </span>
        <div>
          <p className="text-sm font-semibold">
            Grade {grade} — {info.label}
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">{info.description}</p>
        </div>
      </div>
    )
  }
  return (
    <span
      className={cn(
        'inline-flex h-6 shrink-0 items-center gap-1 whitespace-nowrap rounded-md px-1.5 text-xs leading-none font-semibold',
        GRADE_STYLE[grade],
        className,
      )}
      title={`${info.label}: ${info.description}`}
    >
      <span className="font-heading text-sm leading-none font-bold">{grade}</span>
      <span className="sr-only">Grade {grade}, </span>
      <span className={cn(compact && 'sr-only sm:not-sr-only')}>{info.label}</span>
    </span>
  )
}

export function GradeDisclaimer({ className }: { className?: string }) {
  return (
    <p className={cn('flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground', className)}>
      <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
      {GRADE_DISCLAIMER}
    </p>
  )
}
