'use client'

import { useState } from 'react'
import { Download, MessageSquareWarning } from 'lucide-react'
import type { Complaint, ComplaintStatus, SystemSettings } from '@/types'
import { useAction, useDb, useHydrated } from '@/hooks/use-db'
import { formatDateTime, formatRupiah, timeAgo } from '@/lib/format'
import { respondToComplaint, updateSystemSettings } from '@/services/admin-service'
import { usePlatformStats } from '@/components/admin/admin-dashboard'
import { EmptyState, PageHeader, Panel, StatCard } from '@/components/shared/page'
import { StatusBadge } from '@/components/shared/status-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

const Loading = () => <div className="h-96 animate-pulse rounded-3xl bg-muted" />

export function AdminReportsView() {
  const hydrated = useHydrated()
  const { db, paid, gmv, fee, meals, wasteKg } = usePlatformStats()
  if (!hydrated) return <Loading />

  const byRestaurant = db.restaurants
    .map((r) => {
      const orders = paid.filter((o) => o.restaurantId === r.id)
      return {
        id: r.id,
        name: r.name,
        orders: orders.length,
        meals: orders.reduce((s, o) => s + o.items.reduce((n, i) => n + i.quantity, 0), 0),
        revenue: orders.reduce((s, o) => s + o.total, 0),
      }
    })
    .sort((a, b) => b.revenue - a.revenue)

  function exportCsv() {
    const header = 'restaurant,orders,meals,revenue'
    const lines = byRestaurant.map((r) => `"${r.name.replace(/"/g, '""')}",${r.orders},${r.meals},${r.revenue}`)
    const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'restaurant-report.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Reports"
        description="Platform performance and environmental impact."
        actions={
          <Button variant="outline" onClick={exportCsv}>
            <Download data-icon="inline-start" />
            Export CSV
          </Button>
        }
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="GMV" value={formatRupiah(gmv)} />
        <StatCard label="Platform fees" value={formatRupiah(fee)} hint={`${db.systemSettings.platformFeePercent}% of GMV`} />
        <StatCard label="Meals rescued" value={meals} />
        <StatCard label="CO2e avoided" value={`${(wasteKg * 2.5).toFixed(1)} kg`} />
      </div>
      <Panel title="Performance by restaurant">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Restaurant</TableHead>
              <TableHead className="text-right">Orders</TableHead>
              <TableHead className="text-right">Meals</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {byRestaurant.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell className="text-right tabular-nums">{r.orders}</TableCell>
                <TableCell className="text-right tabular-nums">{r.meals}</TableCell>
                <TableCell className="text-right tabular-nums">{formatRupiah(r.revenue)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>
    </div>
  )
}

function ComplaintItem({ complaint }: { complaint: Complaint }) {
  const [reply, setReply] = useState('')
  const [respond, pending] = useAction(respondToComplaint, { success: 'Response sent', onSuccess: () => setReply('') })
  const send = (status: ComplaintStatus) => respond(complaint.id, reply, status)

  return (
    <article className="flex flex-col gap-4 rounded-2xl border bg-card p-4 md:p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{complaint.category}</Badge>
            <span className="font-mono text-xs text-muted-foreground">{complaint.id}</span>
          </div>
          <h3 className="font-heading font-semibold text-pretty">{complaint.subject}</h3>
          <p className="text-xs text-muted-foreground">{complaint.userName} &middot; {timeAgo(complaint.createdAt)}</p>
        </div>
        <StatusBadge status={complaint.status} />
      </header>
      <p className="text-sm leading-relaxed text-pretty">{complaint.description}</p>

      {complaint.responses.length > 0 && (
        <ul className="flex flex-col gap-2 border-l-2 pl-4">
          {complaint.responses.map((r, i) => (
            <li key={i} className="text-sm">
              <p className="leading-relaxed">{r.message}</p>
              <p className="text-xs text-muted-foreground">{r.author} &middot; {formatDateTime(r.at)}</p>
            </li>
          ))}
        </ul>
      )}

      {complaint.status !== 'Resolved' && (
        <div className="flex flex-col gap-2">
          <Label htmlFor={`reply-${complaint.id}`} className="sr-only">Reply</Label>
          <Textarea id={`reply-${complaint.id}`} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Write a response to the user..." rows={3} />
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" disabled={pending} onClick={() => send('In Progress')}>Reply</Button>
            <Button disabled={pending} onClick={() => send('Resolved')}>Reply &amp; resolve</Button>
          </div>
        </div>
      )}
    </article>
  )
}

export function AdminComplaintsView() {
  const db = useDb()
  const hydrated = useHydrated()
  const [tab, setTab] = useState<'open' | 'resolved'>('open')
  if (!hydrated) return <Loading />
  const sorted = [...db.complaints].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const open = sorted.filter((c) => c.status !== 'Resolved')
  const resolved = sorted.filter((c) => c.status === 'Resolved')
  const list = tab === 'open' ? open : resolved

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Complaints" description="Respond to customer, restaurant and institution reports." />
      <Tabs value={tab} onValueChange={(v) => setTab(v as 'open' | 'resolved')}>
        <TabsList>
          <TabsTrigger value="open">Open ({open.length})</TabsTrigger>
          <TabsTrigger value="resolved">Resolved ({resolved.length})</TabsTrigger>
        </TabsList>
      </Tabs>
      {list.length === 0 ? (
        <EmptyState icon={MessageSquareWarning} title="All clear" description="There are no complaints in this view." />
      ) : (
        <div className="flex flex-col gap-4">
          {list.map((c) => <ComplaintItem key={c.id} complaint={c} />)}
        </div>
      )}
    </div>
  )
}

function SettingsForm({ initial }: { initial: SystemSettings }) {
  const [form, setForm] = useState(initial)
  const [save, pending] = useAction(updateSystemSettings, { success: 'Settings saved' })
  const set = <K extends keyof SystemSettings>(k: K, v: SystemSettings[K]) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault()
        save(form)
      }}
    >
      <Panel title="Marketplace">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="fee">Platform fee (%)</Label>
            <Input id="fee" type="number" min={0} max={30} step={0.5} value={form.platformFeePercent} onChange={(e) => set('platformFeePercent', Number(e.target.value))} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="min-discount">Minimum discount (%)</Label>
            <Input id="min-discount" type="number" min={0} max={90} value={form.minDiscountPercent} onChange={(e) => set('minDiscountPercent', Number(e.target.value))} />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="support">Support email</Label>
            <Input id="support" type="email" value={form.supportEmail} onChange={(e) => set('supportEmail', e.target.value)} />
          </div>
        </div>
      </Panel>
      <Panel title="Operations">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label htmlFor="auto-approve">Auto-approve institutions</Label>
            <p className="text-sm text-muted-foreground">Skip manual review for new social institutions.</p>
          </div>
          <Switch id="auto-approve" checked={form.autoApproveInstitutions} onCheckedChange={(v) => set('autoApproveInstitutions', v)} />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label htmlFor="maintenance">Maintenance mode</Label>
            <p className="text-sm text-muted-foreground">Show a banner and pause new checkouts.</p>
          </div>
          <Switch id="maintenance" checked={form.maintenanceMode} onCheckedChange={(v) => set('maintenanceMode', v)} />
        </div>
      </Panel>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>Save settings</Button>
      </div>
    </form>
  )
}

export function AdminSettingsView() {
  const db = useDb()
  const hydrated = useHydrated()
  if (!hydrated) return <Loading />
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="System settings" description="Platform-wide configuration." />
      <SettingsForm initial={db.systemSettings} />
    </div>
  )
}
