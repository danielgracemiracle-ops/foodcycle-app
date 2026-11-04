import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'

const BASE =
  process.env.DUITKU_ENV === 'production' ? 'https://passport.duitku.com/webapi/api/merchant' : 'https://sandbox.duitku.com/webapi/api/merchant'

export class DuitkuError extends Error {}

function credentials() {
  const merchantCode = process.env.DUITKU_MERCHANT_CODE
  const apiKey = process.env.DUITKU_API_KEY
  if (!merchantCode || !apiKey) throw new DuitkuError('Payment gateway is not configured.')
  return { merchantCode, apiKey }
}

const sign = (value: string, apiKey: string) => createHmac('sha256', apiKey).update(value).digest('hex')

/** `yyyy-MM-dd HH:mm:ss` in Jakarta time, as Duitku expects. */
function jakartaDatetime() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date())
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00'
  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
    signal: AbortSignal.timeout(20_000),
  })
  const text = await res.text()
  if (!res.ok) {
    console.error(`[duitku] ${path} -> ${res.status}`, text.slice(0, 500))
    throw new DuitkuError('The payment gateway rejected the request. Please try again.')
  }
  return JSON.parse(text) as T
}

export interface PaymentChannel {
  code: string
  name: string
  image: string
  fee: number
}

export async function getPaymentChannels(amount: number): Promise<PaymentChannel[]> {
  const { merchantCode, apiKey } = credentials()
  const datetime = jakartaDatetime()
  const res = await post<{ paymentFee?: { paymentMethod: string; paymentName: string; paymentImage: string; totalFee: string }[]; responseCode: string }>(
    '/paymentmethod/getpaymentmethod',
    { merchantcode: merchantCode, amount, datetime, signature: sign(`${merchantCode}${amount}${datetime}`, apiKey) },
  )
  return (res.paymentFee ?? []).map((p) => ({ code: p.paymentMethod, name: p.paymentName, image: p.paymentImage, fee: Number(p.totalFee) || 0 }))
}

export interface InquiryInput {
  merchantOrderId: string
  amount: number
  paymentCode: string
  productDetails: string
  email: string
  customerName: string
  items: { name: string; price: number; quantity: number }[]
  callbackUrl: string
  returnUrl: string
  expiryMinutes: number
}

export async function createInquiry(input: InquiryInput) {
  const { merchantCode, apiKey } = credentials()
  const res = await post<{ reference?: string; paymentUrl?: string; statusCode: string; statusMessage: string }>('/v2/inquiry', {
    merchantCode,
    paymentAmount: input.amount,
    paymentMethod: input.paymentCode,
    merchantOrderId: input.merchantOrderId,
    productDetails: input.productDetails.slice(0, 255),
    email: input.email,
    customerVaName: input.customerName.slice(0, 20),
    itemDetails: input.items,
    callbackUrl: input.callbackUrl,
    returnUrl: input.returnUrl,
    expiryPeriod: input.expiryMinutes,
    signature: sign(`${merchantCode}${input.merchantOrderId}${input.amount}`, apiKey),
  })
  if (res.statusCode !== '00' || !res.paymentUrl) {
    console.error('[duitku] inquiry failed', res.statusCode, res.statusMessage)
    throw new DuitkuError('Could not start the payment. Please choose another method or try again.')
  }
  return { reference: res.reference ?? null, paymentUrl: res.paymentUrl }
}

export type DuitkuStatus = 'paid' | 'pending' | 'failed'

export async function checkTransaction(merchantOrderId: string): Promise<{ status: DuitkuStatus; amount: number; reference: string | null }> {
  const { merchantCode, apiKey } = credentials()
  const res = await post<{ statusCode: string; amount: string; reference?: string }>('/transactionStatus', {
    merchantCode,
    merchantOrderId,
    signature: sign(`${merchantCode}${merchantOrderId}`, apiKey),
  })
  const status: DuitkuStatus = res.statusCode === '00' ? 'paid' : res.statusCode === '01' ? 'pending' : 'failed'
  return { status, amount: Math.round(Number(res.amount)), reference: res.reference ?? null }
}

/** Callback signature: HMAC_SHA256(merchantCode + amount + merchantOrderId, apiKey). */
export function verifyCallbackSignature(params: { merchantCode: string; amount: string; merchantOrderId: string; signature: string }) {
  const { merchantCode, apiKey } = credentials()
  if (params.merchantCode !== merchantCode) return false
  const expected = Buffer.from(sign(`${params.merchantCode}${params.amount}${params.merchantOrderId}`, apiKey))
  const given = Buffer.from(params.signature.toLowerCase())
  return expected.length === given.length && timingSafeEqual(expected, given)
}
