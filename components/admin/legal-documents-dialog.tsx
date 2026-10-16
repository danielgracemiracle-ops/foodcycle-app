'use client'

import { FileText } from 'lucide-react'
import type { InstitutionLegal, RestaurantLegal } from '@/types'
import { formatDate } from '@/lib/format'
import { formatNpwp, mask } from '@/lib/registration'
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

export function LegalDocumentsDialog({ name, legal }: { name: string; legal?: Legal }) {
  if (!legal) return <span className="text-xs text-muted-foreground">Not submitted</span>
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
      <DialogContent className="sm:max-w-md">
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
      </DialogContent>
    </Dialog>
  )
}
