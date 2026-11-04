'use client'

import { CreditCard, ExternalLink, HandHeart, Loader2, Lock, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import useSWR from 'swr'
import { toast } from 'sonner'
import { useCurrentUser, useDb, useHydrated } from '@/hooks/use-db'
import { cartLines, cartTotals } from '@/lib/selectors'
import { formatRupiah } from '@/lib/format'
import { cn } from '@/lib/utils'
import { listPaymentChannels, startPayment } from '@/services/order-service'
import { ButtonLink } from '@/components/shared/button-link'
import { EmptyState, PageHeader, Panel } from '@/components/shared/page'
import { Button } from '@/components/ui/button'
import { HoldCountdown } from './hold-countdown'
import { SummaryLines, SummaryTotals } from './order-summary'

export function PaymentView() {
  const db = useDb()
  const user = useCurrentUser()
  const hydrated = useHydrated()
  const router = useRouter()
  const [method, setMethod] = useState<string>()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string>()
  const [expired, setExpired] = useState(false)
  const handleExpire = useCallback(() => setExpired(true), [])

  const draft = user ? db.checkoutDrafts[user.id] : undefined
  const lines = user ? cartLines(db, user.id) : []
  const totals = cartTotals(lines)
  const ready = Boolean(hydrated && user && draft?.holdKey && draft.holdExpiresAt && lines.length > 0)

  const channels = useSWR(ready ? ['payment-channels', totals.total] : null, () => listPaymentChannels(), {
    revalidateOnFocus: false,
  })

  if (!hydrated || !user) return <div className="h-80 animate-pulse rounded-3xl bg-muted" />

  const institution = draft?.institutionId ? db.institutions.find((i) => i.id === draft.institutionId) : undefined

  if (!ready || !draft?.holdExpiresAt) {
    return (
      <EmptyState
        icon={CreditCard}
        title="No checkout in progress"
        description="Start from your cart to review the order before paying."
        action={<ButtonLink href="/cart">Go to cart</ButtonLink>}
      />
    )
  }

  const selected = channels.data?.find((c) => c.code === method)
  const fee = selected?.fee ?? 0

  const pay = async () => {
    if (processing || expired || !method) return
    setError(undefined)
    setProcessing(true)
    try {
      const { paymentUrl, merchantOrderId } = await startPayment(method)
      if (window.self !== window.top) {
        // Duitku's page cannot load inside the preview frame, so open it in a new tab and wait here.
        window.open(paymentUrl, '_blank', 'noopener')
        router.push(`/payment/return?merchantOrderId=${encodeURIComponent(merchantOrderId)}`)
      } else {
        window.location.href = paymentUrl
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not start the payment'
      setError(msg)
      toast.error(msg)
      setProcessing(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Payment" description="Pay securely through Duitku. Your portions stay reserved until the timer runs out." />
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-6">
          <Panel title="Payment method">
            {channels.isLoading && (
              <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading payment methods">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted" />
                ))}
              </div>
            )}
            {channels.error && (
              <div className="flex flex-col items-start gap-3 rounded-xl bg-destructive/10 p-4 text-sm">
                <p role="alert" className="font-medium text-destructive">
                  {channels.error instanceof Error ? channels.error.message : 'Could not load payment methods.'}
                </p>
                <Button variant="outline" size="sm" onClick={() => channels.mutate()}>
                  <RefreshCw data-icon="inline-start" />
                  Try again
                </Button>
              </div>
            )}
            {channels.data && channels.data.length === 0 && (
              <p className="text-sm text-muted-foreground">No payment methods are available for this amount.</p>
            )}
            {channels.data && channels.data.length > 0 && (
              <div role="radiogroup" aria-label="Payment method" className="grid gap-3 sm:grid-cols-2">
                {channels.data.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    role="radio"
                    aria-checked={method === c.code}
                    disabled={processing}
                    onClick={() => setMethod(c.code)}
                    className={cn(
                      'flex items-center gap-3 rounded-2xl border-2 p-3 text-left transition-colors disabled:opacity-60',
                      method === c.code ? 'border-primary bg-accent/60' : 'border-border hover:border-primary/40',
                    )}
                  >
                    <span className="flex h-10 w-14 shrink-0 items-center justify-center rounded-lg bg-card p-1">
                      {/* eslint-disable-next-line @next/next/no-img-element -- logos are served by Duitku */}
                      <img src={c.image} alt="" className="max-h-full max-w-full object-contain" />
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate font-semibold">{c.name}</span>
                      <span className="text-xs text-muted-foreground">{c.fee > 0 ? `Fee ${formatRupiah(c.fee)}` : 'No fee'}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </Panel>

          {draft.type === 'donation' && institution && (
            <Panel title="Donation information">
              <div className="flex items-start gap-3">
                <HandHeart className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                <div className="flex flex-col gap-1 text-sm">
                  <span className="font-semibold">{institution.name}</span>
                  <span className="text-muted-foreground">{institution.address}, {institution.city}</span>
                  {draft.message && <span className="italic">&ldquo;{draft.message}&rdquo;</span>}
                </div>
              </div>
            </Panel>
          )}
        </div>

        <Panel title="Order summary" className="lg:sticky lg:top-24 lg:self-start">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {draft.type === 'donation' ? 'Donation order' : 'Personal order'}
          </p>
          <SummaryLines lines={lines} />
          <SummaryTotals totals={totals} />
          {fee > 0 && (
            <p className="flex justify-between text-sm text-muted-foreground">
              <span>Payment fee ({selected?.name})</span>
              <span>{formatRupiah(fee)}</span>
            </p>
          )}
          <HoldCountdown expiresAt={draft.holdExpiresAt} onExpire={handleExpire} />
          {error && <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm font-medium text-destructive">{error}</p>}
          <Button size="lg" onClick={pay} disabled={processing || expired || !method}>
            {processing ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <Lock data-icon="inline-start" />}
            {processing ? 'Opening Duitku…' : method ? `Pay ${formatRupiah(totals.total)}` : 'Choose a payment method'}
          </Button>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ExternalLink className="size-3.5" aria-hidden="true" />
            {"You'll finish paying on Duitku's secure page."}
          </p>
          {!processing && (
            <ButtonLink href="/checkout" variant={expired ? 'default' : 'ghost'}>
              {expired ? 'Reserve again at checkout' : 'Back to checkout'}
            </ButtonLink>
          )}
        </Panel>
      </div>
    </div>
  )
}
