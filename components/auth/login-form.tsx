'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { DEMO_ACCOUNTS } from '@/data/seed'
import { login, ROLE_HOME } from '@/services/auth-service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/shared/form-field'

function safeNext(next: string | null) {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : null
}

export function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Please enter your email and password.')
      return
    }
    setPending(true)
    setError('')
    try {
      const user = await login(email, password)
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`)
      const next = safeNext(params.get('next'))
      router.replace(next ?? ROLE_HOME[user.role])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.')
      setPending(false)
    }
  }

  const fillDemo = (acc: (typeof DEMO_ACCOUNTS)[number]) => {
    setEmail(acc.email)
    setPassword(acc.password)
    setError('')
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-muted-foreground">Log in to rescue food and track your impact.</p>
      </div>

      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <FormField label="Email">
          {(p) => (
            <Input {...p} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="h-11" />
          )}
        </FormField>
        <FormField label="Password">
          {(p) => (
            <div className="relative">
              <Input
                {...p}
                type={show ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 pr-11"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground hover:text-foreground"
              >
                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          )}
        </FormField>
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
        {error && (
          <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" disabled={pending} className="h-11 rounded-full text-base">
          {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
          {pending ? 'Logging in…' : 'Log in'}
        </Button>
      </form>

      <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-border bg-secondary/50 p-4">
        <p className="text-sm font-semibold">Demo accounts</p>
        <p className="text-xs text-muted-foreground">
          Password for all: <code className="font-mono">password123</code>
        </p>
        <div className="grid grid-cols-2 gap-2">
          {DEMO_ACCOUNTS.map((acc) => (
            <Button key={acc.email} type="button" variant="outline" onClick={() => fillDemo(acc)} className="h-auto justify-start rounded-xl py-2 text-left">
              <span className="flex flex-col">
                <span className="text-sm font-semibold">{acc.label}</span>
                <span className="truncate text-[11px] font-normal text-muted-foreground">{acc.email}</span>
              </span>
            </Button>
          ))}
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        New to FoodCycle?{' '}
        <Link href="/register" className="font-semibold text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  )
}
