'use client'

import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import type { Db, SocialInstitution } from '@/types'
import { useAction } from '@/hooks/use-db'
import { institutionCapacity } from '@/lib/donation-limit'
import { cn } from '@/lib/utils'
import { updateInstitution } from '@/services/profile-service'
import { Panel } from '@/components/shared/page'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'

const MAX_LIMIT = 1000

export function DailyLimitPanel({ institution, db }: { institution: SocialInstitution; db: Db }) {
  const { limit, used, remaining, isFull } = institutionCapacity(db, institution)
  const [draft, setDraft] = useState(String(limit))
  const [save, saving] = useAction(updateInstitution, { success: 'Daily limit updated' })

  const value = Number(draft)
  const valid = Number.isInteger(value) && value >= 1 && value <= MAX_LIMIT
  const changed = valid && value !== limit
  const step = (delta: number) => setDraft(String(Math.min(MAX_LIMIT, Math.max(1, (valid ? value : limit) + delta))))

  return (
    <Panel
      title="Daily donation limit"
      description="Set how many meals you can receive per day. Once reached, donors can't choose you until tomorrow."
    >
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm font-medium">Today</p>
            <p className="text-sm tabular-nums">
              <span className="font-heading text-lg font-semibold">{used}</span>
              <span className="text-muted-foreground"> / {limit} meals</span>
            </p>
          </div>
          <Progress value={Math.min(100, (used / limit) * 100)} aria-label="Daily limit used" />
          <p className={cn('text-xs', isFull ? 'font-medium text-destructive' : 'text-muted-foreground')}>
            {isFull ? 'Limit reached. New donations reopen tomorrow.' : `${remaining} meal(s) left today`}
          </p>
        </div>

        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (changed) save({ maxDailyCapacity: value })
          }}
        >
          <label htmlFor="daily-limit" className="text-sm font-medium">Meals per day</label>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="icon" onClick={() => step(-5)} aria-label="Decrease by 5">
              <Minus />
            </Button>
            <Input
              id="daily-limit"
              inputMode="numeric"
              value={draft}
              onChange={(e) => setDraft(e.target.value.replace(/\D/g, ''))}
              aria-invalid={!valid}
              className="w-20 text-center tabular-nums"
            />
            <Button type="button" variant="outline" size="icon" onClick={() => step(5)} aria-label="Increase by 5">
              <Plus />
            </Button>
            <Button type="submit" disabled={!changed || saving}>
              {saving ? 'Saving' : 'Save'}
            </Button>
          </div>
          {!valid && <p className="text-xs text-destructive">Enter a number between 1 and {MAX_LIMIT}.</p>}
        </form>
      </div>
    </Panel>
  )
}
