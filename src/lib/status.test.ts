import { describe, expect, test } from 'vitest'
import type { Measurement } from '../contract/types'
import type { Baseline } from './baseline'
import { computeBaseline } from './baseline'
import { getCategoricalStatus, getStatus } from './status'

const base: Baseline = { mean: 70, sd: 5, n: 30 }

function m(overrides: Partial<Measurement>): Measurement {
  return {
    id: 'x',
    crewId: 'crew-1',
    timestamp: '2026-11-14T00:00:00Z',
    indicator: 'heartRate',
    value: 70,
    quality: { score: 1, passed: true },
    source: 'simulated',
    ...overrides,
  }
}

describe('getStatus', () => {
  test('failed quality is always gray, even for an extreme value', () => {
    const bad = m({ value: 200, quality: { score: 0.1, passed: false, reason: 'motion' } })
    expect(getStatus(bad, base)).toBe('gray')
  })

  test('no baseline is gray', () => {
    expect(getStatus(m({}), null)).toBe('gray')
  })

  test('within 1 SD is green', () => {
    expect(getStatus(m({ value: 74 }), base)).toBe('green')
    expect(getStatus(m({ value: 66 }), base)).toBe('green')
  })

  test('between 1 and 2 SD is yellow', () => {
    expect(getStatus(m({ value: 77 }), base)).toBe('yellow')
    expect(getStatus(m({ value: 61 }), base)).toBe('yellow')
  })

  test('beyond 2 SD is red', () => {
    expect(getStatus(m({ value: 81 }), base)).toBe('red')
    expect(getStatus(m({ value: 59 }), base)).toBe('red')
  })

  test('object values are gray (use getCategoricalStatus)', () => {
    expect(getStatus(m({ value: { x: 1 } }), base)).toBe('gray')
  })
})

describe('getStatus on quantities with a big offset and small natural spread', () => {
  const temps = Array.from({ length: 30 }, (_, i) => 36.6 + ((i % 5) - 2) * 0.1)
  const tempBase = computeBaseline(temps)!
  const t = (value: number): Measurement => m({ indicator: 'temperature', value })

  test('a 38 degree reading is flagged against a 36.6 degree baseline (it was invisible before)', () => {
    expect(getStatus(t(38.1), tempBase)).toBe('red')
  })

  test('a normal day-to-day wobble stays green', () => {
    expect(getStatus(t(36.7), tempBase)).toBe('green')
  })

  test('a one-degree rise is at least a watch', () => {
    expect(['yellow', 'red']).toContain(getStatus(t(37.6), tempBase))
  })
})

describe('getCategoricalStatus', () => {
  test('failed quality is gray', () => {
    const q = { score: 0, passed: false }
    expect(getCategoricalStatus(m({ indicator: 'amslerDistortion', value: { distortion: true }, quality: q }))).toBe('gray')
  })

  test('symptom report with symptoms is yellow, empty is green', () => {
    expect(getCategoricalStatus(m({ indicator: 'symptomReport', value: { symptoms: ['headache'] } }))).toBe('yellow')
    expect(getCategoricalStatus(m({ indicator: 'symptomReport', value: { symptoms: [] } }))).toBe('green')
  })

  test('amsler distortion is yellow, none is green', () => {
    expect(getCategoricalStatus(m({ indicator: 'amslerDistortion', value: { distortion: true } }))).toBe('yellow')
    expect(getCategoricalStatus(m({ indicator: 'amslerDistortion', value: { distortion: false } }))).toBe('green')
  })

  test('unknown categorical shape is gray', () => {
    expect(getCategoricalStatus(m({ indicator: 'mood', value: { foo: 1 } }))).toBe('gray')
  })
})

describe('body checks judged by rules, not a baseline', () => {
  const mk = (indicator: 'painReport' | 'moodScreen', value: Record<string, unknown>) =>
    ({ id: 'x', crewId: 'c', timestamp: '2026-11-15T00:00:00.000Z', indicator, value, quality: { score: 1, passed: true }, source: 'manual' }) as const

  test('any pain is worth a look; no pain is fine', () => {
    expect(getCategoricalStatus(mk('painReport', { level: 0, areas: [] }))).toBe('green')
    expect(getCategoricalStatus(mk('painReport', { level: 2, areas: [] }))).toBe('yellow')
  })

  test('the mood screen uses the published cutoff of 3 on either the PHQ-2 or the GAD-2', () => {
    expect(getCategoricalStatus(mk('moodScreen', { phq2: 2, gad2: 2 }))).toBe('green')
    expect(getCategoricalStatus(mk('moodScreen', { phq2: 3, gad2: 0 }))).toBe('yellow')
    expect(getCategoricalStatus(mk('moodScreen', { phq2: 0, gad2: 3 }))).toBe('yellow')
  })
})
