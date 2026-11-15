import { describe, expect, it } from 'vitest'
import { ENTRY_FORMS, ICONS, slideForecast } from './data'

// The Log screen reads icon and region off every form. A form added to src/lib/manualEntry.ts without
// an entry in data.ts's lookups used to blank the whole screen, so this pins the two lists together.
describe('Log screen entry forms', () => {
  it.each(ENTRY_FORMS.map((f) => [f.kind, f] as const))('%s has a region, an icon that exists, and fields', (_kind, form) => {
    expect(typeof form.region).toBe('string')
    expect(form.region.length).toBeGreaterThan(0)
    expect((ICONS as Record<string, string>)[form.icon]).toBeTruthy()
    expect(form.fields.length).toBeGreaterThan(0)
  })

  it('includes the gut and nutrition forms', () => {
    const kinds = ENTRY_FORMS.map((f) => f.kind)
    expect(kinds).toContain('bodyMass')
    expect(kinds).toContain('bowelMovements')
  })
})

describe('slide forecast', () => {
  const r = (latest: number, perDay: number) => ({ id: 'bodyMass', unit: 'kg', dp: 1, latest: { v: latest, t: Date.now() }, baseline: { mean: 70, sd: 0.5, n: 10 }, reference: { mean: 70, sd: 0.5, n: 10 }, drift: { direction: perDay > 0 ? 'up' : 'down', perDay, days: 6, change: perDay * 6 } })

  it('says how many days until the Act zone (2 SD) at the current rate', () => {
    // Act edge 69.0; at 69.6 losing 0.2 a day, that is 3 days.
    const f = slideForecast(r(69.6, -0.2))!
    expect(f.days).toBe(3)
    expect(f.outside).toBe(false)
    expect(f.text).toContain('in about 3 days')
  })

  it('says so when the slide is already in the Act zone', () => {
    expect(slideForecast(r(68.8, -0.2))!.outside).toBe(true)
  })

  it('stays quiet without a slide', () => {
    expect(slideForecast({ ...r(69.6, -0.2), drift: null })).toBeNull()
  })
})
