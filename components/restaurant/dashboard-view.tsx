'use client'

import { AlertTriangle, ClipboardList, Leaf, Plus, Star, Wallet } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'
import { useRestaurantData } from '@/hooks/use-restaurant'
import { formatRupiah, timeLeftLabel } from '@/lib/format'
import { revenueByDay } from '@/lib/restaurant'
import { ButtonLink } from '@/components/shared/button-link'
import { EmptyState, PageHeader, Panel, StatCard } from '@/components/shared/page'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { RestaurantOrderCard } from './order-card'

const chartConfig = { revenue: { label: 'Revenue', color: 'var(--chart-1)' } } satisfies ChartConfig

export function RestaurantDashboardView() {
  const data = useRestaurantData()
  if (!data) return <div className="h-96 animate-pulse rounded-3xl bg-muted" />
  const { db, restaurant, foods, paid, pending, active, revenue, meals, wasteKg } = data
  if (!restaurant) return <EmptyState icon={AlertTriangle} title="Restaurant profile not found" />

  const live = foods.filter((f) => f.status === 'active' && f.quantity > 0 && new Date(f.pickupEnd).getTime() > Date.now())
  const lowStock = live.filter((f) => f.quantity <= 3)
  const week = revenueByDay(paid)
  const queue = [...pending, ...active].slice(0, 4)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={restaurant.name}
        description="Here's how your surplus food is doing today."
        actions={<ButtonLink href="/restaurant/listings?new=1"><Plus data-icon="inline-start" />New listing</ButtonLink>}
      />

      {restaurant.verification !== 'approved' && (
        <div role="status" className="flex items-start gap-3 rounded-2xl border border-chart-3/40 bg-chart-3/15 p-4 text-sm">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>
            Your restaurant is <strong className="capitalize">{restaurant.verification}</strong>. Listings will appear in the
            marketplace once an admin approves your account.
          </p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total revenue" value={formatRupiah(revenue)} icon={Wallet} hint={`${paid.length} paid orders`} />
        <StatCard label="Orders to handle" value={pending.length + active.length} icon={ClipboardList} hint={`${pending.length} awaiting acceptance`} />
        <StatCard label="Meals rescued" value={meals} icon={Leaf} hint={`${wasteKg.toFixed(1)} kg waste avoided`} />
        <StatCard label="Rating" value={restaurant.rating.toFixed(1)} icon={Star} hint={`${restaurant.reviewCount} reviews`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Panel title="Revenue this week" className="lg:col-span-3">
          <ChartContainer config={chartConfig} className="h-56 w-full">
            <AreaChart data={week} margin={{ left: 4, right: 4 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent formatter={(v) => formatRupiah(Number(v))} />} />
              <Area dataKey="revenue" type="monotone" fill="var(--color-revenue)" fillOpacity={0.2} stroke="var(--color-revenue)" strokeWidth={2} />
            </AreaChart>
          </ChartContainer>
        </Panel>

        <Panel
          title="Live listings"
          description={`${live.length} available now`}
          className="lg:col-span-2"
          action={<Link href="/restaurant/listings" className="text-sm font-medium text-primary hover:underline">Manage</Link>}
        >
          {live.length === 0 ? (
            <p className="text-sm text-muted-foreground">No live listings. Add surplus food to start rescuing meals.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {live.slice(0, 5).map((f) => (
                <li key={f.id} className="flex items-center gap-3">
                  <Image src={f.image} alt="" width={44} height={44} className="size-11 rounded-lg object-cover" />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium">{f.name}</span>
                    <span className="text-xs text-muted-foreground">{timeLeftLabel(f.pickupEnd)}</span>
                  </div>
                  <span className={f.quantity <= 3 ? 'text-sm font-semibold text-destructive tabular-nums' : 'text-sm tabular-nums'}>
                    {f.quantity} left
                  </span>
                </li>
              ))}
            </ul>
          )}
          {lowStock.length > 0 && (
            <p className="text-xs text-muted-foreground">{lowStock.length} listing(s) running low on stock.</p>
          )}
        </Panel>
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold">Order queue</h2>
          <Link href="/restaurant/orders" className="text-sm font-medium text-primary hover:underline">View all</Link>
        </div>
        {queue.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No orders to handle" description="New orders will show up here instantly." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {queue.map((o) => (
              <RestaurantOrderCard key={o.id} order={o} db={db} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
