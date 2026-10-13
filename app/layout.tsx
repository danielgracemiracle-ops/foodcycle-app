import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Bricolage_Grotesque, Plus_Jakarta_Sans } from 'next/font/google'
import { AppProviders } from '@/components/providers/app-providers'
import './globals.css'

const _jakarta = Plus_Jakarta_Sans({ subsets: ['latin'] })
const _bricolage = Bricolage_Grotesque({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'FoodCycle — Save Food. Save Money. Share Goodness.',
    template: '%s · FoodCycle',
  },
  description:
    'FoodCycle is a surplus food marketplace and donation platform connecting restaurants, customers and verified social institutions to reduce food waste.',
  generator: 'v0.app',
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fcfcfa' },
    { media: '(prefers-color-scheme: dark)', color: '#161d1a' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <AppProviders>{children}</AppProviders>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
