import { INDICATORS, type Indicator, type Measurement, type Status } from '../contract/types'
import { computeBaseline, type Baseline } from './baseline'
import type { Region } from './regions'
import { getCategoricalStatus, getStatus } from './status'

export type IndicatorReading = {
  indicator: Indicator
  status: Status
  /** Latest reading that passed quality. Failed readings never become `latest`. */
  latest?: Measurement
  baseline: Baseline | null
  failedCount: number
  /** Every reading for this indicator, oldest first, including failed ones. */
  history: Measurement[]
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
  if (!latest) return { indicator, status: 'gray', baseline: null, failedCount, history }

  if (typeof latest.value !== 'number') {
    return { indicator, status: getCategoricalStatus(latest), latest, baseline: null, failedCount, history }
  }
  // Baseline excludes the latest reading so a sudden change is not diluted by itself.
  const prior = passed.slice(0, -1).flatMap((m) => (typeof m.value === 'number' ? [m.value] : []))
  const baseline = computeBaseline(prior)
  return { indicator, status: getStatus(latest, baseline), latest, baseline, failedCount, history }
}

export function readAll(measurements: readonly Measurement[]): Record<Indicator, IndicatorReading> {
  const byIndicator = new Map<Indicator, Measurement[]>()
  for (const m of measurements) byIndicator.set(m.indicator, [...(byIndicator.get(m.indicator) ?? []), m])
  return Object.fromEntries(INDICATORS.map((i) => [i, readIndicator(i, byIndicator.get(i) ?? [])])) as Record<Indicator, IndicatorReading>
}

export function regionStatus(region: Region, readings: Record<Indicator, IndicatorReading>): Status {
  return worstStatus(region.indicators.map((i) => readings[i].status))
}
