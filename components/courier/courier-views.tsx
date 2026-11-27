'use client'

import { useState } from 'react'
import { Bike, CheckCircle2, History, Inbox, Truck } from 'lucide-react'
import { useCurrentUser, useDb, useHydrated } from '@/hooks/use-db'
import { courierDeliveries, isOpenDeliveryJob } from '@/lib/delivery'
import { EmptyState, PageHeader, StatCard } from '@/components/shared/page'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DeliveryCard } from './delivery-card'

const Loading = () => <div className="h-96 animate-pulse rounded-3xl bg-muted" />

function useCourierData() {
  const db = useDb()
  const user = useCurrentUser()
  const hydrated = useHydrated()
  if (!hydrated || !user) return null
  const open = db.orders.filter(isOpenDeliveryJob).sort((a, b) => a.pickupEnd.localeCompare(b.pickupEnd))
  return { db, user, open, ...courierDeliveries(db, user.id) }
}

export function CourierDashboardView() {
  const data = useCourierData()
  const [tab, setTab] = useState<'open' | 'mine'>('open')
  if (!data) return <Loading />
  const { db, user, open, active, done } = data
  const list = tab === 'open' ? open : active

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Hi, ${user.name.split(' ')[0]}`}
        description="Pick up packed donations from restaurants and bring them to social institutions."
      />

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Available" value={open.length} icon={Inbox} />
        <StatCard label="In progress" value={active.length} icon={Truck} />
        <StatCard label="Delivered" value={done.length} icon={CheckCircle2} />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as 'open' | 'mine')}>
        <TabsList>
          <TabsTrigger value="open">Available ({open.length})</TabsTrigger>
          <TabsTrigger value="mine">My deliveries ({active.length})</TabsTrigger>
        </TabsList>
      </Tabs>

      {list.length === 0 ? (
        <EmptyState
          icon={Bike}
          title={tab === 'open' ? 'No deliveries waiting' : 'Nothing in progress'}
          description={
            tab === 'open'
              ? 'New jobs appear here as soon as a restaurant packs a donation.'
              : 'Accept an available delivery to get started.'
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((o) => (
            <DeliveryCard key={o.id} order={o} db={db} mode={tab} />
          ))}
        </div>
      )}
    </div>
  )
}

export function CourierHistoryView() {
  const data = useCourierData()
  if (!data) return <Loading />
  const { db, done } = data

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Delivery history" description="Donations you have handed over to institutions." />
      {done.length === 0 ? (
        <EmptyState icon={History} title="No deliveries yet" description="Finished deliveries will be listed here." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {done.map((o) => (
            <DeliveryCard key={o.id} order={o} db={db} mode="mine" />
          ))}
        </div>
      )}
    </div>
  )
}
