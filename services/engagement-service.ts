import type * as S from '@/server/services/engagement-service'
import { invoke } from './bridge'

export type { ReviewInput } from '@/server/services/engagement-service'

export const submitReview = invoke<typeof S.submitReview>('engagement', 'submitReview')
export const toggleFavorite = invoke<typeof S.toggleFavorite>('engagement', 'toggleFavorite')
export const markNotificationRead = invoke<typeof S.markNotificationRead>('engagement', 'markNotificationRead')
export const markAllNotificationsRead = invoke<typeof S.markAllNotificationsRead>('engagement', 'markAllNotificationsRead')
export const deleteNotification = invoke<typeof S.deleteNotification>('engagement', 'deleteNotification')
export const submitComplaint = invoke<typeof S.submitComplaint>('engagement', 'submitComplaint')
