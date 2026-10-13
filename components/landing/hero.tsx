import Image from 'next/image'
import { ArrowRight, BadgeCheck, Clock, HandHeart, Leaf } from 'lucide-react'
import { ButtonLink } from '@/components/shared/button-link'

const PREVIEW = [
  { name: 'Chicken Rice Bowl', place: 'ABC Kitchen', image: '/foods/chicken-rice-bowl.png', price: 'Rp20.000', original: 'Rp35.000', grade: 'A', pickup: '19:00 – 21:00' },
  { name: 'Croissant Box', place: 'Daily Bakery', image: '/foods/croissant-box.png', price: 'Rp25.000', original: 'Rp48.000', grade: 'B', pickup: '20:00 – 21:30' },
]

const TRUST = ['Verified restaurants', 'Transparent Food Grade', 'Donate in one tap']

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 pt-10 pb-20 md:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-20 lg:pb-28">
        <div className="flex flex-col items-start gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
            <Leaf className="size-3.5" aria-hidden="true" />
            Surplus food marketplace for Jakarta
          </span>
          <h1 className="font-heading text-4xl font-bold leading-[1.05] tracking-tight text-balance sm:text-5xl md:text-6xl">
            Save Food. Save Money.{' '}
            <span className="relative whitespace-nowrap text-brand-orange">
              Share Goodness.
              <svg
                aria-hidden="true"
                viewBox="0 0 300 12"
                preserveAspectRatio="none"
                className="absolute -bottom-2 left-0 h-3 w-full text-brand-orange/40"
              >
                <path d="M2 9c60-6 140-8 296-3" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              </svg>
            </span>
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-muted-foreground text-pretty">
            Discover quality surplus food at better prices and turn your purchase into meaningful social impact.
          </p>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <ButtonLink href="/explore" className="h-12 rounded-full px-6 text-base shadow-lg shadow-primary/20">
              Explore Food
              <ArrowRight aria-hidden="true" />
            </ButtonLink>
            <ButtonLink href="#how-it-works" variant="outline" className="h-12 rounded-full px-6 text-base">
              How FoodCycle Works
            </ButtonLink>
          </div>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
            {TRUST.map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <BadgeCheck className="size-4 text-primary" aria-hidden="true" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mx-auto w-full max-w-md animate-in fade-in zoom-in-95 duration-700 lg:max-w-none">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-muted shadow-2xl ring-1 ring-border sm:aspect-square">
            <Image
              src="/hero-food.png"
              alt="A table of freshly prepared Indonesian dishes ready for pickup"
              fill
              priority
              sizes="(min-width: 1024px) 520px, 90vw"
              className="object-cover"
            />
            <span className="absolute top-4 left-4 rounded-full bg-brand-orange px-3 py-1 text-sm font-bold text-brand-orange-foreground shadow-md">
              Up to 60% off
            </span>
          </div>

          <div className="absolute -bottom-8 -left-2 flex w-64 flex-col gap-2 sm:-left-8">
            {PREVIEW.map((p, i) => (
              <div
                key={p.name}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card/95 p-2.5 shadow-xl backdrop-blur animate-in fade-in slide-in-from-left-6 duration-700 fill-mode-both"
                style={{ transform: `translateX(${i * 20}px)`, animationDelay: `${300 + i * 150}ms` }}
              >
                <div className="relative size-14 shrink-0 overflow-hidden rounded-xl">
                  <Image src={p.image} alt="" fill sizes="56px" className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{p.name}</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="size-3" aria-hidden="true" /> {p.pickup}
                  </p>
                  <p className="text-sm">
                    <span className="font-bold">{p.price}</span>{' '}
                    <span className="text-xs text-muted-foreground line-through">{p.original}</span>
                  </p>
                </div>
                <span className="self-start rounded-md bg-primary px-1.5 py-0.5 text-xs font-bold text-primary-foreground">
                  {p.grade}
                </span>
              </div>
            ))}
          </div>

          <div
            className="absolute -top-4 -right-2 flex items-center gap-2 rounded-2xl border border-border bg-card/95 px-3 py-2.5 shadow-xl backdrop-blur animate-in fade-in slide-in-from-top-4 duration-700 fill-mode-both sm:-right-6"
            style={{ animationDelay: '600ms' }}
          >
            <span className="inline-flex size-9 items-center justify-center rounded-full bg-brand-orange/15 text-brand-orange">
              <HandHeart className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold leading-tight">12 meals donated</p>
              <p className="text-xs text-muted-foreground">to Panti Asuhan Harapan today</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
