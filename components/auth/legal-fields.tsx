'use client'

import { FileCheck2, FolderUp, Landmark } from 'lucide-react'
import { BANKS, INSTITUTION_RULES, RESTAURANT_RULES, type LegalDraft, type LegalErrors } from '@/lib/registration'
import { DOC_SPECS, type DocKind, type UploadedDoc } from '@/lib/legal-docs'
import { FormField } from '@/components/shared/form-field'
import { DocumentUpload } from './document-upload'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface LegalFieldsProps {
  role: 'restaurant' | 'institution'
  value: LegalDraft
  onChange: (next: LegalDraft) => void
  onDocument: (kind: DocKind, doc: UploadedDoc | undefined) => void
  errors: LegalErrors
}

type TextKey = Exclude<keyof LegalDraft, 'agreedRules' | 'documents'>

function Section({ icon: Icon, title, description, children }: { icon: typeof Landmark; title: string; description: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4">
      <legend className="sr-only">{title}</legend>
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </fieldset>
  )
}

export function LegalFields({ role, value, onChange, onDocument, errors }: LegalFieldsProps) {
  const set = (k: TextKey) => (e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...value, [k]: e.target.value })
  const text = (k: TextKey, label: string, opts: { hint?: string; numeric?: boolean; placeholder?: string; autoComplete?: string } = {}) => (
    <FormField label={label} error={errors[k]} hint={opts.hint}>
      {(p) => (
        <Input
          {...p}
          value={value[k]}
          onChange={set(k)}
          inputMode={opts.numeric ? 'numeric' : undefined}
          placeholder={opts.placeholder}
          autoComplete={opts.autoComplete ?? 'off'}
          className="h-11"
        />
      )}
    </FormField>
  )
  const rules = role === 'restaurant' ? RESTAURANT_RULES : INSTITUTION_RULES

  return (
    <div className="flex flex-col gap-4">
      <Section
        icon={FileCheck2}
        title="Legal documents"
        description="Admins check these numbers before your account is approved, usually within 3 working days."
      >
        {role === 'restaurant' ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {text('ownerNik', 'Owner NIK (KTP)', { numeric: true, hint: '16 digits' })}
            {text('nib', 'NIB (OSS)', { numeric: true, hint: '13 digits' })}
            {text('npwp', 'NPWP', { numeric: true, hint: '15 or 16 digits' })}
            {text('foodPermit', 'PIRT / SLHS number', { placeholder: 'e.g. PIRT 2063174010123-27' })}
            {text('halalCertificate', 'Halal certificate (optional)', { hint: 'Required only if you label food halal' })}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {text('deedNumber', 'Deed of establishment no.', { placeholder: 'e.g. 12/2019' })}
            {text('skKemenkumham', 'SK Kemenkumham no.', { placeholder: 'e.g. AHU-0012345.AH.01.04' })}
            {text('npwp', 'Institution NPWP', { numeric: true, hint: '15 or 16 digits' })}
            {text('domicileLetter', 'Domicile letter no.')}
            {text('picName', 'Person in charge')}
            {text('picNik', 'Person in charge NIK', { numeric: true, hint: '16 digits' })}
            {text('beneficiaries', 'People you serve', { numeric: true, placeholder: 'e.g. 45' })}
          </div>
        )}
      </Section>

      <Section
        icon={FolderUp}
        title="Document files"
        description="Upload a clear photo or PDF of each document. Files are stored privately and only FoodCycle admins can open them."
      >
        <div className="flex flex-col gap-3">
          {DOC_SPECS[role].map((spec) => (
            <DocumentUpload
              key={spec.kind}
              spec={spec}
              value={value.documents[spec.kind]}
              error={errors[spec.kind]}
              onChange={(doc) => onDocument(spec.kind, doc)}
            />
          ))}
        </div>
      </Section>

      <Section
        icon={Landmark}
        title="Bank account"
        description={role === 'restaurant' ? 'Sales are paid out here. Use an account in the business or owner name.' : 'Must be in the institution name. Used for verified fund transfers.'}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Bank" error={errors.bankName}>
            {(p) => (
              <Select value={value.bankName} onValueChange={(v) => onChange({ ...value, bankName: v ?? '' })}>
                <SelectTrigger {...p} className="h-11 w-full">
                  <SelectValue placeholder="Choose a bank" />
                </SelectTrigger>
                <SelectContent>
                  {BANKS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </FormField>
          {text('accountNumber', 'Account number', { numeric: true })}
          {text('accountHolder', 'Account holder name', { autoComplete: 'name' })}
        </div>
      </Section>

      <div className="flex flex-col gap-2 rounded-2xl bg-muted/50 p-4">
        <p className="text-sm font-semibold">Partner rules</p>
        <ul className="flex list-disc flex-col gap-1 pl-5 text-xs leading-relaxed text-muted-foreground">
          {rules.map((r) => <li key={r}>{r}</li>)}
        </ul>
        <div className="mt-1 flex items-start gap-2.5">
          <Checkbox
            id="agree-rules"
            checked={value.agreedRules}
            onCheckedChange={(v) => onChange({ ...value, agreedRules: Boolean(v) })}
            aria-invalid={errors.agreedRules ? true : undefined}
          />
          <Label htmlFor="agree-rules" className="text-sm leading-snug font-normal">
            I confirm the documents are valid and I accept these rules.
          </Label>
        </div>
        {errors.agreedRules && <p className="text-xs font-medium text-destructive">{errors.agreedRules}</p>}
      </div>
    </div>
  )
}
