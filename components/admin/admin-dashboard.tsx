'use client'

import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'
import { Building2, HandHeart, Leaf, MessageSquareWarning, Receipt, Store, Users, Wallet } from 'lucide-react'
import { useDb, useHydrated } from '@/hooks/use-db'
import { formatRupiah } from '@/lib/format'
import { revenueByDay } from '@/lib/restaurant'
import { ButtonLink } from '@/components/shared/button-link'
import { PageHeader, Panel, StatCard } from '@/components/shared/page'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'

const chartConfig = { revenue: { label: 'GMV', color: 'var(--chart-1)' } } satisfies ChartConfig
const PAID = new Set(['Payment Confirmed', 'Restaurant Confirmed', 'Preparing', 'Ready for Pickup', 'Picked Up', 'Completed'])

export function usePlatformStats() {
  const db = useDb()
  const paid = db.orders.filter((o) => PAID.has(o.status))
  const gmv = paid.reduce((s, o) => s + o.total, 0)
  const wasteKg = paid.reduce((s, o) => s + o.items.reduce((n, i) => n + i.quantity * i.weightKg, 0), 0)
  const meals = paid.reduce((s, o) => s + o.items.reduce((n, i) => n + i.quantity, 0), 0)
  return { db, paid, gmv, wasteKg, meals, fee: (gmv * db.systemSettings.platformFeePercent) / 100 }
}

export function AdminDashboardView() {
  const hydrated = useHydrated()
  const { db, paid, gmv, wasteKg, meals } = usePlatformStats()
  if (!hydrated) return <div className="h-96 animate-pulse rounded-3xl bg-muted" />

  const pendingRestaurants = db.restaurants.filter((r) => r.verification === 'pending')
  const pendingInstitutions = db.institutions.filter((i) => i.verification === 'pending')
  const openComplaints = db.complaints.filter((c) => c.status !== 'Resolved')
  const series = revenueByDay(paid, 14)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Platform overview" description="Health of the marketplace at a glance." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Users" value={db.users.length} icon={Users} />
        <StatCard label="Restaurants" value={db.restaurants.length} icon={Store} />
        <StatCard label="Institutions" value={db.institutions.length} icon={Building2} />
        <StatCard label="Orders" value={db.orders.length} icon={Receipt} />
        <StatCard label="GMV" value={formatRupiah(gmv)} icon={Wallet} />
        <StatCard label="Meals rescued" value={meals} icon={HandHeart} />
        <StatCard label="Food saved" value={`${wasteKg.toFixed(1)} kg`} icon={Leaf} />
        <StatCard label="Open complaints" value={openComplaints.length} icon={MessageSquareWarning} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Panel title="GMV, last 14 days">
          <ChartContainer config={chartConfig} className="h-64 w-full">
            <BarChart data={series}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip content={<ChartTooltipContent formatter={(v) => formatRupiah(Number(v))} />} />
              <Bar dataKey="revenue" fill="var(--color-revenue)" radius={6} />
            </BarChart>
          </ChartContainer>
        </Panel>

        <Panel title="Needs attention">
          <ul className="flex flex-col divide-y">
            {[
              { label: 'Restaurants awaiting verification', count: pendingRestaurants.length, href: '/admin/restaurants' },
              { label: 'Institutions awaiting verification', count: pendingInstitutions.length, href: '/admin/institutions' },
              { label: 'Open complaints', count: openComplaints.length, href: '/admin/complaints' },
            ].map((row) => (
              <li key={row.href} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-heading text-2xl font-bold tabular-nums">{row.count}</p>
                  <p className="text-sm text-muted-foreground">{row.label}</p>
                </div>
                <ButtonLink href={row.href} variant="outline" size="sm">Review</ButtonLink>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  )
}
