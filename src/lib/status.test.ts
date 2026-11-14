import { describe, expect, test } from 'vitest'
import type { Measurement } from '../contract/types'
import type { Baseline } from './baseline'
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
