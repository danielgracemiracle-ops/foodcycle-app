import Image from 'next/image'
import { Logo } from '@/components/shared/logo'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col px-4 py-6 md:px-10">
        <Logo />
        <main className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md">{children}</div>
        </main>
      </div>
      <aside className="relative hidden overflow-hidden bg-muted lg:block">
        <Image src="/hero-food.png" alt="" fill priority sizes="50vw" className="object-cover" />
        <div className="absolute inset-x-8 bottom-8 rounded-3xl bg-background/90 p-6 backdrop-blur">
          <p className="font-heading text-2xl font-bold leading-snug text-balance">
            {'"I rescued dinner for my family and donated 5 meals in the same checkout."'}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">Raka, FoodCycle member since 2025</p>
        </div>
      </aside>
    </div>
  )
}
