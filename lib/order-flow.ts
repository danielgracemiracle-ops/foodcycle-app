import type { DonationStatus, OrderStatus } from '@/types'

export const MAX_QTY_PER_ITEM = 10

export const ORDER_FLOW: OrderStatus[] = ['Payment Confirmed', 'Restaurant Confirmed', 'Preparing', 'Ready for Pickup', 'Picked Up', 'Completed']

export const DONATION_FLOW: DonationStatus[] = ['Purchased', 'Accepted', 'Restaurant Confirmed', 'Preparing', 'Picked Up', 'Delivered', 'Received']
