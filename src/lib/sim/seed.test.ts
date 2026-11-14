import { describe, expect, test } from 'vitest'
import { computeBaseline } from '../baseline'
import { readAll, regionStatus } from '../bodyStatus'
import { REGIONS } from '../regions'
import { BEDREST_DATA_LABEL, BEDREST_INDICATORS } from './bedrest'
import { generateCrew } from './seed'

const NOW = new Date('2026-11-14T12:00:00Z')

describe('generateCrew', () => {
  test('is deterministic for the same seed and differs for another', () => {
    const a = generateCrew(42, NOW)
    expect(generateCrew(42, NOW)).toEqual(a)
    expect(generateCrew(43, NOW)).not.toEqual(a)
  })

  test('returns three crew plus a guest; Crew 3 says it is partly real NASA bed-rest data, the rest are simulated', () => {
    const { crew } = generateCrew(42, NOW)
    expect(crew.map((c) => c.id)).toEqual(['crew-1', 'crew-2', 'crew-3', 'guest'])
    expect(crew.filter((c) => c.id !== 'crew-3').every((c) => c.dataLabel === 'Simulated data')).toBe(true)
    expect(crew.find((c) => c.id === 'crew-3')!.dataLabel).toBe(BEDREST_DATA_LABEL)
  })

  test('Crew 3: real NASA data for the indicators it has, simulated for the rest, never mixed within one indicator', () => {
    const { measurements } = generateCrew(42, NOW)
    const mine = measurements.filter((m) => m.crewId === 'crew-3')
    const sourcesByIndicator = new Map<string, Set<string>>()
    for (const m of mine) sourcesByIndicator.set(m.indicator, (sourcesByIndicator.get(m.indicator) ?? new Set()).add(m.source))
    for (const [indicator, sources] of sourcesByIndicator) {
      expect(sources.size, indicator).toBe(1)
      expect(sources.has('nasa-bedrest'), indicator).toBe(BEDREST_INDICATORS.has(indicator as never))
    }
    expect(mine.filter((m) => m.source === 'nasa-bedrest').every((m) => m.sourceDatasetId?.includes('10.83263/wjw1-ta27'))).toBe(true)
  })

  test('Crew 3 exercise events come from the real stretch log, not the simulation', () => {
    const { events, measurements } = generateCrew(42, NOW)
    const realDays = new Set(measurements.filter((m) => m.crewId === 'crew-3' && m.indicator === 'exerciseMinutes').map((m) => m.timestamp))
    const exercise = events.filter((e) => e.crewId === 'crew-3' && e.kind === 'exerciseComplete')
    expect(exercise.length).toBe(realDays.size)
    expect(exercise.every((e) => realDays.has(e.timestamp))).toBe(true)
  })

  test('the guest starts with no history so they build their own baseline, not a fake one', () => {
    const { measurements, events } = generateCrew(42, NOW)
    expect(measurements.some((m) => m.crewId === 'guest')).toBe(false)
    expect(events.some((e) => e.crewId === 'guest')).toBe(false)
  })

  test('each seeded crew member has about 30 days of passed, simulated sleepHours', () => {
    const { crew, measurements } = generateCrew(42, NOW)
    for (const c of crew.filter((x) => x.id !== 'guest')) {
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
    // Crew 3 runs on real bed-rest data, which really changes (body mass falls under head-down tilt), so it is not forced green.
    for (const c of crew.filter((x) => x.id !== 'guest' && x.id !== 'crew-3')) {
      const readings = readAll(measurements.filter((m) => m.crewId === c.id))
      for (const region of REGIONS) {
        const status = regionStatus(region, readings)
        // radiationDose and symptomReport are intentionally unseeded, so 'body' stays driven by temperature alone.
        expect({ crew: c.id, region: region.id, status }).toEqual({ crew: c.id, region: region.id, status: 'green' })
      }
    }
  })

  test('every indicator the app defines except radiation and symptoms is seeded, including gut and nutrition', () => {
    const { measurements } = generateCrew(42, NOW)
    const seeded = new Set(measurements.filter((m) => m.crewId === 'crew-1').map((m) => m.indicator))
    for (const i of ['appetite', 'digestiveComfort', 'bodyMass', 'bloodSugar', 'eyelidClosure', 'sleepHours', 'bloodPressureSys']) {
      expect(seeded.has(i as never), i).toBe(true)
    }
  })

  test('emits check-in and exercise events for the same crew', () => {
    const { events } = generateCrew(42, NOW)
    expect(events.some((e) => e.kind === 'checkInComplete' && e.crewId === 'crew-1')).toBe(true)
    expect(events.some((e) => e.kind === 'exerciseComplete')).toBe(true)
    // Symptom reports exist only for Crew 3, and only because the real NASA symptom log recorded them.
    expect(events.every((e) => e.kind === 'checkInComplete' || e.kind === 'exerciseComplete' || (e.crewId === 'crew-3' && e.kind === 'symptomReported'))).toBe(true)
  })
})
