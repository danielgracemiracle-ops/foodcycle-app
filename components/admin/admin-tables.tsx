'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import type { VerificationStatus } from '@/types'
import { useAction, useDb, useHydrated } from '@/hooks/use-db'
import { formatDate, formatRupiah } from '@/lib/format'
import { setFoodDisabled, setInstitutionVerification, setRestaurantVerification, setUserStatus } from '@/services/admin-service'
import { calculateGrade } from '@/lib/quality'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { GradeBadge } from '@/components/shared/grade-badge'
import { EntityAvatar } from '@/components/shared/entity-avatar'
import { PageHeader } from '@/components/shared/page'
import { StatusBadge } from '@/components/shared/status-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

function useSearch<T>(rows: T[], text: (row: T) => string) {
  const [q, setQ] = useState('')
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return needle ? rows.filter((r) => text(r).toLowerCase().includes(needle)) : rows
  }, [rows, q, text])
  return { q, setQ, filtered }
}

function SearchBox({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div className="relative w-full sm:w-72">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={label} aria-label={label} className="pl-9" />
    </div>
  )
}

function Shell({ children, empty }: { children: React.ReactNode; empty: boolean }) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      {empty ? <p className="p-6 text-center text-sm text-muted-foreground">No matching records.</p> : children}
    </div>
  )
}

const Loading = () => <div className="h-96 animate-pulse rounded-3xl bg-muted" />

