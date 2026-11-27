'use client'

import { useState } from 'react'
import { FileText } from 'lucide-react'
import type { CourierPayout, VerificationStatus } from '@/types'
import { useAction, useDb, useHydrated } from '@/hooks/use-db'
import { formatDate, formatRupiah } from '@/lib/format'
import { DOC_LABEL, docUrl } from '@/lib/legal-docs'
import { VEHICLES } from '@/lib/registration'
import { resolveCourierPayout, setCourierVerification } from '@/services/courier-service'
import { PageHeader } from '@/components/shared/page'
import { StatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const ORDER: Record<VerificationStatus, number> = { pending: 0, approved: 1, suspended: 2, rejected: 3 }

function VerifyButtons({ status, onSet }: { status: VerificationStatus; onSet: (v: VerificationStatus) => void }) {
  if (status === 'pending')
    return (
      <div className="flex justify-end gap-1">
        <Button size="sm" onClick={() => onSet('approved')}>Approve</Button>
        <Button size="sm" variant="ghost" onClick={() => onSet('rejected')}>Reject</Button>
      </div>
    )
  if (status === 'approved') return <Button size="sm" variant="ghost" onClick={() => onSet('suspended')}>Suspend</Button>
  return <Button size="sm" variant="outline" onClick={() => onSet('approved')}>Approve</Button>
}

function PayoutRow({ payout, name }: { payout: CourierPayout; name: string }) {
  const [note, setNote] = useState('')
  const [resolve, busy] = useAction(resolveCourierPayout, { success: 'Payout updated' })
  return (
    <li className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col">
        <span className="font-medium">
          {name} · {formatRupiah(payout.amount)}
        </span>
        <span className="text-xs text-muted-foreground">
          {payout.bank.bankName} {payout.bank.accountNumber} a.n. {payout.bank.accountHolder} · {formatDate(payout.createdAt)}
        </span>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          aria-label="Transfer reference or reason"
          placeholder="Transfer ref / reason"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="sm:w-48"
        />
        <Button size="sm" disabled={busy} onClick={() => resolve(payout.id, true, note)}>Mark paid</Button>
        <Button size="sm" variant="ghost" disabled={busy} onClick={() => resolve(payout.id, false, note)}>Decline</Button>
      </div>
    </li>
  )
}

export function AdminCouriersView() {
  const db = useDb()
  const hydrated = useHydrated()
  const [verify] = useAction(setCourierVerification, { success: 'Courier updated' })
  if (!hydrated) return <div className="h-96 animate-pulse rounded-3xl bg-muted" />

  const nameOf = (id: string) => db.users.find((u) => u.id === id)?.name ?? 'Courier'
  const couriers = [...(db.couriers ?? [])].sort((a, b) => ORDER[a.verification] - ORDER[b.verification])
  const pending = (db.courierPayouts ?? []).filter((p) => p.status === 'requested')

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Couriers" description="Verify couriers before they can take jobs, and send requested payouts." />

      <section className="flex flex-col gap-3">
        <h2 className="font-heading font-semibold">Payout requests ({pending.length})</h2>
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">No payouts waiting.</p>
        ) : (
          <ul className="flex flex-col divide-y rounded-2xl border bg-card">
            {pending.map((p) => (
              <PayoutRow key={p.id} payout={p} name={nameOf(p.userId)} />
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading font-semibold">Registrations</h2>
        <div className="overflow-x-auto rounded-2xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Courier</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>NIK / SIM</TableHead>
                <TableHead>Documents</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right"><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {couriers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No courier registrations yet.</TableCell>
                </TableRow>
              )}
              {couriers.map((c) => (
                <TableRow key={c.userId}>
                  <TableCell>
                    <p className="font-medium">{nameOf(c.userId)}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(c.submittedAt)}</p>
                  </TableCell>
                  <TableCell>
                    {VEHICLES.find((v) => v.value === c.vehicleType)?.label ?? c.vehicleType}
                    <p className="text-xs text-muted-foreground">{c.vehiclePlate}</p>
                  </TableCell>
                  <TableCell className="text-xs">
                    {c.nik}
                    <br />
                    {c.simNumber}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {c.documents.map((d) => (
                        <Button
                          key={d.pathname}
                          variant="outline"
                          size="sm"
                          render={<a href={docUrl(d.pathname)} target="_blank" rel="noopener noreferrer" />}
                        >
                          <FileText aria-hidden="true" />
                          {DOC_LABEL[d.kind] ?? d.kind}
                        </Button>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell><StatusBadge status={c.verification} /></TableCell>
                  <TableCell className="text-right">
                    <VerifyButtons status={c.verification} onSet={(v) => verify(c.userId, v)} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  )
}
