'use client'

import { useState } from 'react'
import { Gift, HandHeart, History, Truck, Utensils, Wallet } from 'lucide-react'
import { useInstitutionData } from '@/hooks/use-institution'
import { formatDate, formatRupiah } from '@/lib/format'
import { ButtonLink } from '@/components/shared/button-link'
import { EmptyState, PageHeader, Panel, StatCard } from '@/components/shared/page'
import { StatusBadge } from '@/components/shared/status-badge'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DailyLimitPanel } from './daily-limit-panel'
import { DonationCard } from './donation-card'

const Loading = () => <div className="h-96 animate-pulse rounded-3xl bg-muted" />

export function InstitutionDashboardView() {
  const data = useInstitutionData()
  if (!data) return <Loading />
  const { institution, incoming, active, mealsReceived, valueReceived, db } = data

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={institution?.name ?? 'Institution'}
        description="Meals donated by the community, rescued from local kitchens."
        actions={
          institution && (
            <Badge variant={institution.verification === 'approved' ? 'secondary' : 'outline'} className="capitalize">
              {institution.verification === 'approved' ? 'Verified' : institution.verification}
            </Badge>
          )
        }
      />

      {institution && institution.verification !== 'approved' && (
        <p className="rounded-2xl border border-dashed bg-muted/50 p-4 text-sm leading-relaxed text-muted-foreground">
          Your institution is awaiting verification by our team. Donors can only select verified institutions.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="New donations" value={incoming.length} icon={Gift} />
        <StatCard label="In transit" value={active.length} icon={Truck} />
        <StatCard label="Meals received" value={mealsReceived} icon={Utensils} />
        <StatCard label="Value received" value={formatRupiah(valueReceived)} icon={Wallet} />
      </div>

      {institution && <DailyLimitPanel institution={institution} db={db} />}

      <Panel
        title="New donations"
        description="Donations within your daily limit are accepted automatically."
        action={<ButtonLink href="/institution/donations" variant="outline" size="sm">View all</ButtonLink>}
      >
        {incoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">No new donations right now.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {incoming.slice(0, 4).map((d) => <DonationCard key={d.id} donation={d} db={db} />)}
          </div>
        )}
      </Panel>
    </div>
  )
}

export function InstitutionDonationsView() {
  const data = useInstitutionData()
  const [tab, setTab] = useState<'new' | 'active'>('new')
  if (!data) return <Loading />
  const { incoming, active, db } = data
  const list = tab === 'new' ? incoming : active

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Donations" description="Track incoming donations and confirm deliveries." />
      <Tabs value={tab} onValueChange={(v) => setTab(v as 'new' | 'active')}>
        <TabsList>
          <TabsTrigger value="new">New ({incoming.length})</TabsTrigger>
          <TabsTrigger value="active">In progress ({active.length})</TabsTrigger>
        </TabsList>
      </Tabs>
      {list.length === 0 ? (
        <EmptyState
          icon={HandHeart}
          title={tab === 'new' ? 'No new donations' : 'Nothing in progress'}
          description="You will be notified as soon as a donor picks your institution."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((d) => <DonationCard key={d.id} donation={d} db={db} />)}
        </div>
      )}
    </div>
  )
}

export function InstitutionHistoryView() {
  const data = useInstitutionData()
  if (!data) return <Loading />
  const { history, db } = data

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="History" description="Every donation you have received or that was cancelled." />
      {history.length === 0 ? (
        <EmptyState icon={History} title="No history yet" description="Completed donations will be listed here." />
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Restaurant</TableHead>
                <TableHead>Food</TableHead>
                <TableHead className="text-right">Meals</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="whitespace-nowrap">{formatDate(d.createdAt)}</TableCell>
                  <TableCell>{db.restaurants.find((r) => r.id === d.restaurantId)?.name ?? '-'}</TableCell>
                  <TableCell className="max-w-56 truncate">{d.foodSummary}</TableCell>
                  <TableCell className="text-right tabular-nums">{d.quantity}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatRupiah(d.value)}</TableCell>
                  <TableCell><StatusBadge status={d.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
