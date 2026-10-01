import { AppShell } from '@/components/shell/app-shell'

export default function RestaurantLayout({ children }: { children: React.ReactNode }) {
  return <AppShell role="restaurant">{children}</AppShell>
}