export function AdminUsersView() {
  const db = useDb()
  const hydrated = useHydrated()
  const { q, setQ, filtered } = useSearch(db.users, (u) => `${u.name} ${u.email} ${u.role}`)
  const [setStatus] = useAction(setUserStatus, { success: 'Account updated' })
  if (!hydrated) return <Loading />

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Users" description={`${db.users.length} accounts on the platform.`} actions={<SearchBox value={q} onChange={setQ} label="Search users" />} />
      <Shell empty={filtered.length === 0}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <EntityAvatar name={u.name} src={u.avatarUrl} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{u.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell><Badge variant="outline" className="capitalize">{u.role}</Badge></TableCell>
                <TableCell className="whitespace-nowrap">{formatDate(u.createdAt)}</TableCell>
                <TableCell><StatusBadge status={u.status} /></TableCell>
                <TableCell className="text-right">
                  {u.role === 'admin' ? null : u.status === 'active' ? (
                    <ConfirmDialog
                      trigger={<Button variant="ghost" size="sm">Suspend</Button>}
                      title={`Suspend ${u.name}?`}
                      description="They will be signed out and unable to log in until reactivated."
                      confirmLabel="Suspend"
                      destructive
                      onConfirm={() => setStatus(u.id, 'suspended')}
                    />
                  ) : (
                    <Button variant="ghost" size="sm" onClick={() => setStatus(u.id, 'active')}>Reactivate</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Shell>
    </div>
  )
}

function VerificationActions({ status, onSet }: { status: VerificationStatus; onSet: (v: VerificationStatus) => void }) {
  if (status === 'pending')
    return (
      <div className="flex justify-end gap-1">
        <Button size="sm" onClick={() => onSet('approved')}>Approve</Button>
        <Button size="sm" variant="ghost" onClick={() => onSet('rejected')}>Reject</Button>
      </div>
    )
  if (status === 'approved')
    return <Button size="sm" variant="ghost" onClick={() => onSet('suspended')}>Suspend</Button>
  return <Button size="sm" variant="outline" onClick={() => onSet('approved')}>Approve</Button>
}

const VERIFY_ORDER: Record<VerificationStatus, number> = { pending: 0, approved: 1, suspended: 2, rejected: 3 }

export function AdminRestaurantsView() {
  const db = useDb()
  const hydrated = useHydrated()
  const rows = useMemo(() => [...db.restaurants].sort((a, b) => VERIFY_ORDER[a.verification] - VERIFY_ORDER[b.verification]), [db.restaurants])
  const { q, setQ, filtered } = useSearch(rows, (r) => `${r.name} ${r.city} ${r.email}`)
  const [verify] = useAction(setRestaurantVerification, { success: 'Restaurant updated' })
  if (!hydrated) return <Loading />

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Restaurants" description="Verify partners before their listings go live." actions={<SearchBox value={q} onChange={setQ} label="Search restaurants" />} />
      <Shell empty={filtered.length === 0}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Restaurant</TableHead>
              <TableHead>City</TableHead>
              <TableHead className="text-right">Rating</TableHead>
              <TableHead className="text-right">Listings</TableHead>
              <TableHead>Verification</TableHead>
              <TableHead className="text-right"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <EntityAvatar name={r.name} color={r.logoColor} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{r.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{r.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{r.city}</TableCell>
                <TableCell className="text-right tabular-nums">{r.rating.toFixed(1)}</TableCell>
                <TableCell className="text-right tabular-nums">{db.foods.filter((f) => f.restaurantId === r.id).length}</TableCell>
                <TableCell><StatusBadge status={r.verification} /></TableCell>
                <TableCell className="text-right"><VerificationActions status={r.verification} onSet={(v) => verify(r.id, v)} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Shell>
    </div>
  )
}

export function AdminInstitutionsView() {
  const db = useDb()
  const hydrated = useHydrated()
  const rows = useMemo(() => [...db.institutions].sort((a, b) => VERIFY_ORDER[a.verification] - VERIFY_ORDER[b.verification]), [db.institutions])
  const { q, setQ, filtered } = useSearch(rows, (i) => `${i.name} ${i.city} ${i.email}`)
  const [verify] = useAction(setInstitutionVerification, { success: 'Institution updated' })
  if (!hydrated) return <Loading />

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Institutions" description="Only verified institutions can receive donations." actions={<SearchBox value={q} onChange={setQ} label="Search institutions" />} />
      <Shell empty={filtered.length === 0}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Institution</TableHead>
              <TableHead>City</TableHead>
              <TableHead className="text-right">Meals needed</TableHead>
              <TableHead className="text-right">Donations</TableHead>
              <TableHead>Verification</TableHead>
              <TableHead className="text-right"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((i) => (
              <TableRow key={i.id}>
                <TableCell>
                  <p className="font-medium">{i.name}</p>
                  <p className="text-xs text-muted-foreground">{i.email}</p>
                </TableCell>
                <TableCell>{i.city}</TableCell>
                <TableCell className="text-right tabular-nums">{i.mealsNeeded}</TableCell>
                <TableCell className="text-right tabular-nums">{db.donations.filter((d) => d.institutionId === i.id).length}</TableCell>
                <TableCell><StatusBadge status={i.verification} /></TableCell>
                <TableCell className="text-right"><VerificationActions status={i.verification} onSet={(v) => verify(i.id, v)} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Shell>
    </div>
  )
}

export function AdminFoodsView() {
  const db = useDb()
  const hydrated = useHydrated()
  const { q, setQ, filtered } = useSearch(db.foods, (f) => `${f.name} ${f.category} ${db.restaurants.find((r) => r.id === f.restaurantId)?.name ?? ''}`)
  const [toggle] = useAction(setFoodDisabled, { success: 'Listing updated' })
  if (!hydrated) return <Loading />

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Food listings" description="Moderate listings across all restaurants." actions={<SearchBox value={q} onChange={setQ} label="Search listings" />} />
      <Shell empty={filtered.length === 0}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Restaurant</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((f) => (
              <TableRow key={f.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <img src={f.image || '/placeholder.svg'} alt="" className="size-10 rounded-lg object-cover" />
                    <span className="font-medium">{f.name}</span>
                  </div>
                </TableCell>
                <TableCell>{db.restaurants.find((r) => r.id === f.restaurantId)?.name ?? '-'}</TableCell>
                <TableCell><GradeBadge grade={calculateGrade(f)} /></TableCell>
                <TableCell className="text-right tabular-nums">{formatRupiah(f.price)}</TableCell>
                <TableCell className="text-right tabular-nums">{f.quantity}</TableCell>
                <TableCell><StatusBadge status={f.status} /></TableCell>
                <TableCell className="text-right">
                  {f.status === 'disabled' ? (
                    <Button size="sm" variant="outline" onClick={() => toggle(f.id, false)}>Enable</Button>
                  ) : (
                    <ConfirmDialog
                      trigger={<Button size="sm" variant="ghost">Disable</Button>}
                      title={`Disable ${f.name}?`}
                      description="The listing will be hidden from customers and the restaurant will be notified."
                      confirmLabel="Disable"
                      destructive
                      onConfirm={() => toggle(f.id, true)}
                    />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Shell>
    </div>
  )
}

export function AdminOrdersView() {
  const db = useDb()
  const hydrated = useHydrated()
  const rows = useMemo(() => [...db.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [db.orders])
  const { q, setQ, filtered } = useSearch(rows, (o) => `${o.id} ${o.status} ${db.users.find((u) => u.id === o.customerId)?.name ?? ''}`)
  if (!hydrated) return <Loading />

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Orders" description={`${db.orders.length} orders across the platform.`} actions={<SearchBox value={q} onChange={setQ} label="Search orders" />} />
      <Shell empty={filtered.length === 0}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Restaurant</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((o) => (
              <TableRow key={o.id}>
                <TableCell>
                  <p className="font-mono text-xs">{o.id}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(o.createdAt)}</p>
                </TableCell>
                <TableCell>{db.users.find((u) => u.id === o.customerId)?.name ?? '-'}</TableCell>
                <TableCell>{db.restaurants.find((r) => r.id === o.restaurantId)?.name ?? '-'}</TableCell>
                <TableCell className="capitalize">{o.type}</TableCell>
                <TableCell className="text-right tabular-nums">{formatRupiah(o.total)}</TableCell>
                <TableCell><StatusBadge status={o.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Shell>
    </div>
  )
}

export function AdminDonationsView() {
  const db = useDb()
  const hydrated = useHydrated()
  const rows = useMemo(() => [...db.donations].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [db.donations])
  const { q, setQ, filtered } = useSearch(rows, (d) => `${d.id} ${d.foodSummary} ${d.status} ${db.institutions.find((i) => i.id === d.institutionId)?.name ?? ''}`)
  if (!hydrated) return <Loading />

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Donations" description="Track every meal from donor to institution." actions={<SearchBox value={q} onChange={setQ} label="Search donations" />} />
      <Shell empty={filtered.length === 0}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Donor</TableHead>
              <TableHead>Institution</TableHead>
              <TableHead>Food</TableHead>
              <TableHead className="text-right">Meals</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="whitespace-nowrap">{formatDate(d.createdAt)}</TableCell>
                <TableCell>{db.users.find((u) => u.id === d.donorId)?.name ?? '-'}</TableCell>
                <TableCell>{db.institutions.find((i) => i.id === d.institutionId)?.name ?? '-'}</TableCell>
                <TableCell className="max-w-56 truncate">{d.foodSummary}</TableCell>
                <TableCell className="text-right tabular-nums">{d.quantity}</TableCell>
                <TableCell><StatusBadge status={d.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Shell>
    </div>
  )
}
