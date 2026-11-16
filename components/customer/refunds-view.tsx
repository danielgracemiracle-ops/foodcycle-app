'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { CheckCircle2, Clock, Undo2 } from 'lucide-react'
import { useCurrentUser, useDb, useHydrated } from '@/hooks/use-db'
import { formatDate, formatRupiah } from '@/lib/format'
import { EmptyState, PageHeader, StatCard } from '@/components/shared/page'
import { Badge } from '@/components/ui/badge'
import type { Refund } from '@/types'

const STATUS_LABEL: Record<Refund['status'], string> = {
  requested: 'Under review',
  pending: 'Processing',
  completed: 'Sent',
  rejected: 'Declined',
}

export function RefundsView() {
  const db = useDb()
  const user = useCurrentUser()
  const hydrated = useHydrated()

  const refunds = useMemo(
    () =>
      (db.refunds ?? [])
        .filter((r) => r.userId === user?.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [db.refunds, user?.id],
  )

  if (!hydrated) return <div className="h-80 animate-pulse rounded-3xl bg-muted" />

  const pending = refunds.filter((r) => r.status === 'pending' || r.status === 'requested')
  const sent = refunds.filter((r) => r.status === 'completed')

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Refunds"
        description="Money returned for cancelled orders, rejected orders, and approved refund requests. Our team sends each refund back to your payment method, usually within 1–3 business days."
      />

      {refunds.length === 0 ? (
        <EmptyState
          icon={Undo2}
          title="No refunds"
          description="Cancelled orders and refund requests appear here. To request one, open a received order and tap Request refund."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard label="Being processed" value={formatRupiah(pending.reduce((s, r) => s + r.amount, 0))} icon={Clock} hint={`${pending.length} refund${pending.length === 1 ? '' : 's'}`} />
            <StatCard label="Returned to you" value={formatRupiah(sent.reduce((s, r) => s + r.amount, 0))} icon={CheckCircle2} hint={`${sent.length} refund${sent.length === 1 ? '' : 's'}`} />
          </div>

          <ul className="flex flex-col gap-3">
            {refunds.map((r) => {
              const hasOrder = db.orders.some((o) => o.id === r.orderId)
              const done = r.status === 'completed'
              return (
                <li key={r.id} className="flex flex-col gap-3 rounded-2xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between md:p-5">
                  <div className="flex min-w-0 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {hasOrder ? (
                        <Link href={`/orders/${r.orderId}`} className="font-mono text-sm font-medium underline-offset-4 hover:underline">
                          {r.orderId}
                        </Link>
                      ) : (
                        <span className="font-mono text-sm font-medium">{r.orderId}</span>
                      )}
                      <Badge variant={r.status === 'rejected' ? 'destructive' : done ? 'secondary' : 'default'}>{STATUS_LABEL[r.status]}</Badge>
                    </div>
                    <p className="text-sm leading-relaxed text-pretty text-muted-foreground">{r.reason}</p>
                    <p className="text-xs text-muted-foreground">
                      Requested {formatDate(r.createdAt)}
                      {done && r.completedAt ? ` · Sent ${formatDate(r.completedAt)}` : ''}
                      {done && r.note ? ` · Ref ${r.note}` : ''}
                      {r.status === 'rejected' && r.note ? ` · Reason: ${r.note}` : ''}
                    </p>
                  </div>
                  <p className="font-heading text-xl font-bold tabular-nums">{formatRupiah(r.amount)}</p>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}
