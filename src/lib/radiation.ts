import type { Measurement } from '../contract/types'
import raw from '../data/donki-sep.json'

// Radiation replay: a real historical solar particle event (NASA DONKI) replayed on a SIMULATED vehicle.
// The dose ledger is a labeled simulation, not dosimetry. Formula and assumptions are in NOTES.md.

/** One replayable event, built at build time by scripts/fetch-donki.ts. Arrays hold one value per step. */
export type Replay = {
  /** DONKI SEP id of the first near-Earth (GOES) report. */
  id: string
  /** Time of that first report, ISO UTC. */
  onset: string
  /** Time of step 0, ISO UTC. */
  start: string
  stepMinutes: number
  link: string
  instruments: string[]
  linkedEvents: string[]
  reportCount: number
  /** Median measured dose rate in the hours before onset. */
  quietRateMGyPerH: number
  /** Measured dose rate at lunar orbit (LRO CRaTER D3/D4); null where the hour has no measurement. */
  doseRateMGyPerH: (number | null)[]
  /** Measured >10 MeV proton flux near Earth (GOES); shown for context, not used in the dose. */
  protonFluxPfu: (number | null)[]
}

export type ReplaySources = {
  events: { name: string; endpoint: string; range: string[] }
  doseRate: { name: string; endpoint: string; unit: string }
  protonFlux: { name: string; endpoint: string; unit: string }
}

/** Assumption: the simulated mission is this many days old when the replay starts. */
export const MISSION_DAYS_BEFORE_REPLAY = 30
/** Assumption: 1 mGy of absorbed dose is counted as 1 mSv (no radiation quality factor applied). */
export const MSV_PER_MGY = 1

export const loadReplays = (): Replay[] => raw.replays as Replay[]
export const replaySources = (): ReplaySources => raw.sources as ReplaySources
export const donkiEventCount = (): number => raw.eventCount
export const replayDataGeneratedAt = (): string => raw.generatedAt

const usable = (v: number | null): v is number => typeof v === 'number' && Number.isFinite(v)

/** Dose rate for every step. A missing hour holds the last measured rate (the quiet rate if none yet); bad values count as zero. */
export function stepDoseRates(replay: Replay): number[] {
  let last = Math.max(replay.quietRateMGyPerH, 0)
  return replay.doseRateMGyPerH.map((v) => {
    if (v === null) return last
    last = usable(v) ? Math.max(v, 0) : 0
    return last
  })
}

/** Simulated dose already on the ledger when the replay starts: the quiet rate for the whole mission so far. */
export function startingDoseMSv(replay: Replay): number {
  return Math.max(replay.quietRateMGyPerH, 0) * 24 * MISSION_DAYS_BEFORE_REPLAY * MSV_PER_MGY
}

/**
 * Cumulative SIMULATED dose in mSv at the end of each of the first `steps` steps.
 * dose[i] = starting dose + sum over steps 0..i of (measured rate in mGy/h x step hours x MSV_PER_MGY). Never decreases.
 */
export function buildLedger(replay: Replay, steps: number): number[] {
  const rates = stepDoseRates(replay)
  const count = Math.max(0, Math.min(Math.floor(steps), rates.length))
  const stepHours = replay.stepMinutes / 60
  const ledger: number[] = []
  let total = startingDoseMSv(replay)
  for (let i = 0; i < count; i++) {
    total += rates[i] * stepHours * MSV_PER_MGY
    ledger.push(total)
  }
  return ledger
}

/** The step that contains the event onset: the shelter prompt appears from this step on. */
export function shelterPromptAt(replay: Replay): number {
  const stepMs = replay.stepMinutes * 60_000
  const step = Math.floor((Date.parse(replay.onset) - Date.parse(replay.start)) / stepMs)
  return Math.max(0, Math.min(step, replay.doseRateMGyPerH.length - 1))
}

export const replayMeasurementId = (crewId: string, step: number) => `radiation-replay-${crewId}-${step}`

/**
 * radiationDose records for steps fromStep..toStep (inclusive). Timestamps are remapped so the last step
 * of the whole replay lands on `endMs`; ids depend only on crew and step so a new replay overwrites the old one.
 */
export function replayMeasurements(args: {
  replay: Replay
  ledger: readonly number[]
  crewId: string
  fromStep: number
  toStep: number
  endMs: number
}): Measurement[] {
  const { replay, ledger, crewId, fromStep, toStep, endMs } = args
  const stepMs = replay.stepMinutes * 60_000
  const lastStep = replay.doseRateMGyPerH.length - 1
  const out: Measurement[] = []
  for (let step = Math.max(fromStep, 0); step <= Math.min(toStep, ledger.length - 1); step++) {
    out.push({
      id: replayMeasurementId(crewId, step),
      crewId,
      timestamp: new Date(endMs - (lastStep - step) * stepMs).toISOString(),
      indicator: 'radiationDose',
      value: Math.round(ledger[step] * 1000) / 1000,
      unit: 'mSv',
      quality: { score: 1, passed: true },
      source: 'simulated',
      standardMeasure: 'none',
    })
  }
  return out
}
