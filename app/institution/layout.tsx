import { AppShell } from '@/components/shell/app-shell'

export default function InstitutionLayout({ children }: { children: React.ReactNode }) {
  return <AppShell role="institution">{children}</AppShell>
}
