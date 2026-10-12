import Link from 'next/link'
import { cn } from '@/lib/utils'

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn('relative inline-flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground', className)}
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14Z" />
        <path d="M5 19c3-4 6-6.5 9-8" />
      </svg>
    </span>
  )
}

export function Logo({ href = '/', className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cn('flex items-center gap-2 rounded-lg focus-visible:outline-2', className)}>
      <LogoMark />
      <span className="font-heading text-lg font-bold tracking-tight">
        Food<span className="text-primary">Cycle</span>
      </span>
    </Link>
  )
}
