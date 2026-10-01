'use client'

import { ThemeProvider } from 'next-themes'
import { useEffect } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { hydrateDb } from '@/services/mock-db'

export function AppProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    hydrateDb()
  }, [])

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      {children}
      <Toaster position="top-center" richColors closeButton />
    </ThemeProvider>
  )
}
