'use client'

import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'
import { Banknote, Receipt, ShoppingBag, TrendingUp } from 'lucide-react'
import { useRestaurantData } from '@/hooks/use-restaurant'
import { formatRupiah } from '@/lib/format'
import { revenueByDay } from '@/lib/restaurant'
import { PageHeader, Panel, StatCard } from '@/components/shared/page'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const chartConfig = { revenue: { label: 'Revenue', color: 'var(--chart-1)' } } satisfies ChartConfig

export function SalesView() {
  const data = useRestaurantData()
  const [range, setRange] = useState('7')
  if (!data) return <div className="h-96 animate-pulse rounded-3xl bg-muted" />
  const { paid, revenue, meals } = data
  const days = Number(range)
  const series = revenueByDay(paid, days)
  const rangeRevenue = series.reduce((s, d) => s + d.revenue, 0)
  const rangeOrders = series.reduce((s, d) => s + d.orders, 0)

  const byFood = new Map<string, { name: string; qty: number; revenue: number }>()
  for (const o of paid) {
    for (const i of o.items) {
      const row = byFood.get(i.foodId) ?? { name: i.name, qty: 0, revenue: 0 }
      row.qty += i.quantity
      row.revenue += i.quantity * i.price
      byFood.set(i.foodId, row)
    }
  }
  const top = [...byFood.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 8)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Sales"
        description="Revenue recovered from food that would otherwise be thrown away."
        actions={
          <Tabs value={range} onValueChange={(v) => setRange(String(v))}>
            <TabsList>
              <TabsTrigger value="7">7 days</TabsTrigger>
              <TabsTrigger value="14">14 days</TabsTrigger>
              <TabsTrigger value="30">30 days</TabsTrigger>
            </TabsList>
          </Tabs>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={`Revenue (${days}d)`} value={formatRupiah(rangeRevenue)} icon={TrendingUp} />
        <StatCard label={`Orders (${days}d)`} value={rangeOrders} icon={Receipt} />
        <StatCard label="Lifetime revenue" value={formatRupiah(revenue)} icon={Banknote} />
        <StatCard label="Meals sold" value={meals} icon={ShoppingBag} />
      </div>

      <Panel title="Daily revenue">
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <BarChart data={series} margin={{ left: 4, right: 4 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} interval={days > 14 ? 3 : 0} />
            <ChartTooltip content={<ChartTooltipContent formatter={(v) => formatRupiah(Number(v))} />} />
            <Bar dataKey="revenue" fill="var(--color-revenue)" radius={6} />
          </BarChart>
        </ChartContainer>
      </Panel>

      <Panel title="Best sellers" description="All-time, by revenue">
        {top.length === 0 ? (
          <p className="text-sm text-muted-foreground">No paid orders yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Portions</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {top.map((r) => (
                <TableRow key={r.name}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.qty}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatRupiah(r.revenue)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>
    </div>
  )
}
