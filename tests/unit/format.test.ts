import { describe, expect, it } from 'vitest'
import { formatRupiah, initials, timeAgo, timeLeftLabel } from '@/lib/format'
import { NOW, hoursFromNow } from '../fixtures'

describe('Formatting helpers (lib/format.ts)', () => {
  it('UT-X01: formats rupiah with Indonesian thousand separators', () => {
    expect(formatRupiah(15000)).toBe('Rp15.000')
  })

  it('UT-X02: pickup countdown labels', () => {
    expect(timeLeftLabel(hoursFromNow(-1), NOW)).toBe('Pickup closed')
    expect(timeLeftLabel(hoursFromNow(0.5), NOW)).toBe('30 min left')
    expect(timeLeftLabel(hoursFromNow(2), NOW)).toBe('2h 0m left')
  })

  it('UT-X03: relative time', () => {
    expect(timeAgo(hoursFromNow(0), NOW)).toBe('Just now')
    expect(timeAgo(hoursFromNow(-3), NOW)).toBe('3h ago')
  })

  it('UT-X04: initials from names', () => {
    expect(initials('daniel grace miracle')).toBe('DG')
  })
})
