import type { Metadata } from 'next'
import { NotificationsView } from '@/components/shared/notifications-view'

export const metadata: Metadata = { title: 'Notifications' }

export default function Page() {
  return <NotificationsView />
}
