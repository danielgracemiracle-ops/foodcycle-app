import { type NextRequest, NextResponse } from 'next/server'
import { fulfillPayment, markPaymentFailed } from '@/server/checkout-core'
import { checkTransaction, verifyCallbackSignature } from '@/server/duitku'
import { withAppDb } from '@/server/runtime'

/**
 * Duitku server-to-server callback (form-encoded). The signature proves the request came from
 * Duitku; the status is then re-checked with Duitku before any order is created.
 */
export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null)
  const field = (k: string) => (typeof form?.get(k) === 'string' ? (form!.get(k) as string) : '')
  const merchantCode = field('merchantCode')
  const amount = field('amount')
  const merchantOrderId = field('merchantOrderId')
  const signature = field('signature')
  const resultCode = field('resultCode')

  if (!merchantOrderId || !signature || !/^FC-\d+$/.test(merchantOrderId)) return new NextResponse('Bad request', { status: 400 })
  if (!verifyCallbackSignature({ merchantCode, amount, merchantOrderId, signature })) {
    console.error('[duitku] invalid callback signature', merchantOrderId)
    return new NextResponse('Invalid signature', { status: 401 })
  }

  try {
    await withAppDb(async () => {
      const check = await checkTransaction(merchantOrderId)
      if (check.status === 'paid') await fulfillPayment(merchantOrderId, check)
      else if (check.status === 'failed' || resultCode === '02') await markPaymentFailed(merchantOrderId)
    })
    return new NextResponse('OK')
  } catch (error) {
    console.error('[duitku] callback failed', merchantOrderId, error)
    // A non-200 response makes Duitku retry the callback later.
    return new NextResponse('Error', { status: 500 })
  }
}
