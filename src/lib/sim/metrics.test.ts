import { describe, expect, it } from 'vitest'
import {
  asPercent,
  crewMinutesPerDay,
  REPORTING_DEFAULTS,
  reportingCompleteness,
  TIME_DEFAULTS,
  type ReportingAssumptions,
} from './metrics'

describe('crewMinutesPerDay', () => {
  it('counts a fixed setup cost plus one slot per indicator for manual logging', () => {
    const r = crewMinutesPerDay({ ...TIME_DEFAULTS, setupMin: 2, perIndicatorMin: 1.5, indicatorCount: 9, mirrorCheckMin: 3 })
    expect(r.manualMinPerCrewDay).toBe(15.5)
    expect(r.mirrorMinPerCrewDay).toBe(3)
    expect(r.savedMinPerCrewDay).toBe(12.5)
  })

  it('scales the mission saving by crew size and mission length', () => {
    const r = crewMinutesPerDay({ ...TIME_DEFAULTS, crewSize: 2, missionDays: 10 })
    expect(r.savedHoursPerMission).toBeCloseTo((r.savedMinPerCrewDay * 2 * 10) / 60, 1)
    const twice = crewMinutesPerDay({ ...TIME_DEFAULTS, crewSize: 4, missionDays: 10 })
    expect(twice.savedHoursPerMission).toBeCloseTo(r.savedHoursPerMission * 2, 0) // both ends rounded to 0.1 h
  })

  it('collapses to the setup cost when there is nothing to log', () => {
    expect(crewMinutesPerDay({ ...TIME_DEFAULTS, indicatorCount: 0 }).manualMinPerCrewDay).toBe(TIME_DEFAULTS.setupMin)
  })

  it('reports a negative saving honestly when the mirror check is the slower option', () => {
    const r = crewMinutesPerDay({ ...TIME_DEFAULTS, mirrorCheckMin: 60 })
    expect(r.savedMinPerCrewDay).toBeLessThan(0)
    expect(r.savedHoursPerMission).toBeLessThan(0)
  })

  it('treats negative inputs as zero instead of inventing time', () => {
    const r = crewMinutesPerDay({ ...TIME_DEFAULTS, mirrorCheckMin: -5, perIndicatorMin: -1 })
    expect(r.mirrorMinPerCrewDay).toBe(0)
    expect(r.manualMinPerCrewDay).toBe(TIME_DEFAULTS.setupMin)
  })
})

describe('reportingCompleteness', () => {
  const run = (over: Partial<ReportingAssumptions> = {}) => reportingCompleteness({ ...REPORTING_DEFAULTS, ...over })

  it('is deterministic for a given seed', () => {
    expect(run({ seed: 7 })).toEqual(run({ seed: 7 }))
  })

  it('rewarding effort is never worse than rewarding values, across many seeds', () => {
    for (let seed = 0; seed < 40; seed++) {
      const r = run({ seed })
      expect(r.effort, `seed ${seed}`).toBeGreaterThanOrEqual(r.value)
    }
  })

  it('is strictly better than value-based scoring once anyone hides a bad day', () => {
    const r = run({ underReportProb: 0.6, seed: 3 })
    expect(r.hiddenBadDays).toBeGreaterThan(0)
    expect(r.effort).toBeGreaterThan(r.value)
    expect(r.effortReports - r.valueReports).toBe(r.hiddenBadDays)
  })

  it('the two schemes are identical when nobody hides anything', () => {
    for (let seed = 0; seed < 10; seed++) {
      const r = run({ underReportProb: 0, seed })
      expect(r.effort).toBe(r.value)
      expect(r.hiddenBadDays).toBe(0)
    }
  })

  it('also matches when there are no bad days to hide', () => {
    const r = run({ badDayProb: 0 })
    expect(r.effort).toBe(r.value)
  })

  it('stays within 0 and 1 at the extremes', () => {
    for (const a of [run({ complianceProb: 0 }), run({ complianceProb: 1 }), run({ complianceProb: 1, badDayProb: 1, underReportProb: 1 })]) {
      expect(a.effort).toBeGreaterThanOrEqual(0)
      expect(a.effort).toBeLessThanOrEqual(1)
      expect(a.value).toBeGreaterThanOrEqual(0)
      expect(a.value).toBeLessThanOrEqual(1)
    }
    expect(run({ complianceProb: 1 }).effort).toBe(1)
    expect(run({ complianceProb: 1, badDayProb: 1, underReportProb: 1 }).value).toBe(0)
  })

  it('clamps out-of-range probabilities instead of producing nonsense', () => {
    expect(run({ complianceProb: 5 }).effort).toBe(1)
    expect(run({ underReportProb: -3 })).toEqual(run({ underReportProb: 0 }))
  })

  it('handles an empty window without dividing by zero', () => {
    const r = run({ days: 0 })
    expect(r).toMatchObject({ opportunities: 0, effort: 0, value: 0 })
  })
})

describe('asPercent', () => {
  it('rounds to one decimal place', () => {
    expect(asPercent(0.8567)).toBe(85.7)
    expect(asPercent(1)).toBe(100)
  })
})
