import { SiteHeader } from '@/components/landing/site-header'
import { Hero } from '@/components/landing/hero'
import { FinalCta, HowItWorks, ImpactStats, SiteFooter, Testimonials, WhyFoodCycle } from '@/components/landing/sections'

export default function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <HowItWorks />
        <WhyFoodCycle />
        <ImpactStats />
        <Testimonials />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  )
}
