'use client'

import { Undo2 } from 'lucide-react'
import { useState } from 'react'
import type { Order } from '@/types'
import { useAction } from '@/hooks/use-db'
import { formatDateTime, formatRupiah } from '@/lib/format'
import { REFUND_REASON_MAX, REFUND_REASON_MIN } from '@/lib/refund'
import { requestRefund } from '@/services/order-service'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

export function RefundDialog({ order, deadline }: { order: Order; deadline: Date }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [run, pending] = useAction(requestRefund, {
    success: 'Refund request sent. We will review it soon.',
    onSuccess: () => setOpen(false),
  })
  const tooShort = reason.trim().length < REFUND_REASON_MIN

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline">
            <Undo2 data-icon="inline-start" />
            Request refund
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request a refund</DialogTitle>
          <DialogDescription>
            {`Something wrong with the food? Tell us what happened. If approved, ${formatRupiah(order.total)} is returned to your payment method. Requests close ${formatDateTime(deadline.toISOString())}.`}
          </DialogDescription>
        </DialogHeader>
        <form
          id="refund-form"
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (!tooShort && !pending) run(order.id, reason)
          }}
        >
          <label htmlFor="refund-reason" className="text-sm font-medium">What went wrong?</label>
          <Textarea
            id="refund-reason"
            rows={4}
            maxLength={REFUND_REASON_MAX}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. The rice was spoiled when I picked it up."
          />
          <p className="flex justify-between text-xs text-muted-foreground">
            <span>{tooShort ? `At least ${REFUND_REASON_MIN} characters` : ''}</span>
            <span className="tabular-nums">{reason.length}/{REFUND_REASON_MAX}</span>
          </p>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="submit" form="refund-form" disabled={pending || tooShort}>
            {pending ? 'Sending…' : 'Send request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
