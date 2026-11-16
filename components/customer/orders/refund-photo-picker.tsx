'use client'

import { useId, useRef, useState } from 'react'
import { ImagePlus, Loader2, X } from 'lucide-react'
import {
  MAX_REFUND_PHOTO_BYTES,
  REFUND_PHOTO_ACCEPT,
  REFUND_PHOTO_MAX,
  type UploadedRefundPhoto,
} from '@/lib/refund'

export interface PickedPhoto {
  photo: UploadedRefundPhoto
  preview: string
}

interface RefundPhotoPickerProps {
  value: PickedPhoto[]
  onChange: (photos: PickedPhoto[]) => void
  onUploadingChange?: (uploading: boolean) => void
}

export function RefundPhotoPicker({ value, onChange, onUploadingChange }: RefundPhotoPickerProps) {
  const inputId = useId()
  const errorId = `${inputId}-error`
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const remaining = REFUND_PHOTO_MAX - value.length

  const setBusy = (busy: boolean) => {
    setUploading(busy)
    onUploadingChange?.(busy)
  }

  const uploadFiles = async (files: File[]) => {
    setError('')
    const chosen = files.slice(0, remaining)
    if (files.length > remaining) setError(`You can add up to ${REFUND_PHOTO_MAX} photos.`)
    const tooBig = chosen.find((f) => f.size > MAX_REFUND_PHOTO_BYTES)
    if (tooBig) return setError(`${tooBig.name} is larger than 4 MB.`)
    if (chosen.length === 0) return

    setBusy(true)
    const added: PickedPhoto[] = []
    try {
      for (const file of chosen) {
        const body = new FormData()
        body.set('file', file)
        const res = await fetch('/api/refund-photos', { method: 'POST', body })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error ?? 'Upload failed. Please try again.')
        added.push({ photo: data as UploadedRefundPhoto, preview: URL.createObjectURL(file) })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.')
    } finally {
      if (added.length) onChange([...value, ...added])
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const remove = (pathname: string) => {
    const target = value.find((p) => p.photo.pathname === pathname)
    if (target) URL.revokeObjectURL(target.preview)
    onChange(value.filter((p) => p.photo.pathname !== pathname))
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <label htmlFor={inputId} className="text-sm font-medium">Photo evidence</label>
        <span className="text-xs text-muted-foreground tabular-nums">{value.length}/{REFUND_PHOTO_MAX}</span>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Add 1–3 clear photos of the problem (JPG, PNG or WEBP, max 4 MB each).
      </p>

      <div className="grid grid-cols-3 gap-2">
        {value.map(({ photo, preview }, i) => (
          <div key={photo.pathname} className="relative aspect-square overflow-hidden rounded-md border bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
            <img src={preview} alt={`Evidence photo ${i + 1}`} className="size-full object-cover" />
            <button
              type="button"
              onClick={() => remove(photo.pathname)}
              className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm hover:bg-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              aria-label={`Remove photo ${i + 1}`}
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}

        {remaining > 0 && (
          <label
            htmlFor={inputId}
            className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed text-muted-foreground transition-colors hover:border-primary hover:text-primary has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
          >
            {uploading ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}
            <span className="text-xs">{uploading ? 'Uploading…' : 'Add photo'}</span>
            <input
              ref={inputRef}
              id={inputId}
              type="file"
              accept={REFUND_PHOTO_ACCEPT}
              multiple
              disabled={uploading}
              className="sr-only"
              aria-describedby={error ? errorId : undefined}
              onChange={(e) => uploadFiles(Array.from(e.target.files ?? []))}
            />
          </label>
        )}
      </div>

      {error && (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
