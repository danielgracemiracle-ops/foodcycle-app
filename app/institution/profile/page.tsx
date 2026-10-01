import type { Metadata } from 'next'
import { ProfileView } from '@/components/shared/profile-view'

export const metadata: Metadata = { title: 'Institution profile' }

export default function Page() {
  return <ProfileView />
}
