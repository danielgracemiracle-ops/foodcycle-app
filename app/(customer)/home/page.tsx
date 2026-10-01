import type { Metadata } from 'next'
import { HomeView } from '@/components/customer/home-view'

export const metadata: Metadata = { title: 'Home' }

export default function HomePage() {
  return <HomeView />
}
