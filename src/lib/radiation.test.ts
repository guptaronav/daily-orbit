import { describe, expect, test } from 'vitest'
import { INDICATORS } from '../contract/types'
import {
  MISSION_DAYS_BEFORE_REPLAY,
  buildLedger,
  loadReplays,
  replayMeasurements,
  shelterPromptAt,
  startingDoseMSv,
  stepDoseRates,
  type Replay,
} from './radiation'

const replay = (over: Partial<Replay> = {}): Replay => ({
  id: 'test-SEP-001',
  onset: '2012-03-07T04:05:00Z',
  start: '2012-03-07T02:00:00Z',
  stepMinutes: 60,
  link: 'https://example.invalid',
  instruments: ['GOES13: SEM/EPS >10 MeV'],
  linkedEvents: [],
  reportCount: 1,
  quietRateMGyPerH: 0.01,
  doseRateMGyPerH: [0.01, 0.01, 0.5, 2, 1, 0.2],
  protonFluxPfu: [1, 1, 100, 4000, 900, 50],
  ...over,
})

describe('stepDoseRates', () => {
  test('a missing hour holds the last measured rate', () => {
    expect(stepDoseRates(replay({ doseRateMGyPerH: [0.01, null, 0.5, null, null, 0.2] }))).toEqual([0.01, 0.01, 0.5, 0.5, 0.5, 0.2])
  })

  test('missing hours before any measurement use the quiet rate', () => {
    expect(stepDoseRates(replay({ doseRateMGyPerH: [null, null, 0.5, 2, 1, 0.2] })).slice(0, 2)).toEqual([0.01, 0.01])
  })

  test('negative or non-finite rates count as zero', () => {
    expect(stepDoseRates(replay({ doseRateMGyPerH: [-1, Number.NaN, 0.5, 2, 1, 0.2] })).slice(0, 2)).toEqual([0, 0])
  })
})

describe('buildLedger', () => {
  test('starts from the mission-to-date dose at the quiet rate', () => {
    const r = replay()
    expect(startingDoseMSv(r)).toBeCloseTo(0.01 * 24 * MISSION_DAYS_BEFORE_REPLAY, 10)
    expect(buildLedger(r, 1)[0]).toBeCloseTo(startingDoseMSv(r) + 0.01, 10)
  })

  test('adds rate times step length for each step', () => {
    const r = replay()
    const ledger = buildLedger(r, 6)
    expect(ledger).toHaveLength(6)
    expect(ledger[5] - startingDoseMSv(r)).toBeCloseTo(0.01 + 0.01 + 0.5 + 2 + 1 + 0.2, 10)
  })

  test('step length scales the dose', () => {
    const half = replay({ stepMinutes: 30 })
    expect(buildLedger(half, 6)[5] - startingDoseMSv(half)).toBeCloseTo((0.01 + 0.01 + 0.5 + 2 + 1 + 0.2) / 2, 10)
  })

  test('never decreases, even with bad or missing rates', () => {
    const ledger = buildLedger(replay({ doseRateMGyPerH: [0.01, -5, null, Number.NaN, 2, -0.1] }), 6)
    for (let i = 1; i < ledger.length; i++) expect(ledger[i]).toBeGreaterThanOrEqual(ledger[i - 1])
  })

  test('steps is clamped to the replay length', () => {
    expect(buildLedger(replay(), 0)).toEqual([])
    expect(buildLedger(replay(), -3)).toEqual([])
    expect(buildLedger(replay(), 99)).toHaveLength(6)
  })
})

describe('shelterPromptAt', () => {
  test('is the step that contains the event onset', () => {
    expect(shelterPromptAt(replay())).toBe(2) // 04:05 falls in the 04:00 to 05:00 step
  })

  test('an onset exactly on a step boundary belongs to the step that starts there', () => {
    expect(shelterPromptAt(replay({ onset: '2012-03-07T03:00:00Z' }))).toBe(1)
  })

  test('is clamped to the replay window', () => {
    expect(shelterPromptAt(replay({ onset: '2012-03-01T00:00:00Z' }))).toBe(0)
    expect(shelterPromptAt(replay({ onset: '2012-04-01T00:00:00Z' }))).toBe(5)
  })
})

describe('replayMeasurements', () => {
  const r = replay()
  const ledger = buildLedger(r, 6)
  const end = Date.parse('2026-11-14T12:00:00Z')

  test('one simulated radiationDose record per step, cumulative, in mSv', () => {
    const ms = replayMeasurements({ replay: r, ledger, crewId: 'crew-1', fromStep: 0, toStep: 5, endMs: end })
    expect(ms).toHaveLength(6)
    for (const m of ms) {
      expect(m.indicator).toBe('radiationDose')
      expect(m.source).toBe('simulated')
      expect(m.unit).toBe('mSv')
      expect(m.crewId).toBe('crew-1')
      expect(m.quality).toEqual({ score: 1, passed: true })
    }
    expect(ms.map((m) => m.value)).toEqual(ledger.map((v) => Math.round(v * 1000) / 1000))
  })

  test('the last step lands on endMs and earlier steps are one step apart', () => {
    const ms = replayMeasurements({ replay: r, ledger, crewId: 'crew-1', fromStep: 0, toStep: 5, endMs: end })
    expect(ms[5].timestamp).toBe('2026-11-14T12:00:00.000Z')
    expect(ms[4].timestamp).toBe('2026-11-14T11:00:00.000Z')
  })

  test('ids depend only on crew and step so a new replay overwrites the old one', () => {
    const a = replayMeasurements({ replay: r, ledger, crewId: 'crew-2', fromStep: 3, toStep: 4, endMs: end })
    expect(a.map((m) => m.id)).toEqual(['radiation-replay-crew-2-3', 'radiation-replay-crew-2-4'])
  })

  test('an empty or reversed range writes nothing', () => {
    expect(replayMeasurements({ replay: r, ledger, crewId: 'crew-1', fromStep: 4, toStep: 3, endMs: end })).toEqual([])
  })
})

describe('bundled NASA replay data', () => {
  const replays = loadReplays()

  test('has at least one replay and radiationDose is a real indicator', () => {
    expect(replays.length).toBeGreaterThan(0)
    expect(INDICATORS).toContain('radiationDose')
  })

  test.each(replays.map((r) => [r.id, r] as const))('%s is well formed', (_id, r) => {
    expect(r.id).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}-SEP-\d{3}$/)
    expect(r.link).toMatch(/^https:\/\/ccmc\.gsfc\.nasa\.gov\/DONKI\/view\/SEP\//)
    expect(r.doseRateMGyPerH.length).toBe(r.protonFluxPfu.length)
    expect(r.doseRateMGyPerH.length).toBeGreaterThan(24)
    expect(r.quietRateMGyPerH).toBeGreaterThan(0)
    const onsetStep = shelterPromptAt(r)
    expect(onsetStep).toBeGreaterThan(0)
    expect(onsetStep).toBeLessThan(r.doseRateMGyPerH.length - 1)
  })

  test.each(replays.map((r) => [r.id, r] as const))('%s: the dose rate after onset rises above the quiet level', (_id, r) => {
    const rates = stepDoseRates(r)
    const peakAfter = Math.max(...rates.slice(shelterPromptAt(r)))
    expect(peakAfter).toBeGreaterThan(r.quietRateMGyPerH * 10)
  })
})
