import { describe, expect, test } from 'vitest'
import { computeBaseline } from '../baseline'
import { readAll, regionStatus } from '../bodyStatus'
import { REGIONS } from '../regions'
import { generateCrew } from './seed'

const NOW = new Date('2026-11-14T12:00:00Z')

describe('generateCrew', () => {
  test('is deterministic for the same seed and differs for another', () => {
    const a = generateCrew(42, NOW)
    expect(generateCrew(42, NOW)).toEqual(a)
    expect(generateCrew(43, NOW)).not.toEqual(a)
  })

  test('returns three crew plus a guest, labeled simulated', () => {
    const { crew } = generateCrew(42, NOW)
    expect(crew.map((c) => c.id)).toEqual(['crew-1', 'crew-2', 'crew-3', 'guest'])
    expect(crew.every((c) => c.dataLabel === 'Simulated data')).toBe(true)
  })

  test('each crew has about 30 days of passed, simulated sleepHours', () => {
    const { crew, measurements } = generateCrew(42, NOW)
    for (const c of crew) {
      const sleep = measurements.filter((m) => m.crewId === c.id && m.indicator === 'sleepHours')
      expect(sleep.length).toBe(30)
      expect(sleep.every((m) => m.source === 'simulated' && m.quality.passed)).toBe(true)
    }
  })

  test('values stay in sane ranges and ids are unique', () => {
    const { measurements } = generateCrew(42, NOW)
    expect(new Set(measurements.map((m) => m.id)).size).toBe(measurements.length)
    for (const m of measurements) {
      const v = m.value as number
      if (m.indicator === 'sleepHours') expect(v).toBeGreaterThanOrEqual(3)
      if (m.indicator === 'sleepHours') expect(v).toBeLessThanOrEqual(10)
      if (m.indicator === 'mood' || m.indicator === 'stress' || m.indicator === 'sleepQuality') {
        expect(v).toBeGreaterThanOrEqual(0)
        expect(v).toBeLessThanOrEqual(10)
      }
      expect(m.timestamp <= NOW.toISOString()).toBe(true)
    }
  })

  test('history is enough to compute a baseline', () => {
    const { measurements } = generateCrew(42, NOW)
    const hr = measurements.filter((m) => m.crewId === 'crew-1' && m.indicator === 'heartRate').map((m) => m.value as number)
    expect(computeBaseline(hr)).not.toBeNull()
  })

  test('every region of every seeded crew member starts green, so demo events tell the story', () => {
    const { crew, measurements } = generateCrew(42, NOW)
    for (const c of crew) {
      const readings = readAll(measurements.filter((m) => m.crewId === c.id))
      for (const region of REGIONS) {
        const status = regionStatus(region, readings)
        // radiationDose and symptomReport are intentionally unseeded, so 'body' stays driven by temperature alone.
        expect({ crew: c.id, region: region.id, status }).toEqual({ crew: c.id, region: region.id, status: 'green' })
      }
    }
  })

  test('emits check-in and exercise events for the same crew', () => {
    const { events } = generateCrew(42, NOW)
    expect(events.some((e) => e.kind === 'checkInComplete' && e.crewId === 'crew-1')).toBe(true)
    expect(events.some((e) => e.kind === 'exerciseComplete')).toBe(true)
    expect(events.every((e) => e.kind === 'checkInComplete' || e.kind === 'exerciseComplete')).toBe(true)
  })
})
