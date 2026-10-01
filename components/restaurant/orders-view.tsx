'use client'

import { useState } from 'react'
import { ClipboardList } from 'lucide-react'
import { useRestaurantData } from '@/hooks/use-restaurant'
import { EmptyState, PageHeader } from '@/components/shared/page'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RestaurantOrderCard } from './order-card'

type Tab = 'new' | 'active' | 'history'

export function RestaurantOrdersView() {
  const data = useRestaurantData()
  const [tab, setTab] = useState<Tab>('new')
  if (!data) return <div className="h-96 animate-pulse rounded-3xl bg-muted" />
  const { db, orders, pending, active } = data
  const history = orders.filter((o) => ['Picked Up', 'Completed', 'Cancelled'].includes(o.status))
  const list = tab === 'new' ? pending : tab === 'active' ? active : history

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Orders" description="Accept, prepare and hand over rescued meals." />
      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList>
          <TabsTrigger value="new">New ({pending.length})</TabsTrigger>
          <TabsTrigger value="active">In progress ({active.length})</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
      </Tabs>
      {list.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={tab === 'new' ? 'No new orders' : tab === 'active' ? 'Nothing in progress' : 'No past orders yet'}
          description="Orders update in real time as customers check out."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((o) => <RestaurantOrderCard key={o.id} order={o} db={db} />)}
        </div>
      )}
    </div>
  )
}
