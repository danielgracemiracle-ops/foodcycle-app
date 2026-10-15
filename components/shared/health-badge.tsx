import { Leaf } from 'lucide-react'
import type { HealthLevel, HealthResult } from '@/lib/food-tags'
import { cn } from '@/lib/utils'

const STYLES: Record<HealthLevel, string> = {
  healthy: 'bg-success/15 text-success',
  balanced: 'bg-warning/20 text-warning-foreground',
  treat: 'bg-brand-orange/15 text-brand-orange',
}

export function HealthBadge({ health, compact, className }: { health: HealthResult; compact?: boolean; className?: string }) {
  return (
    <span
      title={`Health score ${health.score}/100`}
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap',
        STYLES[health.level],
        className,
      )}
    >
      <Leaf className="size-3" aria-hidden="true" />
      {health.label}
      {!compact && <span className="font-medium opacity-80 tabular-nums">· {health.score}</span>}
    </span>
  )
}
