'use client'

import { Star } from 'lucide-react'
import { useState } from 'react'
import type { Order } from '@/types'
import { useAction } from '@/hooks/use-db'
import { submitReview } from '@/services/engagement-service'
import { StarInput } from '@/components/shared/rating-stars'
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

const COMMENT_MAX = 500

export function ReviewDialog({ order }: { order: Order }) {
  const [open, setOpen] = useState(false)
  const [foodQuality, setFoodQuality] = useState(0)
  const [packaging, setPackaging] = useState(0)
  const [experience, setExperience] = useState(0)
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string>()
  const [run, pending] = useAction(submitReview, {
    success: 'Thanks for your review!',
    onSuccess: () => setOpen(false),
  })

  const submit = () => {
    if (!foodQuality || !packaging || !experience) return setError('Please rate all three categories.')
    setError(undefined)
    run({ orderId: order.id, foodId: order.items[0].foodId, foodQuality, packaging, experience, comment })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Star data-icon="inline-start" />
            Rate & Review
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review your order</DialogTitle>
          <DialogDescription>
            Your feedback updates the food&apos;s quality score and helps other rescuers.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <StarInput label="Food quality" value={foodQuality} onChange={setFoodQuality} />
          <StarInput label="Packaging" value={packaging} onChange={setPackaging} />
          <StarInput label="Overall experience" value={experience} onChange={setExperience} />
          <div className="flex flex-col gap-2">
            <label htmlFor="review-comment" className="text-sm font-medium">Comment (optional)</label>
            <Textarea
              id="review-comment"
              rows={4}
              maxLength={COMMENT_MAX}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How was the food?"
            />
            <p className="text-right text-xs text-muted-foreground tabular-nums">{comment.length}/{COMMENT_MAX}</p>
          </div>
          {error && <p role="alert" className="text-sm font-medium text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={pending}>{pending ? 'Submitting…' : 'Submit review'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
