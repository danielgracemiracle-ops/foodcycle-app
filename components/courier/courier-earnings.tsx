'use client'

import Link from 'next/link'
import { Banknote, Clock, ShieldAlert, Wallet } from 'lucide-react'
import type { Db } from '@/types'
import { useAction, useCurrentUser, useDb, useHydrated } from '@/hooks/use-db'
import { formatDate, formatRupiah } from '@/lib/format'
import { courierBalance, courierEarning, courierEarnings, MIN_PAYOUT } from '@/lib/courier-pay'
import { mask } from '@/lib/registration'
import { requestCourierPayout } from '@/services/courier-service'
import { EmptyState, PageHeader, StatCard } from '@/components/shared/page'
import { StatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'

const VERIFY_COPY = {
  pending: {
    title: 'Your courier account is being reviewed',
    body: 'An admin is checking your ID, licence and vehicle documents. You can take delivery jobs once you are approved.',
  },
  rejected: {
    title: 'Your courier registration was rejected',
    body: 'Your documents could not be verified. Contact support to fix your registration.',
  },
  suspended: {
    title: 'Your courier account is suspended',
    body: 'You cannot take new delivery jobs right now. Contact support for details.',
  },
} as const

export function courierProfileOf(db: Db, userId: string) {
  return (db.couriers ?? []).find((c) => c.userId === userId)
}

/** Shown above courier pages until an admin approves the courier. */
export function CourierVerificationBanner({ db, userId }: { db: Db; userId: string }) {
  const status = courierProfileOf(db, userId)?.verification ?? 'pending'
  if (status === 'approved') return null
  const copy = VERIFY_COPY[status]
  return (
    <div role="status" className="flex gap-3 rounded-2xl border border-primary/30 bg-accent p-4 text-accent-foreground">
      <ShieldAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div className="flex flex-col gap-1">
        <p className="font-semibold">{copy.title}</p>
        <p className="text-sm leading-relaxed">{copy.body}</p>
      </div>
    </div>
  )
}

export function CourierEarningsView() {
  const db = useDb()
  const user = useCurrentUser()
  const hydrated = useHydrated()
  const [request, requesting] = useAction(requestCourierPayout, { success: 'Payout requested' })
  if (!hydrated || !user) return <div className="h-96 animate-pulse rounded-3xl bg-muted" />

  const profile = courierProfileOf(db, user.id)
  const balance = courierBalance(db, user.id)
  const jobs = courierEarnings(db, user.id)
  const payouts = (db.courierPayouts ?? []).filter((p) => p.userId === user.id)
  const canRequest = profile?.verification === 'approved' && balance.requested === 0 && balance.available >= MIN_PAYOUT

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Earnings" description="Donors pay the delivery fee. You keep 90% of it for every finished delivery." />
      <CourierVerificationBanner db={db} userId={user.id} />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Available balance" value={formatRupiah(balance.available)} icon={Wallet} />
        <StatCard label="Waiting for transfer" value={formatRupiah(balance.requested)} icon={Clock} />
        <StatCard label="Paid out" value={formatRupiah(balance.paid)} icon={Banknote} />
      </div>

      <section className="flex flex-col gap-4 rounded-2xl border bg-card p-4 md:flex-row md:items-center md:justify-between md:p-5">
        <div className="flex flex-col gap-1">
          <h2 className="font-heading font-semibold">Withdraw to your bank</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {profile
              ? `${profile.bank.bankName} ${mask(profile.bank.accountNumber)} · ${profile.bank.accountHolder}`
              : 'No bank account on file.'}
            {' · '}Minimum {formatRupiah(MIN_PAYOUT)}. An admin transfers it manually.
          </p>
        </div>
        <Button onClick={() => request()} disabled={!canRequest || requesting}>
          {requesting ? 'Requesting…' : `Request ${formatRupiah(balance.available)}`}
        </Button>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading font-semibold">Payouts</h2>
        {payouts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No payout requests yet.</p>
        ) : (
          <ul className="flex flex-col divide-y rounded-2xl border bg-card">
            {payouts.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 p-4">
                <div className="flex min-w-0 flex-col">
                  <span className="font-medium">{formatRupiah(p.amount)}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {formatDate(p.createdAt)}
                    {p.note ? ` · ${p.note}` : ''}
                  </span>
                </div>
                <StatusBadge status={p.status === 'requested' ? 'pending' : p.status === 'paid' ? 'approved' : 'rejected'} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading font-semibold">Paid deliveries</h2>
        {jobs.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="No earnings yet"
            description="Finish a paid delivery to start earning."
          />
        ) : (
          <ul className="flex flex-col divide-y rounded-2xl border bg-card">
            {jobs.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 p-4">
                <Link href="/courier/history" className="flex min-w-0 flex-col hover:underline">
                  <span className="font-medium">{o.id}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(o.createdAt)}</span>
                </Link>
                <span className="font-semibold text-primary">+{formatRupiah(courierEarning(o))}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
