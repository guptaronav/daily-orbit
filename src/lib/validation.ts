import type { Indicator, Measurement, Status } from '../contract/types'
import { computeBaseline } from './baseline'
import { readIndicator } from './bodyStatus'
import { getStatus } from './status'

/*
 * An honest check of the flagging rules on real NASA data: one de-identified participant in a
 * head-down-tilt bed-rest study (src/data/bedrest.json), 12 baseline days then 18 days of tilt.
 *
 * - During the baseline nothing is being done to the person, so any flag there is a false alarm.
 * - During tilt, body mass really falls (seen in the raw data), so that is the change to catch.
 *
 * Both the old rule (rolling baseline only) and the current rule (rolling baseline, fixed
 * reference and steady-slide detection, lib/trend.ts) are replayed day by day, using only the
 * readings available on that day. One person, one ground analog: this is a sanity check, not a
 * clinical validation, and it is reported that way.
 */

export type BedrestRecord = { day: number; indicator: string; value: unknown }
export type BedrestDay = { day: number; phase: string }

const NUMERIC: Indicator[] = ['heartRate', 'bloodPressureSys', 'bloodPressureDia', 'bodyMass', 'temperature', 'bowelMovements']
const DAY_MS = 86_400_000
const T0 = Date.parse('2026-01-01T08:00:00Z')

const off = (s: Status) => s === 'yellow' || s === 'red'

function oldRule(history: Measurement[]): Status {
  const passed = history.filter((m) => m.quality.passed && typeof m.value === 'number')
  const latest = passed.at(-1)
  if (!latest) return 'gray'
  return getStatus(latest, computeBaseline(passed.slice(0, -1).map((m) => m.value as number)))
}

export type RuleResult = {
  /** Flagged indicator-days during the baseline, out of indicator-days that could be judged. */
  baselineFlags: number
  baselineJudged: number
  /** First tilt day (counting from 1) on which body mass was flagged, or null if never. */
  bodyMassFirstTiltDay: number | null
  /** Tilt days with body mass flagged, out of tilt days judged. */
  bodyMassTiltFlags: number
  bodyMassTiltJudged: number
  /** The same, counting only red ("Act"). */
  baselineRed: number
  bodyMassFirstRedTiltDay: number | null
  bodyMassTiltRed: number
}

export type ValidationResult = { participantDays: number; baselineDays: number; tiltDays: number; indicators: Indicator[]; old: RuleResult; current: RuleResult }

export function validateOnBedrest(records: readonly BedrestRecord[], days: readonly BedrestDay[]): ValidationResult {
  const phase = new Map(days.map((d) => [d.day, d.phase]))
  const tiltStart = Math.min(...days.filter((d) => d.phase === 'IN_TEST').map((d) => d.day))
  const byInd = new Map<Indicator, Measurement[]>()
  for (const r of records) {
    if (!NUMERIC.includes(r.indicator as Indicator) || typeof r.value !== 'number') continue
    const m: Measurement = { id: `${r.indicator}-${r.day}`, crewId: 'v', timestamp: new Date(T0 + r.day * DAY_MS).toISOString(), indicator: r.indicator as Indicator, value: r.value, quality: { score: 1, passed: true }, source: 'manual' }
    byInd.set(m.indicator, [...(byInd.get(m.indicator) ?? []), m])
  }

  const run = (judge: (ind: Indicator, h: Measurement[]) => Status): RuleResult => {
    const res: RuleResult = { baselineFlags: 0, baselineJudged: 0, bodyMassFirstTiltDay: null, bodyMassTiltFlags: 0, bodyMassTiltJudged: 0, baselineRed: 0, bodyMassFirstRedTiltDay: null, bodyMassTiltRed: 0 }
    for (const d of days) {
      for (const ind of NUMERIC) {
        const h = (byInd.get(ind) ?? []).filter((m) => Date.parse(m.timestamp) <= T0 + d.day * DAY_MS).sort((a, b) => a.timestamp.localeCompare(b.timestamp))
        if (!h.length || Date.parse(h[h.length - 1].timestamp) !== T0 + d.day * DAY_MS) continue
        const s = judge(ind, h)
        if (s === 'gray') continue
        if (phase.get(d.day) === 'PRE_TEST') {
          res.baselineJudged++
          if (off(s)) res.baselineFlags++
          if (s === 'red') res.baselineRed++
        } else if (ind === 'bodyMass') {
          res.bodyMassTiltJudged++
          if (off(s)) {
            res.bodyMassTiltFlags++
            if (res.bodyMassFirstTiltDay === null) res.bodyMassFirstTiltDay = d.day - tiltStart + 1
          }
          if (s === 'red') {
            res.bodyMassTiltRed++
            if (res.bodyMassFirstRedTiltDay === null) res.bodyMassFirstRedTiltDay = d.day - tiltStart + 1
          }
        }
      }
    }
    return res
  }

  return {
    participantDays: days.length,
    baselineDays: days.filter((d) => d.phase === 'PRE_TEST').length,
    tiltDays: days.filter((d) => d.phase === 'IN_TEST').length,
    indicators: NUMERIC,
    old: run((_ind, h) => oldRule(h)),
    current: run((ind, h) => readIndicator(ind, h).status),
  }
}
