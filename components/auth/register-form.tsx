'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Building2, Loader2, ShoppingBag, Store } from 'lucide-react'
import { toast } from 'sonner'
import type { Role } from '@/types'
import { cn } from '@/lib/utils'
import { register, ROLE_HOME } from '@/services/auth-service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { FormField } from '@/components/shared/form-field'
import { EMPTY_LEGAL, validateLegal, type LegalDraft, type LegalErrors } from '@/lib/registration'
import type { DocKind, UploadedDoc } from '@/lib/legal-docs'
import { LegalFields } from './legal-fields'

const ROLES: { value: Exclude<Role, 'admin'>; label: string; desc: string; icon: typeof Store }[] = [
  { value: 'customer', label: 'Customer', desc: 'Buy & donate food', icon: ShoppingBag },
  { value: 'restaurant', label: 'Restaurant', desc: 'Sell surplus food', icon: Store },
  { value: 'institution', label: 'Institution', desc: 'Receive donations', icon: Building2 },
]

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function RegisterForm() {
  const router = useRouter()
  const [role, setRole] = useState<Exclude<Role, 'admin'>>('customer')
  const [form, setForm] = useState({ name: '', organization: '', email: '', phone: '', location: '', password: '', confirm: '' })
  const [agree, setAgree] = useState(false)
  const [legal, setLegal] = useState<LegalDraft>(EMPTY_LEGAL)
  const [legalErrors, setLegalErrors] = useState<LegalErrors>({})
  const setDocument = (kind: DocKind, doc: UploadedDoc | undefined) => {
    setLegal((l) => ({ ...l, documents: { ...l.documents, [kind]: doc } }))
    setLegalErrors(({ [kind]: _cleared, ...rest }) => rest)
  }
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [pending, setPending] = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const needsOrg = role !== 'customer'

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Full name is required.'
    if (needsOrg && !form.organization.trim()) e.organization = `${role === 'restaurant' ? 'Restaurant' : 'Institution'} name is required.`
    if (!EMAIL_RE.test(form.email.trim())) e.email = 'Enter a valid email address.'
    if (form.password.length < 8) e.password = 'Use at least 8 characters.'
    if (form.confirm !== form.password) e.confirm = 'Passwords do not match.'
    if (!agree) e.agree = 'You must accept the terms to continue.'
    const le = needsOrg ? validateLegal(role as 'restaurant' | 'institution', legal) : {}
    setErrors(e)
    setLegalErrors(le)
    const ok = Object.keys(e).length === 0 && Object.keys(le).length === 0
    if (!ok && Object.keys(le).length > 0 && Object.keys(e).length === 0) setFormError('Please complete the highlighted document fields.')
    return ok
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (!validate()) return
    setPending(true)
    try {
      const user = await register({ role, name: form.name, email: form.email, password: form.password, phone: form.phone || undefined, location: form.location || undefined, organization: form.organization || undefined, legal: needsOrg ? legal : undefined })
      toast.success(role === 'customer' ? 'Account created. Welcome to FoodCycle!' : 'Account created. Your profile is pending admin verification.')
      router.replace(ROLE_HOME[user.role])
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Registration failed.')
      setPending(false)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-bold tracking-tight">Create your account</h1>
        <p className="text-muted-foreground">Join the movement to save good food.</p>
      </div>

      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium">I am joining as</legend>
          <div className="grid grid-cols-3 gap-2">
            {ROLES.map((r) => (
              <label
                key={r.value}
                className={cn(
                  'flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl border border-border bg-card p-3 text-center transition-colors has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50',
                  role === r.value && 'border-primary bg-accent',
                )}
              >
                <input type="radio" name="role" value={r.value} checked={role === r.value} onChange={() => setRole(r.value)} className="sr-only" />
                <r.icon className={cn('size-5', role === r.value ? 'text-primary' : 'text-muted-foreground')} aria-hidden="true" />
                <span className="text-sm font-semibold">{r.label}</span>
                <span className="text-[11px] leading-tight text-muted-foreground">{r.desc}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <FormField label="Full name" error={errors.name}>
          {(p) => <Input {...p} autoComplete="name" value={form.name} onChange={set('name')} className="h-11" />}
        </FormField>
        {needsOrg && (
          <FormField label={role === 'restaurant' ? 'Restaurant name' : 'Institution name'} error={errors.organization}>
            {(p) => <Input {...p} autoComplete="organization" value={form.organization} onChange={set('organization')} className="h-11" />}
          </FormField>
        )}
        <FormField label="Email" error={errors.email}>
          {(p) => <Input {...p} type="email" autoComplete="email" value={form.email} onChange={set('email')} className="h-11" />}
        </FormField>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Phone (optional)">
            {(p) => <Input {...p} type="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} className="h-11" />}
          </FormField>
          <FormField label="Location (optional)">
            {(p) => <Input {...p} autoComplete="address-level2" value={form.location} onChange={set('location')} placeholder="e.g. Tebet, Jakarta" className="h-11" />}
          </FormField>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Password" error={errors.password} hint="At least 8 characters">
            {(p) => <Input {...p} type="password" autoComplete="new-password" value={form.password} onChange={set('password')} className="h-11" />}
          </FormField>
          <FormField label="Confirm password" error={errors.confirm}>
            {(p) => <Input {...p} type="password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} className="h-11" />}
          </FormField>
        </div>

        {needsOrg && <LegalFields role={role as 'restaurant' | 'institution'} value={legal} onChange={setLegal} onDocument={setDocument} errors={legalErrors} />}

        <div className="flex flex-col gap-1.5">
          <div className="flex items-start gap-2.5">
            <Checkbox id="agree" checked={agree} onCheckedChange={(v) => setAgree(Boolean(v))} aria-invalid={errors.agree ? true : undefined} />
            <Label htmlFor="agree" className="text-sm leading-snug font-normal text-muted-foreground">
              I agree to the FoodCycle Terms of Service and Privacy Policy.
            </Label>
          </div>
          {errors.agree && <p className="text-xs font-medium text-destructive">{errors.agree}</p>}
        </div>

        {formError && (
          <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">{formError}</p>
        )}

        <Button type="submit" disabled={pending} className="h-11 rounded-full text-base">
          {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
          {pending ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-primary hover:underline">Log in</Link>
      </p>
    </div>
  )
}
