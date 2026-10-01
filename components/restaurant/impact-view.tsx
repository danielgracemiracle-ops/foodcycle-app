'use client'

import { HandHeart, Leaf, Recycle, Utensils } from 'lucide-react'
import { useRestaurantData } from '@/hooks/use-restaurant'
import { formatDate } from '@/lib/format'
import { PageHeader, Panel, StatCard } from '@/components/shared/page'
import { StatusBadge } from '@/components/shared/status-badge'

const CO2_PER_KG = 2.5

export function RestaurantImpactView() {
  const data = useRestaurantData()
  if (!data) return <div className="h-96 animate-pulse rounded-3xl bg-muted" />
  const { meals, wasteKg, donations, db } = data
  const donatedMeals = donations.reduce((s, d) => s + d.quantity, 0)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Impact" description="The waste your kitchen kept out of landfill." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Meals rescued" value={meals} icon={Utensils} />
        <StatCard label="Food saved" value={`${wasteKg.toFixed(1)} kg`} icon={Recycle} />
        <StatCard label="CO2e avoided" value={`${(wasteKg * CO2_PER_KG).toFixed(1)} kg`} icon={Leaf} hint="Estimate: 2.5 kg CO2e per kg food" />
        <StatCard label="Meals donated" value={donatedMeals} icon={HandHeart} />
      </div>

      <Panel title="Donations" description="Meals customers bought from you for social institutions.">
        {donations.length === 0 ? (
          <p className="text-sm text-muted-foreground">No donations yet. Enable donations on your listings to receive them.</p>
        ) : (
          <ul className="flex flex-col divide-y">
            {donations.map((d) => {
              const inst = db.institutions.find((i) => i.id === d.institutionId)
              return (
                <li key={d.id} className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{inst?.name ?? 'Institution'}</p>
                    <p className="text-xs text-muted-foreground">{d.quantity} meals &middot; {formatDate(d.createdAt)}</p>
                  </div>
                  <StatusBadge status={d.status} />
                </li>
              )
            })}
          </ul>
        )}
      </Panel>
    </div>
  )
}
