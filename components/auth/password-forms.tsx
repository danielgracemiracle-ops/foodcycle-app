'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, Loader2, MailCheck } from 'lucide-react'
import { toast } from 'sonner'
import { requestPasswordReset, resetPassword } from '@/services/auth-service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ButtonLink } from '@/components/shared/button-link'
import { FormField } from '@/components/shared/form-field'

function BackToLogin() {
  return (
    <Link href="/login" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
      <ArrowLeft className="size-4" aria-hidden="true" /> Back to log in
    </Link>
  )
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPending(true)
    setError('')
    try {
      const res = await requestPasswordReset(email)
      setSentTo(res.email)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setPending(false)
    }
  }

  if (sentTo) {
    return (
      <div className="flex flex-col gap-6">
        <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-accent text-primary">
          <MailCheck className="size-6" aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-3xl font-bold tracking-tight">Check your inbox</h1>
          <p className="leading-relaxed text-muted-foreground">
            If an account exists for <strong className="text-foreground">{sentTo}</strong>, we&apos;ve sent a link to reset your password.
          </p>
        </div>
        <div className="rounded-2xl border border-dashed border-border bg-secondary/50 p-4 text-sm text-muted-foreground">
          Demo mode: no email is actually sent. Use the button below to open the reset link.
        </div>
        <ButtonLink href={`/reset-password?email=${encodeURIComponent(sentTo)}`} className="h-11 rounded-full">
          Open reset link
        </ButtonLink>
        <BackToLogin />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <BackToLogin />
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-bold tracking-tight">Forgot your password?</h1>
        <p className="text-muted-foreground">Enter your email and we&apos;ll send you a reset link.</p>
      </div>
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <FormField label="Email" error={error}>
          {(p) => <Input {...p} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" />}
        </FormField>
        <Button type="submit" disabled={pending} className="h-11 rounded-full text-base">
          {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
          Send reset link
        </Button>
      </form>
    </div>
  )
}

export function ResetPasswordForm() {
  const router = useRouter()
  const email = useSearchParams().get('email') ?? ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pending, setPending] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (password.length < 8) next.password = 'Use at least 8 characters.'
    if (confirm !== password) next.confirm = 'Passwords do not match.'
    setErrors(next)
    if (Object.keys(next).length) return
    setPending(true)
    try {
      await resetPassword(email, password)
      toast.success('Password updated. Please log in with your new password.')
      router.replace('/login')
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : 'Reset failed.' })
      setPending(false)
    }
  }

  if (!email) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="font-heading text-3xl font-bold tracking-tight">Invalid reset link</h1>
        <p className="text-muted-foreground">This link is missing information. Please request a new one.</p>
        <ButtonLink href="/forgot-password" className="h-11 rounded-full">Request new link</ButtonLink>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <BackToLogin />
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-bold tracking-tight">Set a new password</h1>
        <p className="text-muted-foreground">For {email}</p>
      </div>
      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <FormField label="New password" error={errors.password} hint="At least 8 characters">
          {(p) => <Input {...p} type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11" />}
        </FormField>
        <FormField label="Confirm new password" error={errors.confirm}>
          {(p) => <Input {...p} type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="h-11" />}
        </FormField>
        {errors.form && (
          <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">{errors.form}</p>
        )}
        <Button type="submit" disabled={pending} className="h-11 rounded-full text-base">
          {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
          Update password
        </Button>
      </form>
    </div>
  )
}
