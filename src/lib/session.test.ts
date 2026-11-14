import { describe, expect, test } from 'vitest'
import type { Quality } from '../contract/types'
import { buildSessionRecords, type MirrorSession } from './session'

const NOW = new Date('2026-11-14T15:00:00Z')
const GOOD: Quality = { score: 0.9, passed: true }
const BAD: Quality = { score: 0.1, passed: false, reason: 'lighting' }
const EYE = { distortion: false, distortedCells: 0, fraction: 0, centralAffected: false }

const full: MirrorSession = {
  sessionId: 's1',
  heartRate: { bpm: 64, quality: GOOD, source: 'camera' },
  blink: { blinkRate: 15, eyelidClosurePct: 4, quality: GOOD, source: 'camera' },
  selfReport: { sleepQuality: 6, mood: 7, stress: 3 },
  amsler: { left: EYE, right: EYE },
  acuity: { logMar: 0.1 },
  symptoms: { symptoms: [] },
}

const kinds = (s: MirrorSession) => buildSessionRecords(s, 'crew-1', NOW).events.map((e) => e.kind)

describe('buildSessionRecords', () => {
  test('a full session yields one measurement per indicator, all tied to the session and crew', () => {
    const { measurements } = buildSessionRecords(full, 'crew-1', NOW)
    expect(measurements.map((m) => m.indicator).sort()).toEqual(
      ['amslerDistortion', 'blinkRate', 'eyelidClosure', 'heartRate', 'mood', 'nearAcuity', 'sleepQuality', 'stress', 'symptomReport'].sort(),
    )
    expect(measurements.every((m) => m.sessionId === 's1' && m.crewId === 'crew-1' && m.timestamp === NOW.toISOString())).toBe(true)
    expect(new Set(measurements.map((m) => m.id)).size).toBe(measurements.length)
  })

  test('a failed heart-rate reading is still saved, flagged as failed (honesty is recorded)', () => {
    const { measurements } = buildSessionRecords({ ...full, heartRate: { bpm: null, quality: BAD, source: 'camera' } }, 'crew-1', NOW)
    const hr = measurements.find((m) => m.indicator === 'heartRate')!
    expect(hr.quality).toEqual(BAD)
    expect(hr.value).toBe(0)
  })

  test('camera-derived readings use source camera, sample-video readings are labeled simulated', () => {
    const real = buildSessionRecords(full, 'crew-1', NOW).measurements
    expect(real.find((m) => m.indicator === 'heartRate')!.source).toBe('camera')
    const sample = buildSessionRecords({ ...full, heartRate: { bpm: 64, quality: GOOD, source: 'simulated' } }, 'crew-1', NOW).measurements
    expect(sample.find((m) => m.indicator === 'heartRate')!.source).toBe('simulated')
  })

  test('self-report sliders are saved as selfReport', () => {
    const m = buildSessionRecords(full, 'crew-1', NOW).measurements.find((x) => x.indicator === 'mood')!
    expect(m.source).toBe('selfReport')
    expect(m.value).toBe(7)
  })

  test('gut, nutrition and sleep-hours answers are saved with units and source selfReport', () => {
    const s: MirrorSession = { sessionId: 's9', selfReport: { sleepHours: 6.5, appetite: 4, digestiveComfort: 7 } }
    const ms = buildSessionRecords(s, 'crew-1', NOW).measurements
    const by = (i: string) => ms.find((m) => m.indicator === i)!
    expect(by('sleepHours')).toMatchObject({ value: 6.5, unit: 'h', source: 'selfReport' })
    expect(by('appetite')).toMatchObject({ value: 4, unit: '0-10' })
    expect(by('digestiveComfort')).toMatchObject({ value: 7, unit: '0-10' })
  })

  test('questions the person did not answer are not saved (no invented defaults)', () => {
    const ms = buildSessionRecords({ sessionId: 's10', selfReport: { mood: 8 } }, 'crew-1', NOW).measurements
    expect(ms.map((m) => m.indicator)).toEqual(['mood'])
  })

  test('amsler combines both eyes: distortion if either eye reports it', () => {
    const left = { ...EYE, distortion: true, distortedCells: 4, fraction: 0.04 }
    const m = buildSessionRecords({ ...full, amsler: { left, right: EYE } }, 'crew-1', NOW).measurements.find((x) => x.indicator === 'amslerDistortion')!
    expect(m.value).toMatchObject({ distortion: true, distortedCells: 4 })
  })

  test('an unreadable acuity check is saved as a failed reading, not judged', () => {
    const { measurements, events } = buildSessionRecords({ ...full, acuity: { logMar: 1.1, readable: false } }, 'crew-1', NOW)
    const m = measurements.find((x) => x.indicator === 'nearAcuity')!
    expect(m.quality).toMatchObject({ passed: false, reason: 'other' })
    expect(events.some((e) => e.kind === 'checkInComplete')).toBe(true)
  })

  test('a readable acuity check passes quality', () => {
    const m = buildSessionRecords({ ...full, acuity: { logMar: 0.3, readable: true } }, 'crew-1', NOW).measurements.find((x) => x.indicator === 'nearAcuity')!
    expect(m.quality.passed).toBe(true)
  })

  test('only parts of the session that happened are saved', () => {
    const { measurements } = buildSessionRecords({ sessionId: 's2', selfReport: full.selfReport }, 'crew-1', NOW)
    expect(measurements.map((m) => m.indicator).sort()).toEqual(['mood', 'sleepQuality', 'stress'])
  })
})

describe('buildSessionRecords events (effort, never health values)', () => {
  test('every session earns exactly one checkInComplete, even with every reading failed', () => {
    const allBad: MirrorSession = { ...full, heartRate: { bpm: null, quality: BAD, source: 'camera' }, blink: { blinkRate: 0, eyelidClosurePct: 0, quality: BAD, source: 'camera' } }
    expect(kinds(allBad).filter((k) => k === 'checkInComplete')).toHaveLength(1)
  })

  test('good and bad health values produce identical events', () => {
    const goodDay = { ...full, selfReport: { sleepQuality: 9, mood: 9, stress: 1 }, heartRate: { bpm: 58, quality: GOOD, source: 'camera' as const } }
    const badDay = { ...full, selfReport: { sleepQuality: 2, mood: 2, stress: 9 }, heartRate: { bpm: 130, quality: GOOD, source: 'camera' as const } }
    expect(kinds(badDay)).toEqual(kinds(goodDay))
  })

  test('a symptom report earns symptomReported', () => {
    expect(kinds({ ...full, symptoms: { symptoms: ['headache'] } })).toContain('symptomReported')
    expect(kinds({ ...full, symptoms: { symptoms: [], note: 'odd taste in mouth' } })).toContain('symptomReported')
  })

  test('answering "no symptoms" is saved but earns no symptomReported credit', () => {
    const records = buildSessionRecords({ ...full, symptoms: { symptoms: [] } }, 'crew-1', NOW)
    expect(records.measurements.some((m) => m.indicator === 'symptomReport')).toBe(true)
    expect(records.events.some((e) => e.kind === 'symptomReported')).toBe(false)
  })

  test('retakeAfterQualityFail is earned only when flagged', () => {
    expect(kinds(full)).not.toContain('retakeAfterQualityFail')
    expect(kinds({ ...full, retookAfterQualityFail: true })).toContain('retakeAfterQualityFail')
  })
})
