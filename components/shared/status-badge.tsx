import { cn } from '@/lib/utils'

type Tone = 'neutral' | 'progress' | 'success' | 'warning' | 'danger'

const TONE: Record<Tone, string> = {
  neutral: 'bg-muted text-muted-foreground',
  progress: 'bg-accent text-accent-foreground',
  success: 'bg-primary text-primary-foreground',
  warning: 'bg-warning/15 text-warning-foreground',
  danger: 'bg-destructive/10 text-destructive',
}

const STATUS_TONE: Record<string, Tone> = {
  Pending: 'neutral',
  'Payment Confirmed': 'progress',
  'Restaurant Confirmed': 'progress',
  Preparing: 'progress',
  'Ready for Pickup': 'warning',
  'Picked Up': 'progress',
  Completed: 'success',
  Cancelled: 'danger',
  Purchased: 'neutral',
  Accepted: 'progress',
  Delivered: 'warning',
  Received: 'success',
  Rejected: 'danger',
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  suspended: 'danger',
  active: 'success',
  paused: 'neutral',
  disabled: 'danger',
  Open: 'warning',
  'In Progress': 'progress',
  Resolved: 'success',
}

const LABEL: Record<string, string> = {
  pending: 'Pending review',
  approved: 'Verified',
  rejected: 'Rejected',
  suspended: 'Suspended',
  active: 'Active',
  paused: 'Paused',
  disabled: 'Disabled',
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const tone = STATUS_TONE[status] ?? 'neutral'
  return (
    <span className={cn('inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold whitespace-nowrap', TONE[tone], className)}>
      <span className={cn('size-1.5 rounded-full bg-current', tone === 'success' && 'bg-primary-foreground')} aria-hidden="true" />
      {LABEL[status] ?? status}
    </span>
  )
}
