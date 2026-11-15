import { describe, expect, it } from 'vitest'
import raw from '../content/indicators.json'
import type { Indicator, Measurement } from '../contract/types'
import { readAll } from './bodyStatus'
import { HAZARD_IDS, hazardIndicators, hazardStatus } from './hazards'

const content = raw as { id: Indicator; hazardEffect: string }[]

describe('hazard mapping', () => {
  it('links a reading to a hazard only when its sourced text names that hazard', () => {
    const map = hazardIndicators([
      { id: 'heartRate', hazardEffect: 'Altered gravity can change the heart. Radiation may also affect it.' },
      { id: 'mood', hazardEffect: 'Isolation and distance from Earth take a toll.' },
    ])
    expect(map.gravity).toEqual(['heartRate'])
    expect(map.radiation).toEqual(['heartRate'])
    expect(map.isolation).toEqual(['mood'])
    expect(map.distance).toEqual(['mood'])
    expect(map.environment).toEqual([])
  })
  it('gives every one of the five hazards at least one reading from the real content', () => {
    const map = hazardIndicators(content)
    for (const h of HAZARD_IDS) expect(map[h].length, h).toBeGreaterThan(0)
  })
})

describe('hazard status', () => {
  const day = (i: number) => new Date(Date.parse('2026-10-01T08:00:00Z') + i * 86_400_000).toISOString()
  const ms = (indicator: Indicator, vals: number[]): Measurement[] =>
    vals.map((value, i) => ({ id: `${indicator}${i}`, crewId: 'c', timestamp: day(i), indicator, value, quality: { score: 1, passed: true }, source: 'manual' }))
  it('takes the worst status of its readings and lists the flagged ones', () => {
    const readings = readAll([...ms('heartRate', [60, 61, 59, 60, 61, 60, 90]), ...ms('mood', [6, 6.2, 5.8, 6, 6.1, 5.9, 6])])
    const s = hazardStatus({ radiation: [], isolation: ['mood'], distance: [], gravity: ['heartRate', 'mood'], environment: [] }, readings)
    expect(s.gravity.status).toBe('red')
    expect(s.gravity.flagged).toEqual(['heartRate'])
    expect(s.isolation.status).toBe('green')
    expect(s.radiation.status).toBe('gray')
  })
})
