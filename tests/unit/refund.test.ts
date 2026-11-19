import { describe, expect, it } from 'vitest'
import { REFUND_WINDOW_HOURS, receivedAt, refundDeadline, refundPhotoUrl } from '@/lib/refund'
import { hoursFromNow, makeOrder } from '../fixtures'

describe('Refund rules (lib/refund.ts)', () => {
  it('UT-R01: unfinished orders have no receipt time and no refund deadline', () => {
    const order = makeOrder({ status: 'Preparing', history: [{ status: 'Preparing', at: hoursFromNow(-1) }] })
    expect(receivedAt(order)).toBeUndefined()
    expect(refundDeadline(order)).toBeUndefined()
  })

  it('UT-R02: cancelled orders cannot be refunded through this flow', () => {
    expect(refundDeadline(makeOrder({ status: 'Cancelled' }))).toBeUndefined()
  })

  it('UT-R03: uses the latest Picked Up / Completed event as the receipt time', () => {
    expect(receivedAt(makeOrder())).toBe(hoursFromNow(-2))
  })

  it(`UT-R04: deadline is exactly ${REFUND_WINDOW_HOURS} hours after receipt`, () => {
    const deadline = refundDeadline(makeOrder())!
    expect(deadline.getTime() - new Date(hoursFromNow(-2)).getTime()).toBe(REFUND_WINDOW_HOURS * 3600_000)
  })

  it('UT-R05: photo URLs are routed through the private proxy and encoded', () => {
    expect(refundPhotoUrl('refunds/a b.png')).toBe('/api/refund-photos?pathname=refunds%2Fa%20b.png')
  })
})
