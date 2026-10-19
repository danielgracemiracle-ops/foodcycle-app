'use client'

import { Timer } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

function remainingMs(expiresAt: string) {
  return Math.max(0, new Date(expiresAt).getTime() - Date.now())
}

export function HoldCountdown({ expiresAt, onExpire }: { expiresAt: string; onExpire?: () => void }) {
  const [left, setLeft] = useState(() => remainingMs(expiresAt))

  useEffect(() => {
    const id = setInterval(() => {
      const next = remainingMs(expiresAt)
      setLeft(next)
      if (next === 0) {
        clearInterval(id)
        onExpire?.()
      }
    }, 1000)
    return () => clearInterval(id)
  }, [expiresAt, onExpire])

  const minutes = Math.floor(left / 60_000)
  const seconds = Math.floor((left % 60_000) / 1000)
  const urgent = left < 2 * 60_000

  return (
    <div
      role="timer"
      aria-live="off"
      className={cn(
        'flex items-center gap-3 rounded-xl border p-3 text-sm',
        urgent ? 'border-destructive/40 bg-destructive/10 text-destructive' : 'border-primary/30 bg-accent/60',
      )}
    >
      <Timer className="size-5 shrink-0" aria-hidden="true" />
      <span className="flex flex-col">
        <span className="font-semibold tabular-nums">
          {left === 0 ? 'Reservation expired' : `Reserved for you · ${minutes}:${String(seconds).padStart(2, '0')}`}
        </span>
        <span className={cn('text-xs', urgent ? 'text-destructive' : 'text-muted-foreground')}>
          {left === 0
            ? 'The portions went back on sale. Return to checkout to reserve them again.'
            : 'Other buyers cannot take these portions until the timer ends.'}
        </span>
      </span>
    </div>
  )
}
