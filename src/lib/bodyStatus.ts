import { INDICATORS, type Indicator, type Measurement, type Status } from '../contract/types'
import { computeBaseline, type Baseline } from './baseline'
import type { Region } from './regions'
import { getCategoricalStatus, getStatus } from './status'
import { detectDrift, referenceBaseline, type Drift } from './trend'

export type IndicatorReading = {
  indicator: Indicator
  status: Status
  /** Latest reading that passed quality. Failed readings never become `latest`. */
  latest?: Measurement
  baseline: Baseline | null
  /** Earlier quality-passed numeric readings available for the baseline (excludes the latest). */
  priorCount: number
  failedCount: number
  /** Every reading for this indicator, oldest first, including failed ones. */
  history: Measurement[]
  /** The frozen reference from the first two weeks, once there is one (lib/trend.ts). */
  reference?: Baseline | null
  /** A steady slide over the last few readings, if there is one. */
  drift?: Drift | null
  /** What set the status: the recent baseline, the fixed reference, or a steady slide. */
  basis?: 'recent' | 'reference' | 'drift'
}

const SEVERITY: Record<Status, number> = { gray: 0, green: 1, yellow: 2, red: 3 }

export function worstStatus(statuses: readonly Status[]): Status {
  return statuses.reduce<Status>((worst, s) => (SEVERITY[s] > SEVERITY[worst] ? s : worst), 'gray')
}

export function readIndicator(indicator: Indicator, all: readonly Measurement[]): IndicatorReading {
  const history = all.filter((m) => m.indicator === indicator).sort((a, b) => a.timestamp.localeCompare(b.timestamp))
  const passed = history.filter((m) => m.quality.passed)
  const failedCount = history.length - passed.length
  const latest = passed.at(-1)
  if (!latest) return { indicator, status: 'gray', baseline: null, priorCount: 0, failedCount, history }

  if (typeof latest.value !== 'number') {
    return { indicator, status: getCategoricalStatus(latest), latest, baseline: null, priorCount: 0, failedCount, history }
  }
  // Baseline excludes the latest reading so a sudden change is not diluted by itself.
  const prior = passed.slice(0, -1).flatMap((m) => (typeof m.value === 'number' ? [m.value] : []))
  const baseline = computeBaseline(prior)
  const points = passed.flatMap((m) => (typeof m.value === 'number' ? [{ t: Date.parse(m.timestamp), v: m.value }] : []))
  const latestT = Date.parse(latest.timestamp)
  const reference = referenceBaseline(points, latestT)
  const recent = getStatus(latest, baseline)
  const vsReference = reference ? getStatus(latest, reference) : 'gray'
  // A gradual change can hide from the rolling baseline but not from the frozen reference.
  let status = worstStatus([recent, vsReference])
  let basis: IndicatorReading['basis'] = SEVERITY[vsReference] > SEVERITY[recent] ? 'reference' : 'recent'
  // A steady slide is worth watching even while each single reading still looks normal.
  const drift = recent === 'gray' ? null : detectDrift(points, reference ?? baseline)
  if (drift && status === 'green') {
    status = 'yellow'
    basis = 'drift'
  }
  return { indicator, status, latest, baseline, priorCount: prior.length, failedCount, history, reference, drift, basis }
}

export function readAll(measurements: readonly Measurement[]): Record<Indicator, IndicatorReading> {
  const byIndicator = new Map<Indicator, Measurement[]>()
  for (const m of measurements) byIndicator.set(m.indicator, [...(byIndicator.get(m.indicator) ?? []), m])
  return Object.fromEntries(INDICATORS.map((i) => [i, readIndicator(i, byIndicator.get(i) ?? [])])) as Record<Indicator, IndicatorReading>
}

export function regionStatus(region: Region, readings: Record<Indicator, IndicatorReading>): Status {
  return worstStatus(region.indicators.map((i) => readings[i].status))
}
