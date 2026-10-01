'use client'

import { Cloud, HandHeart, Leaf, Soup, Wallet } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { useCurrentUser, useDb, useHydrated } from '@/hooks/use-db'
import { formatRupiah } from '@/lib/format'
import { userImpact } from '@/lib/selectors'
import { PageHeader, Panel, StatCard } from '@/components/shared/page'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { Progress } from '@/components/ui/progress'

/** Roughly 2.5 kg CO2e is avoided per kg of food not sent to landfill. */
const CO2_PER_KG = 2.5
const MILESTONES = [5, 10, 25, 50, 100, 250]

const chartConfig = { meals: { label: 'Meals rescued', color: 'var(--chart-1)' } } satisfies ChartConfig

export function ImpactView() {
  const db = useDb()
  const user = useCurrentUser()
  const hydrated = useHydrated()
  if (!hydrated || !user) return <div className="h-96 animate-pulse rounded-3xl bg-muted" />

  const impact = userImpact(db, user.id)
  const savings = db.orders
    .filter((o) => o.customerId === user.id && o.status !== 'Cancelled')
    .reduce((s, o) => s + o.discount, 0)
  const next = MILESTONES.find((m) => m > impact.meals) ?? MILESTONES.at(-1)!
  const prev = [...MILESTONES].reverse().find((m) => m <= impact.meals) ?? 0
  const progress = next === prev ? 100 : ((impact.meals - prev) / (next - prev)) * 100

  const now = new Date()
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
    const meals = impact.records
      .filter((r) => {
        const rd = new Date(r.createdAt)
        return rd.getFullYear() === d.getFullYear() && rd.getMonth() === d.getMonth()
      })
      .reduce((s, r) => s + r.meals, 0)
    return { month: d.toLocaleDateString('en-US', { month: 'short' }), meals }
  })

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Your Impact" description="Every rescued meal keeps good food out of the landfill." />

      <section className="flex flex-col gap-5 rounded-3xl bg-primary p-6 text-primary-foreground md:flex-row md:items-center md:justify-between md:p-8">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium opacity-80">Total meals rescued</p>
          <p className="font-heading text-5xl font-bold tabular-nums md:text-6xl">{impact.meals}</p>
          <p className="text-sm opacity-80">
            That&apos;s {impact.wasteKg.toFixed(1)} kg of food and about {(impact.wasteKg * CO2_PER_KG).toFixed(1)} kg CO2e avoided.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 md:max-w-xs">
          <div className="flex justify-between text-sm">
            <span className="opacity-80">Next milestone</span>
            <span className="font-semibold tabular-nums">{impact.meals}/{next} meals</span>
          </div>
          <Progress value={progress} aria-label="Progress to next milestone" className="bg-primary-foreground/20" />
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Food waste reduced" value={`${impact.wasteKg.toFixed(1)} kg`} icon={Leaf} />
        <StatCard label="CO2e avoided" value={`${(impact.wasteKg * CO2_PER_KG).toFixed(1)} kg`} icon={Cloud} />
        <StatCard label="Donations made" value={impact.donations} icon={HandHeart} hint={formatRupiah(impact.donationValue)} />
        <StatCard label="Money saved" value={formatRupiah(savings)} icon={Wallet} />
      </div>

      <Panel title="Meals rescued per month" description="Last 6 months">
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <BarChart data={months} margin={{ left: -20 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="meals" fill="var(--color-meals)" radius={6} />
          </BarChart>
        </ChartContainer>
      </Panel>

      <Panel title="Milestones">
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {MILESTONES.map((m) => {
            const reached = impact.meals >= m
            return (
              <li
                key={m}
                className={reached ? 'flex flex-col items-center gap-1 rounded-2xl bg-accent p-3 text-accent-foreground' : 'flex flex-col items-center gap-1 rounded-2xl border border-dashed p-3 text-muted-foreground'}
              >
                <Soup className="size-5" aria-hidden="true" />
                <span className="font-heading text-lg font-bold tabular-nums">{m}</span>
                <span className="text-xs">{reached ? 'Reached' : 'meals'}</span>
              </li>
            )
          })}
        </ul>
      </Panel>
    </div>
  )
}
