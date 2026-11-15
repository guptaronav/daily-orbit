import { describe, expect, it } from 'vitest'
import { ENTRY_FORMS, ICONS } from './data'

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
