import { AppShell } from '@/components/shell/app-shell'

export default function CourierLayout({ children }: { children: React.ReactNode }) {
  return <AppShell role="courier">{children}</AppShell>
}
