import type { Metadata } from 'next'
import { ExploreView } from '@/components/customer/explore/explore-view'

export const metadata: Metadata = { title: 'Explore' }

export default async function ExplorePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { q, category, sort, donation } = await searchParams
  return <ExploreView key={`${q}-${category}-${sort}-${donation}`} initial={{ q, category, sort, donation }} />
}
