import { describe, expect, test } from 'vitest'
import type { Indicator, Measurement, Quality } from '../contract/types'
import { readAll, readIndicator, regionStatus, worstStatus } from './bodyStatus'
import { REGIONS } from './regions'

const OK: Quality = { score: 1, passed: true }
const BAD: Quality = { score: 0.1, passed: false, reason: 'motion' }

function m(i: number, value: Measurement['value'], quality: Quality = OK, indicator: Indicator = 'heartRate'): Measurement {
  return {
    id: `${indicator}-${i}`,
    crewId: 'crew-1',
    timestamp: new Date(Date.UTC(2026, 10, 1 + i)).toISOString(),
    indicator,
    value,
    quality,
    source: 'simulated',
  }
}

// 20 prior readings around 70 (sd ~ 1.4), so a latest reading of 100 is far beyond 2 SD.
const prior = Array.from({ length: 20 }, (_, i) => m(i, 68 + (i % 5)))

describe('worstStatus', () => {
  test('no data or only gray is gray', () => {
    expect(worstStatus([])).toBe('gray')
    expect(worstStatus(['gray', 'gray'])).toBe('gray')
  })
  test('ignores gray when something has data', () => {
    expect(worstStatus(['green', 'gray'])).toBe('green')
  })
  test('red beats yellow beats green', () => {
    expect(worstStatus(['green', 'yellow'])).toBe('yellow')
    expect(worstStatus(['green', 'yellow', 'red'])).toBe('red')
  })
})

describe('readIndicator', () => {
  test('flags a latest reading far from baseline as red', () => {
    const r = readIndicator('heartRate', [...prior, m(20, 100)])
    expect(r.status).toBe('red')
    expect(r.latest?.value).toBe(100)
  })

  test('a failed-quality latest reading never colors: falls back to the last passed one', () => {
    const r = readIndicator('heartRate', [...prior, m(20, 70), m(21, 200, BAD)])
    expect(r.status).toBe('green')
    expect(r.latest?.value).toBe(70)
    expect(r.failedCount).toBe(1)
  })

  test('only failed readings means gray and no latest', () => {
    const r = readIndicator('heartRate', [m(0, 200, BAD), m(1, 210, BAD)])
    expect(r.status).toBe('gray')
    expect(r.latest).toBeUndefined()
  })

  test('baseline excludes the latest reading, so too little history is gray', () => {
    const r = readIndicator('heartRate', [m(0, 70), m(1, 71), m(2, 70), m(3, 72), m(4, 70)])
    expect(r.baseline).toBeNull()
    expect(r.status).toBe('gray')
  })

  test('reports how many earlier readings count toward the baseline', () => {
    expect(readIndicator('heartRate', [m(0, 70), m(1, 71), m(2, 72)]).priorCount).toBe(2)
    expect(readIndicator('heartRate', [m(0, 70), m(1, 99, BAD), m(2, 72)]).priorCount).toBe(1)
    expect(readIndicator('heartRate', []).priorCount).toBe(0)
  })

  test('categorical indicators use the categorical status', () => {
    const r = readIndicator('symptomReport', [m(0, { symptoms: ['headache'] }, OK, 'symptomReport')])
    expect(r.status).toBe('yellow')
  })
})

describe('regionStatus', () => {
  test('only member indicators of the region count', () => {
    const readings = readAll([...prior, m(20, 100)]) // heartRate red
    const heart = REGIONS.find((r) => r.id === 'heart')!
    const head = REGIONS.find((r) => r.id === 'head')!
    expect(regionStatus(heart, readings)).toBe('red')
    expect(regionStatus(head, readings)).toBe('gray')
  })
})
