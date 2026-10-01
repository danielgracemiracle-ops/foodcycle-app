export function formatRupiah(value: number) {
  return `Rp${Math.round(value).toLocaleString('id-ID')}`
}

export function formatTime(iso: string) {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatDateTime(iso: string) {
  return `${formatDate(iso)}, ${formatTime(iso)}`
}

export function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function pickupLabel(startIso: string, endIso: string, now = new Date()) {
  const start = new Date(startIso)
  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)
  const day = isSameDay(start, now) ? 'Today' : isSameDay(start, tomorrow) ? 'Tomorrow' : formatDate(startIso)
  return `${day} ${formatTime(startIso)}–${formatTime(endIso)}`
}

export function timeAgo(iso: string, now = Date.now()) {
  const diff = Math.max(0, now - new Date(iso).getTime())
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d ago`
  return formatDate(iso)
}

export function timeLeftLabel(endIso: string, now = Date.now()) {
  const mins = Math.round((new Date(endIso).getTime() - now) / 60000)
  if (mins <= 0) return 'Pickup closed'
  if (mins < 60) return `${mins} min left`
  const h = Math.floor(mins / 60)
  if (h < 24) return `${h}h ${mins % 60}m left`
  return `${Math.floor(h / 24)}d left`
}

export function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')
}

export function shortId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}
