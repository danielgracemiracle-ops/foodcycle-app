import type { VerificationStatus } from '@/types'
import { formatRupiah } from '@/lib/format'
import { courierBalance, MIN_PAYOUT } from '@/lib/courier-pay'
import { commit } from './mock-db'
import { delay, notify, notifyAdmins, requireUser, ServiceError, uid } from './utils'

/** Courier asks for their available balance; an admin transfers it manually to the registered bank account. */
export async function requestCourierPayout() {
  await delay(300)
  const user = requireUser('courier')
  commit((d) => {
    const profile = (d.couriers ?? []).find((c) => c.userId === user.id)
    if (!profile || profile.verification !== 'approved') throw new ServiceError('Your courier account must be verified first.')
    d.courierPayouts = d.courierPayouts ?? []
    if (d.courierPayouts.some((p) => p.userId === user.id && p.status === 'requested'))
      throw new ServiceError('You already have a payout waiting to be sent.')
    const { available } = courierBalance(d, user.id)
    if (available < MIN_PAYOUT) throw new ServiceError(`Minimum payout is ${formatRupiah(MIN_PAYOUT)}.`)
    d.courierPayouts.unshift({
      id: uid('po'),
      userId: user.id,
      amount: available,
      bank: { ...profile.bank },
      status: 'requested',
      createdAt: new Date().toISOString(),
    })
    notifyAdmins(d, 'system', 'Courier payout requested', `${user.name} requested ${formatRupiah(available)}.`, '/admin/couriers')
  })
}

export async function setCourierVerification(userId: string, verification: VerificationStatus) {
  await delay(300)
  requireUser('admin')
  commit((d) => {
    const c = (d.couriers ?? []).find((x) => x.userId === userId)
    if (!c) throw new ServiceError('Courier not found.')
    c.verification = verification
    notify(
      d,
      userId,
      'system',
      `Courier account ${verification}`,
      verification === 'approved' ? 'You are verified and can now take delivery jobs.' : `Your courier verification status: ${verification}.`,
      '/courier',
    )
  })
}

/** Admin records the bank transfer (or declines, which returns the amount to the courier's balance). */
export async function resolveCourierPayout(payoutId: string, paid: boolean, note: string) {
  requireUser('admin')
  const trimmed = typeof note === 'string' ? note.trim().slice(0, 200) : ''
  if (trimmed.length < 3) throw new ServiceError(paid ? 'Add the transfer reference.' : 'Tell the courier why it was declined.')
  commit((d) => {
    const p = (d.courierPayouts ?? []).find((x) => x.id === payoutId)
    if (!p) throw new ServiceError('Payout not found.')
    if (p.status !== 'requested') throw new ServiceError('This payout has already been handled.')
    p.status = paid ? 'paid' : 'rejected'
    p.resolvedAt = new Date().toISOString()
    p.note = trimmed
    notify(
      d,
      p.userId,
      'system',
      paid ? 'Payout sent' : 'Payout declined',
      paid ? `${formatRupiah(p.amount)} was sent to ${p.bank.bankName}. Reference: ${trimmed}` : `Your payout was declined: ${trimmed}. The amount is back in your balance.`,
      '/courier/earnings',
    )
  })
}
