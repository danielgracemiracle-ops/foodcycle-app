import type * as S from '@/server/services/order-service'
import { invoke } from './bridge'

export { DONATION_FLOW, MAX_QTY_PER_ITEM, ORDER_FLOW } from '@/lib/order-flow'

export const addToCart = invoke<typeof S.addToCart>('order', 'addToCart')
export const updateCartQuantity = invoke<typeof S.updateCartQuantity>('order', 'updateCartQuantity')
export const setCartDonate = invoke<typeof S.setCartDonate>('order', 'setCartDonate')
export const removeFromCart = invoke<typeof S.removeFromCart>('order', 'removeFromCart')
export const saveCheckoutDraft = invoke<typeof S.saveCheckoutDraft>('order', 'saveCheckoutDraft')
export const processPayment = invoke<typeof S.processPayment>('order', 'processPayment')
export const advanceOrder = invoke<typeof S.advanceOrder>('order', 'advanceOrder')
export const rejectOrder = invoke<typeof S.rejectOrder>('order', 'rejectOrder')
export const cancelOrder = invoke<typeof S.cancelOrder>('order', 'cancelOrder')
export const confirmPickup = invoke<typeof S.confirmPickup>('order', 'confirmPickup')
export const simulateOrderProgress = invoke<typeof S.simulateOrderProgress>('order', 'simulateOrderProgress')
export const acceptDonation = invoke<typeof S.acceptDonation>('order', 'acceptDonation')
export const rejectDonation = invoke<typeof S.rejectDonation>('order', 'rejectDonation')
export const confirmDonationReceived = invoke<typeof S.confirmDonationReceived>('order', 'confirmDonationReceived')
