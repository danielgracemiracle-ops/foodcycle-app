'use client'

import { Building2, CreditCard, HandHeart, Landmark, Loader2, Lock, Smartphone } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import type { PaymentMethod } from '@/types'
import { useCurrentUser, useDb, useHydrated } from '@/hooks/use-db'
import { cartLines, cartTotals } from '@/lib/selectors'
import { formatRupiah } from '@/lib/format'
import { cn } from '@/lib/utils'
import { processPayment } from '@/services/order-service'
import { ButtonLink } from '@/components/shared/button-link'
import { EmptyState, PageHeader, Panel } from '@/components/shared/page'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { HoldCountdown } from './hold-countdown'
import { SummaryLines, SummaryTotals } from './order-summary'

const METHODS: { value: PaymentMethod; icon: typeof CreditCard; body: string }[] = [
  { value: 'E-Wallet', icon: Smartphone, body: 'GoPay, OVO, DANA, ShopeePay' },
  { value: 'Bank Transfer', icon: Landmark, body: 'BCA, Mandiri, BNI, BRI' },
  { value: 'Virtual Account', icon: Building2, body: 'Pay via any bank VA number' },
]

export function PaymentView() {
  const db = useDb()
  const user = useCurrentUser()
  const hydrated = useHydrated()
  const router = useRouter()
  const [method, setMethod] = useState<PaymentMethod>('E-Wallet')
  const [simulateFailure, setSimulateFailure] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string>()
  const [expired, setExpired] = useState(false)
  const handleExpire = useCallback(() => setExpired(true), [])

  if (!hydrated || !user) return <div className="h-80 animate-pulse rounded-3xl bg-muted" />

  const draft = db.checkoutDrafts[user.id]
  const lines = cartLines(db, user.id)
  const totals = cartTotals(lines)
  const institution = draft?.institutionId ? db.institutions.find((i) => i.id === draft.institutionId) : undefined

  if (!draft?.holdKey || !draft.holdExpiresAt || lines.length === 0) {
    return (
      <EmptyState
        icon={CreditCard}
        title="No checkout in progress"
        description="Start from your cart to review the order before paying."
        action={<ButtonLink href="/cart">Go to cart</ButtonLink>}
      />
    )
  }

  const pay = async () => {
    if (processing || expired) return
    setError(undefined)
    setProcessing(true)
    try {
      const ids = await processPayment(method, simulateFailure)
      router.push(`/payment/success?orders=${ids.join(',')}`)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Payment failed'
      setError(msg)
      toast.error(msg)
      setProcessing(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Payment" description="This is a simulated payment — no real money is charged." />
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-6">
          <Panel title="Payment method">
            <div role="radiogroup" aria-label="Payment method" className="flex flex-col gap-3">
              {METHODS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  role="radio"
                  aria-checked={method === m.value}
                  disabled={processing}
                  onClick={() => setMethod(m.value)}
                  className={cn(
                    'flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-colors disabled:opacity-60',
                    method === m.value ? 'border-primary bg-accent/60' : 'border-border hover:border-primary/40',
                  )}
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                    <m.icon className="size-5 text-primary" aria-hidden="true" />
                  </span>
                  <span className="flex flex-col">
                    <span className="font-semibold">{m.value}</span>
                    <span className="text-sm text-muted-foreground">{m.body}</span>
                  </span>
                </button>
              ))}
            </div>
            <label className="flex items-center justify-between gap-3 rounded-xl border border-dashed p-3 text-sm">
              <span className="flex flex-col">
                <span className="font-medium">Simulate a declined payment</span>
                <span className="text-xs text-muted-foreground">Prototype only — test the failure state.</span>
              </span>
              <Switch checked={simulateFailure} onCheckedChange={setSimulateFailure} disabled={processing} />
            </label>
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
          <HoldCountdown expiresAt={draft.holdExpiresAt} onExpire={handleExpire} />
          {error && <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm font-medium text-destructive">{error}</p>}
          <Button size="lg" onClick={pay} disabled={processing || expired}>
            {processing ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <Lock data-icon="inline-start" />}
            {processing ? 'Processing payment…' : `Pay Now · ${formatRupiah(totals.total)}`}
          </Button>
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
