'use client'

import { LogOut, Moon, Sun } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useState } from 'react'
import { FOOD_CATEGORIES, type FoodCategory, type UserPreferences } from '@/types'
import { useAction, useCurrentUser, useDb, useHydrated } from '@/hooks/use-db'
import { cn } from '@/lib/utils'
import { changePassword, logoutAllDevices } from '@/services/auth-service'
import { updatePreferences } from '@/services/profile-service'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { FormField } from '@/components/shared/form-field'
import { PageHeader, Panel } from '@/components/shared/page'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'

const NOTIFICATION_LABELS: Record<string, string> = {
  orders: 'Order updates',
  donations: 'Donation updates',
  promotions: 'Promotions',
  newFood: 'New food near me',
  reviews: 'Review reminders',
  email: 'Email notifications',
  newOrders: 'New orders',
  lowStock: 'Low stock alerts',
  payouts: 'Payouts',
  newDonations: 'New donations',
  deliveryUpdates: 'Delivery updates',
  weeklySummary: 'Weekly summary',
  registrations: 'New registrations',
  complaints: 'Complaints',
  reports: 'Reports',
}

const PRIVACY_LABELS: Record<keyof UserPreferences['privacy'], { label: string; hint: string }> = {
  showProfile: { label: 'Public profile', hint: 'Show your name on reviews.' },
  shareImpact: { label: 'Share impact', hint: 'Include your rescues in community stats.' },
  twoFactor: { label: 'Two-factor authentication', hint: 'Require a code when signing in.' },
}

function ToggleRow({ id, label, hint, checked, onChange }: { id: string; label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <label htmlFor={id} className="flex flex-col">
        <span className="text-sm font-medium">{label}</span>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

function PasswordForm() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string>()
  const [run, pending] = useAction(changePassword, {
    success: 'Password changed',
    onSuccess: () => {
      setCurrent('')
      setNext('')
      setConfirm('')
    },
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (next.length < 8) return setError('New password must be at least 8 characters.')
    if (next !== confirm) return setError('Passwords do not match.')
    setError(undefined)
    run(current, next)
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <div className="grid gap-4 md:grid-cols-3">
        <FormField label="Current password">
          {(field) => <Input {...field} type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />}
        </FormField>
        <FormField label="New password">
          {(field) => <Input {...field} type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />}
        </FormField>
        <FormField label="Confirm new password" error={error}>
          {(field) => <Input {...field} type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />}
        </FormField>
      </div>
      <Button type="submit" variant="outline" disabled={pending || !current} className="self-start">
        {pending ? 'Updating…' : 'Update password'}
      </Button>
    </form>
  )
}

export function SettingsView() {
  const db = useDb()
  const user = useCurrentUser()
  const hydrated = useHydrated()
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const [save] = useAction(updatePreferences, { success: 'Preferences saved' })
  const [signOutAll] = useAction(logoutAllDevices, { success: 'Signed out of all devices', onSuccess: () => router.replace('/login') })

  if (!hydrated || !user) return <div className="h-96 animate-pulse rounded-3xl bg-muted" />
  const prefs = db.preferences.find((p) => p.userId === user.id)
  const notifications = prefs?.notifications ?? {}
  const privacy = prefs?.privacy ?? { showProfile: true, shareImpact: true, twoFactor: false }

  const toggleCategory = (c: FoodCategory) => {
    const current = prefs?.favoriteCategories ?? []
    save({ favoriteCategories: current.includes(c) ? current.filter((x) => x !== c) : [...current, c] })
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Settings" description="Preferences, notifications, privacy and security." />

      <Panel title="Appearance">
        <div className="flex gap-2">
          {(['light', 'dark'] as const).map((t) => {
            const Icon = t === 'light' ? Sun : Moon
            return (
              <Button key={t} variant={resolvedTheme === t ? 'default' : 'outline'} onClick={() => setTheme(t)} aria-pressed={resolvedTheme === t}>
                <Icon data-icon="inline-start" />
                <span className="capitalize">{t}</span>
              </Button>
            )
          })}
        </div>
      </Panel>

      {user.role === 'customer' && (
        <Panel title="Food preferences" description="Used to personalise your recommendations.">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Favorite categories">
            {FOOD_CATEGORIES.map((c) => {
              const on = prefs?.favoriteCategories.includes(c) ?? false
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleCategory(c)}
                  className={cn('rounded-full border px-4 py-1.5 text-sm font-medium transition-colors', on ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:bg-muted')}
                >
                  {c}
                </button>
              )
            })}
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Preferred pickup time">
            {(['afternoon', 'evening', 'night', 'any'] as const).map((t) => (
              <Button
                key={t}
                size="sm"
                variant={prefs?.preferredPickupTime === t ? 'secondary' : 'ghost'}
                aria-pressed={prefs?.preferredPickupTime === t}
                onClick={() => save({ preferredPickupTime: t })}
                className="capitalize"
              >
                {t === 'any' ? 'Any time' : t}
              </Button>
            ))}
          </div>
        </Panel>
      )}

      <Panel title="Notifications">
        <div className="flex flex-col divide-y">
          {Object.entries(notifications).map(([key, value]) => (
            <ToggleRow
              key={key}
              id={`notif-${key}`}
              label={NOTIFICATION_LABELS[key] ?? key}
              checked={value}
              onChange={(v) => save({ notifications: { ...notifications, [key]: v } })}
            />
          ))}
        </div>
      </Panel>

      <Panel title="Privacy & security">
        <div className="flex flex-col divide-y">
          {(Object.keys(PRIVACY_LABELS) as (keyof typeof privacy)[]).map((key) => (
            <ToggleRow
              key={key}
              id={`privacy-${key}`}
              label={PRIVACY_LABELS[key].label}
              hint={PRIVACY_LABELS[key].hint}
              checked={privacy[key]}
              onChange={(v) => save({ privacy: { ...privacy, [key]: v } })}
            />
          ))}
        </div>
        <PasswordForm />
      </Panel>

      <Panel title="Sessions">
        <ConfirmDialog
          trigger={
            <Button variant="outline" className="self-start">
              <LogOut data-icon="inline-start" />
              Sign out of all devices
            </Button>
          }
          title="Sign out everywhere?"
          description="You will need to sign in again on every device, including this one."
          confirmLabel="Sign out"
          destructive
          onConfirm={() => signOutAll()}
        />
      </Panel>
    </div>
  )
}
