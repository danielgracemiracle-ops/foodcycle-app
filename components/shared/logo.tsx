import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn('relative inline-flex size-9 shrink-0 overflow-hidden rounded-xl bg-card ring-1 ring-border', className)}
    >
      <Image src="/brand/logo-mark.png" alt="" fill sizes="40px" className="object-contain p-0.5" />
    </span>
  )
}

export function Logo({ href = '/', className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cn('flex items-center gap-2 rounded-lg focus-visible:outline-2', className)}>
      <LogoMark />
      <span className="font-heading text-lg font-bold tracking-tight">
        <span className="text-primary">Food</span>
        <span className="text-brand-orange">Cycle</span>
      </span>
    </Link>
  )
}
