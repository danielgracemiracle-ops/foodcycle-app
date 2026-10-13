import Image from 'next/image'
import { ArrowRight, BarChart3, HandHeart, Leaf, Quote, Search, Star, Store, Users, Wallet } from 'lucide-react'
import { ButtonLink } from '@/components/shared/button-link'
import { Logo } from '@/components/shared/logo'
import { GRADE_INFO } from '@/lib/quality'

const STEPS = [
  { icon: Store, title: 'Restaurants List Surplus Food', body: 'Restaurants upload food that would otherwise remain unsold.' },
  { icon: Search, title: 'Customers Find Affordable Food', body: 'Customers discover quality food at discounted prices.' },
  { icon: HandHeart, title: 'Buy or Donate', body: 'Customers choose whether to enjoy the food themselves or donate it.' },
  { icon: BarChart3, title: 'Track Your Impact', body: 'FoodCycle records meals saved, donations, and food waste prevented.' },
]

function SectionHeading({ eyebrow, title, body, center }: { eyebrow: string; title: string; body?: string; center?: boolean }) {
  return (
    <div className={`flex max-w-2xl flex-col gap-3 ${center ? 'mx-auto items-center text-center' : ''}`}>
      <p className="text-sm font-semibold uppercase tracking-wider text-brand-orange">{eyebrow}</p>
      <h2 className="font-heading text-3xl font-bold tracking-tight text-balance md:text-4xl">{title}</h2>
      {body && <p className="leading-relaxed text-muted-foreground text-pretty">{body}</p>}
    </div>
  )
}

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 border-y border-border bg-secondary/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-20 md:px-6">
        <SectionHeading eyebrow="How FoodCycle works" title="From the kitchen to your table — or someone else's." />
        <ol className="relative grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <span aria-hidden="true" className="absolute top-6 right-[12%] left-[12%] hidden h-0.5 border-t-2 border-dashed border-primary/30 lg:block" />
          {STEPS.map((step, i) => (
            <li key={step.title} className="relative flex flex-col gap-4">
              <span className="relative inline-flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <step.icon className="size-5" aria-hidden="true" />
                <span className="absolute -top-2 -right-2 inline-flex size-6 items-center justify-center rounded-full bg-brand-orange text-xs font-bold text-brand-orange-foreground ring-2 ring-secondary">
                  {i + 1}
                </span>
              </span>
              <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-md">
                <h3 className="font-heading text-lg font-semibold leading-snug">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

const FEATURES = [
  { icon: Leaf, title: 'Reduce Food Waste', body: 'Give surplus food a second chance.' },
  { icon: Wallet, title: 'Affordable Food', body: 'Access quality food at lower prices.' },
  { icon: Users, title: 'Support Communities', body: 'Turn purchases into meaningful donations.' },
  { icon: BarChart3, title: 'Track Your Impact', body: 'See the positive contribution created through FoodCycle.' },
]

const GRADE_TONE = {
  A: 'bg-primary text-primary-foreground',
  B: 'bg-chart-2 text-primary-foreground',
  C: 'bg-brand-orange text-brand-orange-foreground',
} as const

export function WhyFoodCycle() {
  return (
    <section id="why" className="scroll-mt-20">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 md:px-6 lg:grid-cols-[1fr_1.3fr]">
        <div className="flex flex-col gap-6">
          <SectionHeading
            eyebrow="Why FoodCycle?"
            title="Good food deserves better than the bin."
            body="Every listing carries a transparent Food Grade and Quality Score, so you always know exactly what you're picking up."
          />
          <ul className="flex flex-col gap-2" aria-label="Food Grade explained">
            {(Object.keys(GRADE_INFO) as (keyof typeof GRADE_INFO)[]).map((g) => (
              <li key={g} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                <span className={`inline-flex size-9 shrink-0 items-center justify-center rounded-lg font-heading text-base font-bold ${GRADE_TONE[g]}`}>
                  {g}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{GRADE_INFO[g].label}</p>
                  <p className="text-sm text-muted-foreground text-pretty">{GRADE_INFO[g].description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="grid content-center gap-4 sm:grid-cols-2">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className={`flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md ${i % 2 === 1 ? 'sm:translate-y-6' : ''}`}
            >
              <span className="inline-flex size-11 items-center justify-center rounded-xl bg-accent text-primary">
                <f.icon className="size-5" aria-hidden="true" />
              </span>
              <h3 className="font-heading text-lg font-semibold">{f.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const STATS = [
  { value: '1,250+', label: 'Meals Saved' },
  { value: '350+', label: 'Donations' },
  { value: '312 kg', label: 'Food Waste Prevented' },
  { value: '87', label: 'Participating Restaurants' },
]

export function ImpactStats() {
  return (
    <section id="impact" className="scroll-mt-20 px-4 md:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 rounded-[2rem] bg-primary px-6 py-14 text-primary-foreground md:px-12">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary-foreground/70">Our impact so far</p>
          <h2 className="font-heading text-2xl font-bold tracking-tight text-balance md:text-3xl">
            Every rescued meal adds up.
          </h2>
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="flex flex-col gap-1 border-l-2 border-primary-foreground/25 pl-4">
              <dt className="order-2 text-sm text-primary-foreground/80">{s.label}</dt>
              <dd className="order-1 font-heading text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">{s.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

const TESTIMONIALS = [
  {
    quote: 'I grab dinner on the way home for half the price, and sometimes I donate the extra portion. It feels good every time.',
    name: 'Rina P.',
    role: 'Customer, Jakarta Selatan',
    image: '/foods/nasi-goreng.png',
  },
  {
    quote: 'We used to throw away trays of bread every night. Now almost everything is picked up before we close.',
    name: 'Budi S.',
    role: 'Owner, Daily Bakery',
    image: '/foods/croissant-box.png',
  },
  {
    quote: 'Setting a daily limit means we only receive what we can actually serve. The children get warm meals every week.',
    name: 'Ibu Sari',
    role: 'Panti Asuhan Harapan',
    image: '/foods/rendang-rice.png',
  },
]

export function Testimonials() {
  return (
    <section id="stories" className="scroll-mt-20">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-20 md:px-6">
        <SectionHeading eyebrow="Stories from the community" title="Loved by customers, kitchens and institutions." center />
        <ul className="grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <li key={t.name}>
              <figure className="flex h-full flex-col gap-5 rounded-2xl border border-border bg-card p-6 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex gap-0.5 text-brand-orange" aria-label="Rated 5 out of 5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="size-4 fill-current" aria-hidden="true" />
                    ))}
                  </div>
                  <Quote className="size-6 text-primary/30" aria-hidden="true" />
                </div>
                <blockquote className="flex-1 leading-relaxed text-pretty">{`“${t.quote}”`}</blockquote>
                <figcaption className="flex items-center gap-3 border-t border-border pt-4">
                  <span className="relative size-10 shrink-0 overflow-hidden rounded-full ring-2 ring-accent">
                    <Image src={t.image} alt="" fill sizes="40px" className="object-cover" />
                  </span>
                  <span className="flex flex-col">
                    <span className="text-sm font-semibold">{t.name}</span>
                    <span className="text-xs text-muted-foreground">{t.role}</span>
                  </span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

const CTA_FOODS = ['/foods/mie-ayam.png', '/foods/dimsum.png', '/foods/gado-gado.png', '/foods/roti-pandan.png']

export function FinalCta() {
  return (
    <section className="px-4 pb-24 md:px-6">
      <div className="mx-auto grid max-w-6xl items-center gap-10 overflow-hidden rounded-[2rem] border border-border bg-secondary p-8 md:grid-cols-[1.2fr_1fr] md:p-12">
        <div className="flex flex-col items-start gap-5">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-balance md:text-5xl">
            Start <span className="text-brand-orange">Saving Food</span> tonight
          </h2>
          <p className="max-w-lg leading-relaxed text-muted-foreground text-pretty">
            Join thousands of neighbours rescuing great meals every evening — for themselves and for communities in need.
          </p>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <ButtonLink href="/explore" className="h-12 rounded-full px-7 text-base shadow-lg shadow-primary/20">
              Explore Food
              <ArrowRight aria-hidden="true" />
            </ButtonLink>
            <ButtonLink href="/register" variant="outline" className="h-12 rounded-full px-7 text-base">
              Join as a partner
            </ButtonLink>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3" aria-hidden="true">
          {CTA_FOODS.map((src, i) => (
            <div key={src} className={`relative aspect-square overflow-hidden rounded-2xl shadow-md ${i % 2 === 1 ? 'translate-y-4' : ''}`}>
              <Image src={src} alt="" fill sizes="(min-width: 768px) 220px, 45vw" className="object-cover" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="flex flex-col gap-2">
          <Logo />
          <p className="text-sm text-muted-foreground">Save Food. Save Money. Share Goodness.</p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <a href="/explore" className="hover:text-foreground">Explore</a>
          <a href="/register" className="hover:text-foreground">For restaurants</a>
          <a href="/register" className="hover:text-foreground">For institutions</a>
          <a href="/login" className="hover:text-foreground">Log in</a>
        </nav>
        <p className="text-xs text-muted-foreground">{'© 2026 FoodCycle. Demo application.'}</p>
      </div>
    </footer>
  )
}
