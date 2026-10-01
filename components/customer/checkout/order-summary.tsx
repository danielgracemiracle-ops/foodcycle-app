import Image from 'next/image'
import { calculateGrade } from '@/lib/quality'
import { formatRupiah, pickupLabel } from '@/lib/format'
import type { cartLines, cartTotals } from '@/lib/selectors'
import { GradeBadge } from '@/components/shared/grade-badge'

type Lines = ReturnType<typeof cartLines>
type Totals = ReturnType<typeof cartTotals>

export function SummaryTotals({ totals }: { totals: Totals }) {
  return (
    <dl className="flex flex-col gap-2 text-sm">
      <div className="flex justify-between">
        <dt className="text-muted-foreground">Subtotal ({totals.count} item{totals.count === 1 ? '' : 's'})</dt>
        <dd className="tabular-nums">{formatRupiah(totals.subtotal)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-muted-foreground">FoodCycle discount</dt>
        <dd className="font-medium text-primary tabular-nums">-{formatRupiah(totals.discount)}</dd>
      </div>
      <div className="mt-1 flex justify-between border-t pt-3">
        <dt className="font-semibold">Total</dt>
        <dd className="font-heading text-xl font-bold tabular-nums">{formatRupiah(totals.total)}</dd>
      </div>
    </dl>
  )
}

export function SummaryLines({ lines }: { lines: Lines }) {
  return (
    <ul className="flex flex-col gap-3">
      {lines.map(({ item, food, restaurant }) => (
        <li key={food.id} className="flex items-center gap-3">
          <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-muted">
            <Image src={food.image || '/placeholder.svg'} alt="" fill sizes="56px" className="object-cover" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold">{food.name}</p>
              <GradeBadge grade={calculateGrade(food)} />
            </div>
            <p className="truncate text-xs text-muted-foreground">{restaurant.name} · {pickupLabel(food.pickupStart, food.pickupEnd)}</p>
          </div>
          <p className="shrink-0 text-sm tabular-nums">
            <span className="text-muted-foreground">{item.quantity}x </span>
            {formatRupiah(food.price * item.quantity)}
          </p>
        </li>
      ))}
    </ul>
  )
}
