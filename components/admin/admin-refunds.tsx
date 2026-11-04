'use client'

import { useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Refund } from '@/types'
import { useDb, useHydrated } from '@/hooks/use-db'
import { formatDate, formatRupiah } from '@/lib/format'
import { completeRefund } from '@/services/admin-service'
import { PageHeader } from '@/components/shared/page'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

function RefundAction({ refund }: { refund: Refund }) {
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  if (refund.status === 'completed') {
    return <span className="text-xs text-muted-foreground">{refund.note}</span>
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    try {
      await completeRefund(refund.id, note)
      toast.success('Refund marked as sent')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update refund')
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <Input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Transfer reference"
        aria-label={`Transfer reference for ${refund.orderId}`}
        className="h-8 w-40"
        maxLength={200}
      />
      <Button type="submit" size="sm" disabled={busy || note.trim().length < 3}>
        {busy && <Loader2 data-icon="inline-start" className="animate-spin" />}
        Mark sent
      </Button>
    </form>
  )
}

export function AdminRefundsView() {
  const db = useDb()
  const hydrated = useHydrated()
  const refunds = db.refunds ?? []
  const rows = useMemo(
    () => [...refunds].sort((a, b) => (a.status === b.status ? b.createdAt.localeCompare(a.createdAt) : a.status === 'pending' ? -1 : 1)),
    [refunds],
  )
  const pending = rows.filter((r) => r.status === 'pending')

  if (!hydrated) return <div className="h-80 animate-pulse rounded-3xl bg-muted" />

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Refunds"
        description={`${pending.length} waiting · ${formatRupiah(pending.reduce((s, r) => s + r.amount, 0))} to send. Duitku has no refund API: send each refund from the Duitku dashboard, then record the reference here.`}
      />
      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">No refunds yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => {
                const customer = db.users.find((u) => u.id === r.userId)
                return (
                  <TableRow key={r.id}>
                    <TableCell>
                      <p className="font-mono text-xs">{r.orderId}</p>
                      <p className="text-xs text-muted-foreground">Payment {r.paymentId} · {formatDate(r.createdAt)}</p>
                    </TableCell>
                    <TableCell>
                      <p>{customer?.name ?? '-'}</p>
                      <p className="text-xs text-muted-foreground">{customer?.email}</p>
                    </TableCell>
                    <TableCell className="max-w-56 text-sm text-pretty">{r.reason}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatRupiah(r.amount)}</TableCell>
                    <TableCell>
                      <Badge variant={r.status === 'pending' ? 'default' : 'secondary'}>{r.status === 'pending' ? 'To send' : 'Sent'}</Badge>
                    </TableCell>
                    <TableCell>
                      <RefundAction refund={r} />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
