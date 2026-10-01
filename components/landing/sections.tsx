import { ArrowRight, BarChart3, HandHeart, Leaf, Search, Store, Users, Wallet } from 'lucide-react'
import { ButtonLink } from '@/components/shared/button-link'
import { Logo } from '@/components/shared/logo'

const STEPS = [
  { icon: Store, title: 'Restaurants List Surplus Food', body: 'Restaurants upload food that would otherwise remain unsold.' },
  { icon: Search, title: 'Customers Find Affordable Food', body: 'Customers discover quality food at discounted prices.' },
  { icon: HandHeart, title: 'Buy or Donate', body: 'Customers choose whether to enjoy the food themselves or donate it.' },
  { icon: BarChart3, title: 'Track Your Impact', body: 'FoodCycle records meals saved, donations, and food waste prevented.' },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 border-y border-border bg-secondary/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-20 md:px-6">
        <div className="flex max-w-2xl flex-col gap-3">
          <p className="text-sm font-semibold text-primary">How FoodCycle works</p>
          <h2 className="font-heading text-3xl font-bold tracking-tight text-balance md:text-4xl">
            From the kitchen to your table — or someone else&apos;s.
          </h2>
        </div>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <li key={step.title} className="relative flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center justify-between">
                <span className="inline-flex size-11 items-center justify-center rounded-xl bg-accent text-primary">
                  <step.icon className="size-5" aria-hidden="true" />
                </span>
                <span className="font-heading text-sm font-semibold text-muted-foreground">Step {i + 1}</span>
              </div>
              <h3 className="font-heading text-lg font-semibold leading-snug">{step.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{step.body}</p>
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

export function WhyFoodCycle() {
  return (
    <section id="why" className="scroll-mt-20">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 md:px-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="flex flex-col gap-4">
          <p className="text-sm font-semibold text-primary">Why FoodCycle?</p>
          <h2 className="font-heading text-3xl font-bold tracking-tight text-balance md:text-4xl">
            Good food deserves better than the bin.
          </h2>
          <p className="leading-relaxed text-muted-foreground text-pretty">
            Every listing carries a transparent Food Grade and Quality Score, so you always know exactly what you&apos;re picking up.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 shadow-xs">
              <f.icon className="size-6 text-primary" aria-hidden="true" />
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
      <div className="mx-auto max-w-6xl rounded-[2rem] bg-primary px-6 py-14 text-primary-foreground md:px-12">
        <h2 className="sr-only">Impact statistics</h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="flex flex-col gap-1">
              <dt className="order-2 text-sm text-primary-foreground/80">{s.label}</dt>
              <dd className="order-1 font-heading text-4xl font-bold tracking-tight md:text-5xl">{s.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

export function FinalCta() {
  return (
    <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-24 text-center md:px-6">
      <h2 className="font-heading text-3xl font-bold tracking-tight text-balance md:text-5xl">Start Saving Food</h2>
      <p className="max-w-lg leading-relaxed text-muted-foreground text-pretty">
        Join thousands of neighbours rescuing great meals every evening — for themselves and for communities in need.
      </p>
      <ButtonLink href="/explore" className="h-12 rounded-full px-7 text-base">
        Explore Food
        <ArrowRight aria-hidden="true" />
      </ButtonLink>
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
