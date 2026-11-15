import { describe, expect, it } from 'vitest'
import type { Indicator, Measurement } from '../contract/types'
import { readAll, readIndicator } from './bodyStatus'
import { patternFlags } from './patterns'
import { detectDrift, referenceBaseline, REFERENCE_DAYS, type Point } from './trend'

const DAY = 86_400_000
const T0 = Date.parse('2026-10-01T08:00:00Z')
const pts = (vals: number[]): Point[] => vals.map((v, i) => ({ t: T0 + i * DAY, v }))
const series = (indicator: Indicator, vals: number[], start = 0): Measurement[] =>
  vals.map((value, i) => ({ id: `${indicator}-${i}`, crewId: 'c', timestamp: new Date(T0 + (start + i) * DAY).toISOString(), indicator, value, quality: { score: 1, passed: true }, source: 'manual' }))
// A steady person: small day-to-day wobble around a mean.
const wobble = (mean: number, n: number, amp = 1) => Array.from({ length: n }, (_, i) => mean + (i % 2 ? amp : -amp) * ((i % 3) + 1) * 0.3)

describe('reference baseline', () => {
  it('does not exist until the history is longer than the reference window', () => {
    expect(referenceBaseline(pts(wobble(70, 10)), T0 + 9 * DAY)).toBeNull()
  })
  it('is built from the first two weeks only', () => {
    const p = pts([...wobble(70, REFERENCE_DAYS), ...Array(10).fill(60)])
    const ref = referenceBaseline(p, T0 + 23 * DAY)!
    expect(ref.mean).toBeGreaterThan(69)
    expect(ref.mean).toBeLessThan(71)
  })
})

describe('drift', () => {
  const scale = { mean: 70, sd: 1, n: 14 }
  it('finds a steady slide', () => {
    const d = detectDrift(pts([70, 69.6, 69.1, 68.7, 68.2, 67.8, 67.3]), scale)
    expect(d?.direction).toBe('down')
    expect(d!.days).toBe(6)
  })
  it('ignores noise around a steady mean', () => {
    expect(detectDrift(pts(wobble(70, 7, 1)), scale)).toBeNull()
  })
  it('ignores a slide that is small next to the person’s own spread', () => {
    expect(detectDrift(pts([70, 69.9, 69.8, 69.7, 69.6, 69.5, 69.4]), scale)).toBeNull()
  })
  it('needs enough readings over enough days', () => {
    expect(detectDrift(pts([70, 68, 66]), scale)).toBeNull()
  })
})

describe('readIndicator with a reference', () => {
  it('catches a gradual loss the rolling baseline partly hides', () => {
    // Two steady weeks, then a slow decline: the rolling baseline follows it down, the reference does not.
    const vals = [...wobble(75, 14, 0.4), 74.6, 74.3, 74, 73.8, 73.6, 73.4, 73.3, 73.2]
    const r = readIndicator('bodyMass', series('bodyMass', vals))
    expect(r.reference).toBeTruthy()
    expect(r.status).toBe('red')
    expect(r.basis).toBe('reference')
  })
  it('turns a steady slide into Watch while each reading still looks normal', () => {
    const steady = wobble(7, 14, 1.5)
    const slide = [8.4, 8.0, 7.6, 7.2, 6.8, 6.4, 6.0]
    const r = readIndicator('sleepHours', series('sleepHours', [...steady, ...slide]))
    expect(r.drift?.direction).toBe('down')
    expect(['yellow', 'red']).toContain(r.status)
  })
  it('leaves a steady person green', () => {
    expect(readIndicator('heartRate', series('heartRate', wobble(62, 28))).status).toBe('green')
  })
})

describe('pattern flags', () => {
  const steadyThenDrop = (mean: number, drop: number) => [...wobble(mean, 14, 0.3), mean - drop]
  it('fires when related readings move the wrong way together', () => {
    const ms = [...series('sleepHours', steadyThenDrop(7.5, 3)), ...series('sleepQuality', steadyThenDrop(7, 4))]
    const hits = patternFlags(readAll(ms))
    expect(hits.map((h) => h.pattern.id)).toContain('fatigue')
  })
  it('does not fire on one reading alone', () => {
    const hits = patternFlags(readAll(series('sleepHours', steadyThenDrop(7.5, 3))))
    expect(hits).toEqual([])
  })
  it('ignores readings that moved the harmless way', () => {
    // More sleep and better sleep quality are not fatigue.
    const ms = [...series('sleepHours', steadyThenDrop(7.5, -3)), ...series('sleepQuality', steadyThenDrop(6, -3))]
    expect(patternFlags(readAll(ms)).map((h) => h.pattern.id)).not.toContain('fatigue')
  })
  it('sends a red pattern one rung higher', () => {
    const ms = [...series('sleepHours', steadyThenDrop(7.5, 3)), ...series('sleepQuality', steadyThenDrop(7, 4))]
    const fatigue = patternFlags(readAll(ms)).find((h) => h.pattern.id === 'fatigue')!
    expect(fatigue.status).toBe('red')
    expect(fatigue.rung).toBe(3)
  })
})

import { selfReportGaps } from './selfReportGap'

describe('self-report gaps', () => {
  const flat = (mean: number) => [...Array.from({ length: 14 }, (_, i) => mean + (i % 2 ? 0.2 : -0.2))]
  it('flags rating sleep as usual while reaction time is much slower', () => {
    const ms = [...series('sleepQuality', [...flat(7), 7.5]), ...series('reactionTime', [...wobble(280, 14, 5), 420])]
    const gaps = selfReportGaps(readAll(ms))
    expect(gaps[0]?.id).toBe('sleep')
    expect(gaps[0].measured[0].text).toMatch(/slower/)
  })
  it('stays quiet when the person already says they slept badly', () => {
    const ms = [...series('sleepQuality', [...flat(7), 3]), ...series('reactionTime', [...wobble(280, 14, 5), 420])]
    expect(selfReportGaps(readAll(ms))).toEqual([])
  })
  it('stays quiet when the measurement is fine', () => {
    const ms = [...series('sleepQuality', [...flat(7), 7.5]), ...series('reactionTime', [...wobble(280, 15, 5)])]
    expect(selfReportGaps(readAll(ms))).toEqual([])
  })
})
