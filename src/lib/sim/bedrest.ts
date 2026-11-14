import raw from '../../data/bedrest.json'
import type { DataLabel, GameEvent, Indicator, Measurement } from '../../contract/types'

// Real NASA bed-rest analog data for one de-identified participant, produced by scripts/import-bedrest.ts.
// It is ground analog data (head-down tilt), never in-flight data, and the app always says so.

type BedrestFile = {
  days: { day: number; phase: string; brDay: number | null }[]
  records: { day: number; indicator: Indicator; value: number | { symptoms: string[] }; unit: string; dataset: string }[]
}
const DATA = raw as unknown as BedrestFile

const DAY_MS = 86_400_000
const DAYS = DATA.days.length
const DOI = '10.83263/wjw1-ta27'

export const BEDREST_DATA_LABEL = 'NASA bed-rest analog data, de-identified (partly simulated)' satisfies DataLabel

/** Indicators this participant really has data for. Everything else for that crew member stays simulated. */
export const BEDREST_INDICATORS: ReadonlySet<Indicator> = new Set(DATA.records.map((r) => r.indicator))

/** The recorded days are re-dated so the last one is "now": a 30-day mission ending today. */
const stamp = (now: Date, day: number): string => new Date(now.getTime() - (DAYS - 1 - day) * DAY_MS).toISOString()

export function loadBedrestMeasurements(crewId: string, now: Date): Measurement[] {
  return DATA.records.map((r) => ({
    id: `${crewId}-bedrest-${r.indicator}-${r.day}`,
    crewId,
    timestamp: stamp(now, r.day),
    indicator: r.indicator,
    value: r.value,
    unit: r.unit,
    quality: { score: 1, passed: true },
    source: 'nasa-bedrest',
    sourceDatasetId: `doi:${DOI} (${r.dataset})`,
    standardMeasure: 'none',
  }))
}

/** Effort events that really happened in the logs: stretching sessions completed, symptoms reported. */
export function loadBedrestEvents(crewId: string, now: Date): GameEvent[] {
  const events: GameEvent[] = []
  for (const r of DATA.records) {
    if (r.indicator === 'exerciseMinutes') events.push({ id: `${crewId}-bedrest-ex-${r.day}`, crewId, timestamp: stamp(now, r.day), kind: 'exerciseComplete' })
    if (r.indicator === 'symptomReport') events.push({ id: `${crewId}-bedrest-sx-${r.day}`, crewId, timestamp: stamp(now, r.day), kind: 'symptomReported' })
  }
  return events
}
