import { mulberry32 } from './rng'

/*
 * TWO SIMULATIONS. Nothing here is measured, observed or sourced from NASA.
 * Every number below is an assumption the screen lets you change, and the whole point of
 * showing them is that you can see the assumption that produced the result.
 * The same assumptions are written down in NOTES.md under "Simulated metrics".
 */

export type TimeAssumptions = {
  /** Minutes for one mirror check, start to finish. */
  mirrorCheckMin: number
  /** Minutes to log one indicator by hand: find the instrument, take it, write it down. */
  perIndicatorMin: number
  /** How many indicators one mirror check covers. */
  indicatorCount: number
  /** Fixed minutes to start a separate logging session at all (finding the tablet, the form). */
  setupMin: number
  crewSize: number
  missionDays: number
}

export type TimeResult = {
  mirrorMinPerCrewDay: number
  manualMinPerCrewDay: number
  /** Positive means the mirror check is cheaper. Can go negative if you make it slow enough. */
  savedMinPerCrewDay: number
  savedHoursPerMission: number
}

export const TIME_DEFAULTS: TimeAssumptions = {
  mirrorCheckMin: 3,
  perIndicatorMin: 1.5,
  indicatorCount: 9,
  setupMin: 2,
  crewSize: 4,
  missionDays: 180,
}

const round = (n: number, places = 1): number => {
  const f = 10 ** places
  return Math.round(n * f) / f
}

const clamp = (n: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, n))

/**
 * Crew minutes per person per day: one mirror check against logging each indicator separately.
 * Deliberately simple and linear, because an elaborate model would only hide the assumptions.
 */
export function crewMinutesPerDay(a: TimeAssumptions): TimeResult {
  const mirror = Math.max(0, a.mirrorCheckMin)
  const manual = Math.max(0, a.setupMin) + Math.max(0, a.perIndicatorMin) * Math.max(0, a.indicatorCount)
  const saved = manual - mirror
  return {
    mirrorMinPerCrewDay: round(mirror),
    manualMinPerCrewDay: round(manual),
    savedMinPerCrewDay: round(saved),
    savedHoursPerMission: round((saved * Math.max(0, a.crewSize) * Math.max(0, a.missionDays)) / 60),
  }
}

export type ReportingAssumptions = {
  days: number
  crewSize: number
  /** Chance that a given person on a given day has something worth reporting. */
  badDayProb: number
  /** Chance that a person does the check at all on a given day, before any scoring effect. */
  complianceProb: number
  /**
   * Chance a person hides a bad day when the score rewards healthy VALUES.
   * This is the whole behavioral claim, and it is an assumption, not a finding.
   */
  underReportProb: number
  seed: number
}

export type ReportingResult = {
  /** Share of person-days reported, 0 to 1. */
  effort: number
  value: number
  effortReports: number
  valueReports: number
  opportunities: number
  /** Bad days that went unreported under value-based scoring. */
  hiddenBadDays: number
}

export const REPORTING_DEFAULTS: ReportingAssumptions = {
  days: 30,
  crewSize: 4,
  badDayProb: 0.25,
  complianceProb: 0.85,
  underReportProb: 0.4,
  seed: 42,
}

/**
 * Reporting completeness over a mission window under two scoring schemes.
 *
 * Model, in one sentence: on each person-day someone either does the check or does not; if they
 * do, and it is a bad day, and the score rewards healthy values, they may skip reporting it.
 * Rewarding effort removes that last step, so it can only ever report more, never less.
 *
 * Both arms are evaluated from the SAME three random draws per person-day, so with
 * underReportProb = 0 the two arms are identical rather than merely close. Deterministic in `seed`.
 */
export function reportingCompleteness(a: ReportingAssumptions): ReportingResult {
  const days = Math.max(0, Math.floor(a.days))
  const crewSize = Math.max(0, Math.floor(a.crewSize))
  const badDayProb = clamp(a.badDayProb, 0, 1)
  const complianceProb = clamp(a.complianceProb, 0, 1)
  const underReportProb = clamp(a.underReportProb, 0, 1)

  const rand = mulberry32(a.seed)
  const opportunities = days * crewSize
  let effortReports = 0
  let valueReports = 0
  let hiddenBadDays = 0

  for (let i = 0; i < opportunities; i++) {
    const doesCheck = rand() < complianceProb
    const badDay = rand() < badDayProb
    const hides = rand() < underReportProb
    if (!doesCheck) continue
    effortReports++
    if (badDay && hides) hiddenBadDays++
    else valueReports++
  }

  return {
    effort: opportunities === 0 ? 0 : effortReports / opportunities,
    value: opportunities === 0 ? 0 : valueReports / opportunities,
    effortReports,
    valueReports,
    opportunities,
    hiddenBadDays,
  }
}

export const asPercent = (fraction: number): number => round(fraction * 100)
