import { ShieldCheck } from 'lucide-react'
import type { QualityAssessment } from '@/types'
import { QUALITY_WEIGHTS, qualityLabel } from '@/lib/quality'
import { cn } from '@/lib/utils'

function scoreTone(score: number) {
  if (score >= 75) return 'text-primary'
  if (score >= 60) return 'text-warning-foreground'
  return 'text-destructive'
}

export function QualityPill({ score, className }: { score: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium', scoreTone(score), className)}>
      <ShieldCheck className="size-3.5" aria-hidden="true" />
      <span>
        <span className="sr-only">Quality score </span>
        {score}
        <span className="text-muted-foreground">/100</span>
      </span>
    </span>
  )
}

const ROWS: { key: keyof Omit<QualityAssessment, 'score'>; label: string }[] = [
  { key: 'freshness', label: 'Freshness' },
  { key: 'packaging', label: 'Packaging' },
  { key: 'restaurantRating', label: 'Restaurant Rating' },
  { key: 'customerFeedback', label: 'Customer Feedback' },
]

export function QualityBreakdown({ quality }: { quality: QualityAssessment }) {
  const label = qualityLabel(quality.score)
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Quality Score</p>
          <p className="font-heading text-4xl font-bold tracking-tight">
            {quality.score}
            <span className="text-lg font-medium text-muted-foreground">/100</span>
          </p>
        </div>
        <span className={cn('rounded-full bg-accent px-3 py-1 text-sm font-semibold', scoreTone(quality.score))}>{label}</span>
      </div>
      <ul className="flex flex-col gap-3">
        {ROWS.map(({ key, label: rowLabel }) => (
          <li key={key} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-sm">
              <span>
                {rowLabel} <span className="text-xs text-muted-foreground">({Math.round(QUALITY_WEIGHTS[key] * 100)}%)</span>
              </span>
              <span className="font-semibold tabular-nums">{quality[key]}</span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-label={rowLabel}
              aria-valuenow={quality[key]}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${quality[key]}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
