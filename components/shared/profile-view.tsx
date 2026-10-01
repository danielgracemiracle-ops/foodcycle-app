'use client'

import { HandHeart, Leaf, ShoppingBag } from 'lucide-react'
import { useState } from 'react'
import type { User } from '@/types'
import { useAction, useCurrentUser, useDb, useHydrated } from '@/hooks/use-db'
import { formatDate } from '@/lib/format'
import { userImpact } from '@/lib/selectors'
import { updateProfile } from '@/services/profile-service'
import { EntityAvatar } from '@/components/shared/entity-avatar'
import { FormField } from '@/components/shared/form-field'
import { PageHeader, Panel, StatCard } from '@/components/shared/page'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const PHONE_RE = /^\+?[0-9\s-]{8,16}$/

function ProfileForm({ user }: { user: User }) {
  const [name, setName] = useState(user.name)
  const [phone, setPhone] = useState(user.phone ?? '')
  const [location, setLocation] = useState(user.location ?? '')
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({})
  const [save, saving] = useAction(updateProfile, { success: 'Profile updated' })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    if (name.trim().length < 2) next.name = 'Name must be at least 2 characters.'
    if (phone && !PHONE_RE.test(phone)) next.phone = 'Enter a valid phone number.'
    setErrors(next)
    if (Object.keys(next).length) return
    save({ name: name.trim(), phone, location, avatarUrl: user.avatarUrl })
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Full name" error={errors.name}>
          {(field) => <Input {...field} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />}
        </FormField>
        <FormField label="Email" hint="Contact support to change your email.">
          {(field) => <Input {...field} value={user.email} disabled />}
        </FormField>
        <FormField label="Phone" error={errors.phone}>
          {(field) => <Input {...field} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+62 812 3456 7890" autoComplete="tel" inputMode="tel" />}
        </FormField>
        <FormField label="Location">
          {(field) => <Input {...field} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Jakarta Selatan" autoComplete="address-level2" />}
        </FormField>
      </div>
      <Button type="submit" disabled={saving} className="self-start">
        {saving ? 'Saving…' : 'Save changes'}
      </Button>
    </form>
  )
}

export function ProfileView() {
  const db = useDb()
  const user = useCurrentUser()
  const hydrated = useHydrated()
  if (!hydrated || !user) return <div className="h-80 animate-pulse rounded-3xl bg-muted" />

  const impact = userImpact(db, user.id)
  const orders = db.orders.filter((o) => o.customerId === user.id).length

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Profile" description="Manage your personal information." />

      <section className="flex items-center gap-4 rounded-2xl border bg-card p-5">
        <EntityAvatar name={user.name} src={user.avatarUrl} size="xl" />
        <div className="flex min-w-0 flex-col gap-1">
          <p className="truncate font-heading text-xl font-bold">{user.name}</p>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          <p className="text-xs capitalize text-muted-foreground">
            {user.role} · Member since {formatDate(user.createdAt)}
          </p>
        </div>
      </section>

      {user.role === 'customer' && (
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label="Orders" value={orders} icon={ShoppingBag} />
          <StatCard label="Meals rescued" value={impact.meals} icon={Leaf} />
          <StatCard label="Donations" value={impact.donations} icon={HandHeart} />
        </div>
      )}

      <Panel title="Personal information">
        <ProfileForm key={user.id} user={user} />
      </Panel>
    </div>
  )
}
