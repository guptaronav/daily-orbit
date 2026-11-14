import { getThreshold } from '../config/thresholds'
import type { GameEvent, Indicator, Measurement, Quality } from '../contract/types'

// Builders for the demo control panel. They create ordinary, clearly "simulated" records so the
// real status, escalation and gamification code reacts exactly as it would to real data.

const MINUTE = 60_000
const DAY = 86_400_000

export const SLEEP_STEP_HOURS = 0.8
export const SLEEP_STEP_QUALITY = 1
const SLEEP_FLOOR_HOURS = 2.5
const SLEEP_FLOOR_QUALITY = 1
const DEFAULT_HOURS = 7
const DEFAULT_QUALITY = 7

type Ctx = { crewId: string; now: Date }
const PASSED: Quality = { score: 1, passed: true }

/** A timestamp newer than anything already stored, even if the latest reading is from this very moment. */
function stampAfter(now: Date, ...latest: (Measurement | undefined)[]): string {
  return new Date(Math.max(now.getTime(), ...latest.map((l) => (l ? Date.parse(l.timestamp) + MINUTE : 0)))).toISOString()
}

function make(ctx: Ctx, indicator: Indicator, value: Measurement['value'], timestamp: string, quality: Quality = PASSED): Measurement {
  return { id: crypto.randomUUID(), crewId: ctx.crewId, timestamp, indicator, value, unit: getThreshold(indicator).unit, quality, source: 'simulated' }
}

const numberOr = (m: Measurement | undefined, fallback: number): number => (typeof m?.value === 'number' ? m.value : fallback)

/** One more night of worse sleep. Click twice and the head goes yellow, then red. */
export function sleepDeclineStep({ crewId, now, latest }: Ctx & { latest: { sleepHours?: Measurement; sleepQuality?: Measurement } }): Measurement[] {
  const ts = stampAfter(now, latest.sleepHours, latest.sleepQuality)
  const hours = Math.max(SLEEP_FLOOR_HOURS, numberOr(latest.sleepHours, DEFAULT_HOURS) - SLEEP_STEP_HOURS)
  const quality = Math.max(SLEEP_FLOOR_QUALITY, numberOr(latest.sleepQuality, DEFAULT_QUALITY) - SLEEP_STEP_QUALITY)
  return [make({ crewId, now }, 'sleepHours', Math.round(hours * 10) / 10, ts), make({ crewId, now }, 'sleepQuality', quality, ts)]
}

/** A heart-rate reading that failed quality. It must be saved and counted as failed, but never color anything. */
export function noisyReadingEvent({ crewId, now, latest }: Ctx & { latest?: Measurement }): Measurement {
  return make({ crewId, now }, 'heartRate', 190, stampAfter(now, latest), { score: 0.1, passed: false, reason: 'motion' })
}

/** A new Amsler grid distortion in the center of vision. */
export function amslerDistortionEvent({ crewId, now, latest }: Ctx & { latest?: Measurement }): Measurement {
  return make({ crewId, now }, 'amslerDistortion', { distortion: true, distortedCells: 6, fraction: 0.06, centralAffected: true }, stampAfter(now, latest))
}

/** Ids of this crew member's check-ins from the last `days` days, to delete as "missed check-ins". */
export function eventsToRemove(events: readonly GameEvent[], crewId: string, now: Date, days: number): string[] {
  const since = now.getTime() - days * DAY
  return events
    .filter((e) => e.crewId === crewId && e.kind === 'checkInComplete' && Date.parse(e.timestamp) > since && Date.parse(e.timestamp) <= now.getTime())
    .map((e) => e.id)
}
