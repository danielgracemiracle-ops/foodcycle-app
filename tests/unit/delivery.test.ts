import { describe, expect, it } from 'vitest'
import type { Donation, Order } from '@/types'
import { courierDeliveries, deliveryStage, isOpenDeliveryJob } from '@/lib/delivery'

const order = (over: Partial<Order>): Order =>
  ({
    id: 'ORD-1',
    type: 'donation',
    status: 'Ready for Pickup',
    donationId: 'DON-1',
    createdAt: '2026-11-20T10:00:00Z',
    items: [],
    ...over,
  }) as Order

const donation = (status: Donation['status']) => ({ id: 'DON-1', status }) as Donation

describe('isOpenDeliveryJob', () => {
  it('lists packed donation orders without a courier', () => {
    expect(isOpenDeliveryJob(order({}))).toBe(true)
  })
  it('hides claimed, purchase, or unpacked orders', () => {
    expect(isOpenDeliveryJob(order({ courierId: 'u-courier' }))).toBe(false)
    expect(isOpenDeliveryJob(order({ type: 'self' }))).toBe(false)
    expect(isOpenDeliveryJob(order({ status: 'Preparing' }))).toBe(false)
  })
})

describe('deliveryStage', () => {
  it('moves from pickup to transit to delivered', () => {
    expect(deliveryStage(order({}), { donations: [donation('Picked Up')] })).toBe('pickup')
    expect(deliveryStage(order({ status: 'Picked Up' }), { donations: [donation('Picked Up')] })).toBe('transit')
    expect(deliveryStage(order({ status: 'Picked Up' }), { donations: [donation('Delivered')] })).toBe('delivered')
  })
})

describe('courierDeliveries', () => {
  it('only returns the courier own jobs, split by progress', () => {
    const db = {
      orders: [
        order({ id: 'A', courierId: 'c1' }),
        order({ id: 'B', courierId: 'c1', status: 'Picked Up' }),
        order({ id: 'C', courierId: 'c2' }),
      ],
      donations: [donation('Delivered')],
    }
    const { active, done } = courierDeliveries(db, 'c1')
    expect(active.map((o) => o.id)).toEqual(['A'])
    expect(done.map((o) => o.id)).toEqual(['B'])
  })
})
