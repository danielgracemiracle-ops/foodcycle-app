import Image from 'next/image'
import { ArrowRight, Clock, HandHeart, Leaf } from 'lucide-react'
import { ButtonLink } from '@/components/shared/button-link'

const PREVIEW = [
  { name: 'Chicken Rice Bowl', place: 'ABC Kitchen', image: '/foods/chicken-rice-bowl.png', price: 'Rp20.000', original: 'Rp35.000', grade: 'A', pickup: '19:00 – 21:00' },
  { name: 'Croissant Box', place: 'Daily Bakery', image: '/foods/croissant-box.png', price: 'Rp25.000', original: 'Rp48.000', grade: 'B', pickup: '20:00 – 21:30' },
]

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-12 pb-16 md:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-20 lg:pb-24">
        <div className="flex flex-col items-start gap-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
            <Leaf className="size-3.5" aria-hidden="true" />
            Surplus food marketplace for Jakarta
          </span>
          <h1 className="font-heading text-4xl font-bold leading-[1.05] tracking-tight text-balance md:text-6xl">
            Save Food. Save Money. <span className="text-primary">Share Goodness.</span>
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-muted-foreground text-pretty">
            Discover quality surplus food at better prices and turn your purchase into meaningful social impact.
          </p>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/explore" className="h-12 rounded-full px-6 text-base">
              Explore Food
              <ArrowRight aria-hidden="true" />
            </ButtonLink>
            <ButtonLink href="#how-it-works" variant="outline" className="h-12 rounded-full px-6 text-base">
              How FoodCycle Works
            </ButtonLink>
          </div>
          <p className="text-sm text-muted-foreground">
            Up to 60% off evening surplus from verified restaurants, bakeries and cafés.
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-muted shadow-xl sm:aspect-[5/5]">
            <Image
              src="/hero-food.png"
              alt="A table of freshly prepared Indonesian dishes ready for pickup"
              fill
              priority
              sizes="(min-width: 1024px) 520px, 90vw"
              className="object-cover"
            />
          </div>

          <div className="absolute -bottom-6 -left-3 flex w-64 flex-col gap-2 sm:-left-8">
            {PREVIEW.map((p, i) => (
              <div
                key={p.name}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-2.5 shadow-lg"
                style={{ transform: `translateX(${i * 20}px)` }}
              >
                <div className="relative size-14 shrink-0 overflow-hidden rounded-xl">
                  <Image src={p.image} alt="" fill sizes="56px" className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{p.name}</p>
                  <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="size-3" aria-hidden="true" /> {p.pickup}
                  </p>
                  <p className="text-sm">
                    <span className="font-bold">{p.price}</span>{' '}
                    <span className="text-xs text-muted-foreground line-through">{p.original}</span>
                  </p>
                </div>
                <span className="self-start rounded-md bg-primary px-1.5 py-0.5 text-[11px] font-bold text-primary-foreground">
                  {p.grade}
                </span>
              </div>
            ))}
          </div>

          <div className="absolute -top-4 -right-2 flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2.5 shadow-lg sm:-right-6">
            <span className="inline-flex size-9 items-center justify-center rounded-full bg-accent text-primary">
              <HandHeart className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold leading-tight">12 meals donated</p>
              <p className="text-[11px] text-muted-foreground">to Panti Asuhan Harapan today</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
