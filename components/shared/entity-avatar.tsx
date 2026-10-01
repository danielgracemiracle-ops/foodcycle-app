import { initials } from '@/lib/format'
import { cn } from '@/lib/utils'

const COLOR: Record<string, string> = {
  'chart-1': 'bg-chart-1 text-primary-foreground',
  'chart-2': 'bg-chart-2 text-foreground',
  'chart-3': 'bg-chart-3 text-foreground',
  'chart-4': 'bg-chart-4 text-primary-foreground',
  'chart-5': 'bg-chart-5 text-foreground',
}

export function EntityAvatar({
  name,
  color = 'chart-1',
  src,
  size = 'md',
  className,
}: {
  name: string
  color?: string
  src?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}) {
  const sizes = { sm: 'size-8 text-xs', md: 'size-10 text-sm', lg: 'size-14 text-lg', xl: 'size-20 text-2xl' }
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl font-heading font-bold',
        sizes[size],
        COLOR[color] ?? COLOR['chart-1'],
        className,
      )}
      aria-hidden="true"
    >
      {src ? <img src={src} alt="" className="size-full object-cover" /> : initials(name)}
    </span>
  )
}
