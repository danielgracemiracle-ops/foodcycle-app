'use client'

import { ExternalLink, FileText, FileWarning, ShieldCheck } from 'lucide-react'
import type { InstitutionLegal, RestaurantLegal } from '@/types'
import { formatDate } from '@/lib/format'
import { formatNpwp, mask } from '@/lib/registration'
import { DOC_LABEL, DOC_SPECS, docUrl, formatBytes } from '@/lib/legal-docs'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

type Legal = RestaurantLegal | InstitutionLegal

function rows(legal: Legal): [string, string][] {
  const common: [string, string][] = [
    ['NPWP', formatNpwp(legal.npwp)],
    ['Bank', legal.bank.bankName],
    ['Account number', mask(legal.bank.accountNumber)],
    ['Account holder', legal.bank.accountHolder],
  ]
  if ('nib' in legal)
    return [
      ['Owner NIK', mask(legal.ownerNik)],
      ['NIB', legal.nib],
      ['PIRT / SLHS', legal.foodPermit],
      ['Halal certificate', legal.halalCertificate ?? 'Not provided'],
      ...common,
    ]
  return [
    ['Deed no.', legal.deedNumber],
    ['SK Kemenkumham', legal.skKemenkumham],
    ['Domicile letter', legal.domicileLetter],
    ['Person in charge', legal.picName],
    ['PIC NIK', mask(legal.picNik)],
    ['People served', legal.beneficiaries.toLocaleString('id-ID')],
    ...common,
  ]
}

/** Public government portals where an admin can confirm each number by hand. */
function officialChecks(legal: Legal): { label: string; href: string }[] {
  const npwp = { label: 'NPWP at DJP', href: 'https://ereg.pajak.go.id/ceknpwp' }
  if ('nib' in legal)
    return [
      { label: 'NIB at OSS', href: 'https://oss.go.id' },
      { label: 'PIRT at BPOM', href: 'https://sppirt.pom.go.id' },
      ...(legal.halalCertificate ? [{ label: 'Halal at BPJPH', href: 'https://bpjph.halal.go.id' }] : []),
      npwp,
    ]
  return [{ label: 'Legal entity at AHU', href: 'https://ahu.go.id' }, npwp]
}

export function LegalDocumentsDialog({ name, legal }: { name: string; legal?: Legal }) {
  if (!legal) return <span className="text-xs text-muted-foreground">Not submitted</span>
  const docs = legal.documents ?? []
  const role = 'nib' in legal ? 'restaurant' : 'institution'
  const missing = DOC_SPECS[role].filter((s) => s.required && !docs.some((d) => d.kind === s.kind))

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <FileText aria-hidden="true" />
            View
          </Button>
        }
      />
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{name}</DialogTitle>
          <DialogDescription>Submitted {formatDate(legal.submittedAt)} · partner rules {legal.agreedRules ? 'accepted' : 'not accepted'}</DialogDescription>
        </DialogHeader>

        <dl className="flex flex-col divide-y divide-border rounded-xl border">
          {rows(legal).map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="text-right font-medium tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>

        <section aria-labelledby="doc-files" className="flex flex-col gap-2">
          <h3 id="doc-files" className="text-sm font-semibold">Uploaded files</h3>
          {docs.length === 0 ? (
            <p className="rounded-xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground">No files uploaded. This partner registered before file uploads existed.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border rounded-xl border">
              {docs.map((d) => (
                <li key={d.pathname} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                  <div className="flex min-w-0 flex-col">
                    <span className="font-medium">{DOC_LABEL[d.kind]}</span>
                    <span className="truncate text-xs text-muted-foreground">{d.name} · {formatBytes(d.size)}</span>
                  </div>
                  <Button variant="outline" size="sm" render={<a href={docUrl(d.pathname)} target="_blank" rel="noopener noreferrer" />}>
                    Open
                    <ExternalLink aria-hidden="true" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
          {docs.length > 0 && missing.length > 0 && (
            <p className="flex items-center gap-2 text-xs font-medium text-destructive">
              <FileWarning className="size-4" aria-hidden="true" />
              Missing: {missing.map((m) => m.label).join(', ')}
            </p>
          )}
        </section>

        <section aria-labelledby="official-checks" className="flex flex-col gap-2 rounded-xl bg-muted/50 p-4">
          <h3 id="official-checks" className="flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
            Check at the official source
          </h3>
          <p className="text-xs leading-relaxed text-muted-foreground">Compare each number and file with the government record before approving.</p>
          <div className="flex flex-wrap gap-2">
            {officialChecks(legal).map((c) => (
              <Button key={c.href} variant="outline" size="sm" render={<a href={c.href} target="_blank" rel="noopener noreferrer" />}>
                {c.label}
                <ExternalLink aria-hidden="true" />
              </Button>
            ))}
          </div>
        </section>
      </DialogContent>
    </Dialog>
  )
}
