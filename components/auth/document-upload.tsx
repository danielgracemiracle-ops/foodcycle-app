'use client'

import { useId, useRef, useState } from 'react'
import { CheckCircle2, FileUp, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DOC_ACCEPT, DOC_HINT, MAX_DOC_BYTES, formatBytes, type DocSpec, type UploadedDoc } from '@/lib/legal-docs'
import { Button } from '@/components/ui/button'

interface DocumentUploadProps {
  spec: DocSpec
  value?: UploadedDoc
  error?: string
  onChange: (doc: UploadedDoc | undefined) => void
}

export function DocumentUpload({ spec, value, error, onChange }: DocumentUploadProps) {
  const inputId = useId()
  const errorId = `${inputId}-error`
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const shownError = uploadError || error

  const upload = async (file: File) => {
    setUploadError('')
    if (file.size > MAX_DOC_BYTES) return setUploadError('The file is larger than 4 MB.')
    setUploading(true)
    try {
      const body = new FormData()
      body.set('kind', spec.kind)
      body.set('file', file)
      const res = await fetch('/api/legal-docs', { method: 'POST', body })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Upload failed. Please try again.')
      onChange(data as UploadedDoc)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div
        className={cn(
          'flex items-center gap-3 rounded-xl border border-dashed border-border bg-background p-3 transition-colors',
          value && 'border-solid border-primary/40 bg-accent/40',
          shownError && 'border-destructive/60',
        )}
      >
        <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground', value && 'bg-primary/15 text-primary')}>
          {uploading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : value ? <CheckCircle2 className="size-4" aria-hidden="true" /> : <FileUp className="size-4" aria-hidden="true" />}
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <label htmlFor={inputId} className="text-sm font-medium">
            {spec.label}
            {!spec.required && <span className="font-normal text-muted-foreground"> (optional)</span>}
          </label>
          <p className="truncate text-xs text-muted-foreground">
            {uploading ? 'Uploading…' : value ? `${value.name} · ${formatBytes(value.size)}` : DOC_HINT}
          </p>
        </div>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={DOC_ACCEPT}
          className="sr-only"
          disabled={uploading}
          aria-invalid={shownError ? true : undefined}
          aria-describedby={shownError ? errorId : undefined}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void upload(file)
          }}
        />
        <div className="flex shrink-0 items-center gap-1">
          <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
            {value ? 'Replace' : 'Upload'}
          </Button>
          {value && !uploading && (
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => onChange(undefined)} aria-label={`Remove ${spec.label}`}>
              <X aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>
      {shownError && <p id={errorId} className="text-xs font-medium text-destructive">{shownError}</p>}
    </div>
  )
}
