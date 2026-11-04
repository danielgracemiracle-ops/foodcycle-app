'use client'

import { AlertTriangle, Clock, FlaskConical, Loader2, XCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { toast } from 'sonner'
import { confirmPayment, isSandboxPayment, simulateSandboxPayment } from '@/services/order-service'
import { ButtonLink } from '@/components/shared/button-link'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/page'

export function PaymentReturn({ merchantOrderId }: { merchantOrderId: string }) {
  const router = useRouter()
  const { data, error, mutate } = useSWR(merchantOrderId ? ['confirm-payment', merchantOrderId] : null, () => confirmPayment(merchantOrderId), {
    refreshInterval: (latest) => (!latest || latest.status === 'pending' ? 4000 : 0),
    revalidateOnFocus: true,
  })

  const sandbox = useSWR('sandbox-payment', () => isSandboxPayment(), { revalidateOnFocus: false })
  const [simulating, setSimulating] = useState(false)

  const markPaid = async () => {
    setSimulating(true)
    try {
      await mutate(await simulateSandboxPayment(merchantOrderId), { revalidate: false })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not simulate the payment')
      setSimulating(false)
    }
  }

  const paidIds = data?.status === 'paid' ? data.orderIds : null
  useEffect(() => {
    if (paidIds) router.replace(`/payment/success?orders=${paidIds.join(',')}`)
  }, [paidIds, router])

  if (!merchantOrderId || error) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="We couldn't find this payment"
        description={error instanceof Error ? error.message : 'The payment link is incomplete.'}
        action={<ButtonLink href="/orders">View my orders</ButtonLink>}
      />
    )
  }

  if (data?.status === 'failed') {
    return (
      <EmptyState
        icon={XCircle}
        title="Payment not completed"
        description="Duitku reports that this payment failed or expired. You were not charged."
        action={<ButtonLink href="/checkout">Try again at checkout</ButtonLink>}
      />
    )
  }

  if (data?.status === 'unfulfilled') {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Paid, but the food sold out"
        description="Your payment arrived after the reservation ended and the portions were gone. A full refund has been queued and our team will send it shortly."
        action={<ButtonLink href="/orders">View my orders</ButtonLink>}
      />
    )
  }

  return (
    <EmptyState
      icon={data?.status === 'pending' ? Clock : Loader2}
      title={data?.status === 'pending' ? 'Waiting for your payment' : 'Checking your payment…'}
      description={
        data?.status === 'pending'
          ? `Finish paying on the Duitku page (${merchantOrderId}). This page updates automatically once Duitku confirms it.`
          : 'Confirming with Duitku. This only takes a moment.'
      }
      action={
        <div className="flex flex-wrap items-center justify-center gap-2">
          {data?.status === 'pending' && sandbox.data && (
            <Button onClick={markPaid} disabled={simulating}>
              {simulating ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <FlaskConical data-icon="inline-start" />}
              Sudah bayar (simulasi)
            </Button>
          )}
          <ButtonLink href="/payment" variant="ghost">Back to payment</ButtonLink>
        </div>
      }
    />
  )
}
