import { describe, expect, test } from 'vitest'
import { marsLink, nextBlackout } from './orbit'

describe('Earth–Mars link from JPL elements', () => {
  test('closest approach of January 2025 is about 0.64 au (96 million km)', () => {
    const l = marsLink(new Date('2025-01-12T00:00:00Z'))
    expect(l.au).toBeGreaterThan(0.62)
    expect(l.au).toBeLessThan(0.66)
    expect(l.delaySec / 60).toBeGreaterThan(5)
    expect(l.delaySec / 60).toBeLessThan(5.6)
  })

  test('the November 2023 solar conjunction is a blackout, far from the Sun the opposition is not', () => {
    expect(marsLink(new Date('2023-11-18T00:00:00Z')).blackout).toBe(true)
    expect(marsLink(new Date('2023-11-18T00:00:00Z')).au).toBeGreaterThan(2.4)
    expect(marsLink(new Date('2025-01-16T00:00:00Z')).sunAngleDeg).toBeGreaterThan(170)
  })

  test('delay always lies within the 3 to 22 minute range NASA quotes', () => {
    for (let y = 2020; y < 2030; y++) {
      for (let m = 0; m < 12; m++) {
        const min = marsLink(new Date(Date.UTC(y, m, 1))).delaySec / 60
        expect(min).toBeGreaterThan(3)
        expect(min).toBeLessThan(22.5)
      }
    }
  })

  test('finds the January 2026 conjunction from late 2025', () => {
    const w = nextBlackout(new Date('2025-11-01T00:00:00Z'))!
    expect(w.start.getUTCFullYear() * 12 + w.start.getUTCMonth()).toBeGreaterThanOrEqual(2025 * 12 + 11)
    expect(w.start.getUTCFullYear() * 12 + w.start.getUTCMonth()).toBeLessThanOrEqual(2026 * 12 + 0)
  })
})
