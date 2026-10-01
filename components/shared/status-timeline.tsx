import { Check, X } from 'lucide-react'
import type { StatusEvent } from '@/types'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'

export function StatusTimeline<S extends string>({
  flow,
  history,
  current,
  terminal,
}: {
  flow: readonly S[]
  history: StatusEvent<S>[]
  current: S
  terminal?: S[]
}) {
  const stoppedAt = terminal?.includes(current) ? current : undefined
  const reached = new Map(history.map((h) => [h.status, h.at]))
  const currentIndex = flow.indexOf(current)
  const lastReachedIndex = stoppedAt
    ? Math.max(...flow.map((s, i) => (reached.has(s) ? i : -1)))
    : currentIndex

  const steps = stoppedAt ? [...flow.slice(0, lastReachedIndex + 1), stoppedAt] : flow

  return (
    <ol className="flex flex-col">
      {steps.map((status, i) => {
        const isStop = stoppedAt && i === steps.length - 1
        const done = isStop || i <= lastReachedIndex
        const active = !stoppedAt && i === currentIndex
        const at = reached.get(status)
        return (
          <li key={status} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-xs',
                  isStop
                    ? 'border-destructive bg-destructive text-primary-foreground'
                    : done
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card text-muted-foreground',
                  active && 'ring-4 ring-primary/20',
                )}
              >
                {isStop ? <X className="size-3.5" aria-hidden="true" /> : done ? <Check className="size-3.5" aria-hidden="true" /> : i + 1}
              </span>
              {i < steps.length - 1 && <span className={cn('my-1 w-0.5 flex-1 rounded-full', i < lastReachedIndex ? 'bg-primary' : 'bg-border')} />}
            </div>
            <div className={cn('flex min-h-12 flex-col pb-4', !done && 'opacity-60')}>
              <span className={cn('text-sm font-semibold', active && 'text-primary', isStop && 'text-destructive')}>
                {status}
                {active && <span className="sr-only"> (current)</span>}
              </span>
              {at && <span className="text-xs text-muted-foreground">{formatDateTime(at)}</span>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
