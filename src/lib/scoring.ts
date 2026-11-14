import type { GameEvent, GameEventKind } from '../contract/types'

// Points reward what people DO (check in, report early, exercise, retake a bad reading), never what
// their health values are. There is deliberately no function here that accepts a Measurement.
export const POINTS: Record<GameEventKind, number> = {
  checkInComplete: 10,
  symptomReported: 15, // highest on purpose: early reporting is the behavior we most want to encourage
  exerciseComplete: 10,
  retakeAfterQualityFail: 5,
}

export const EVENT_LABEL: Record<GameEventKind, string> = {
  checkInComplete: 'Check-in complete',
  symptomReported: 'Symptom reported',
  exerciseComplete: 'Exercise complete',
  retakeAfterQualityFail: 'Retook a reading we could not trust',
}

export const pointsFor = (events: readonly Pick<GameEvent, 'kind'>[]): number => events.reduce((sum, e) => sum + POINTS[e.kind], 0)

const DAY_MS = 86_400_000

/** Points from events in the last `days` days (newer than now minus days, up to and including now). */
export function pointsInWindow(events: readonly GameEvent[], now: Date, days: number): number {
  const since = now.getTime() - days * DAY_MS
  return pointsFor(events.filter((e) => {
    const t = Date.parse(e.timestamp)
    return t > since && t <= now.getTime()
  }))
}

// ponytail: the goal is a made-up pacing number (about 15 check-ins' worth a week per crew member).
export const WEEKLY_GOAL_PER_CREW = 150

export type ShipSystem = { id: string; name: string; threshold: number }

// Text-only "ship systems" that come online as the crew's total points grow. Names are flavor, not claims.
export const SYSTEMS: readonly ShipSystem[] = [
  { id: 'comms', name: 'Comms relay', threshold: 0 },
  { id: 'telemetry', name: 'Life-support telemetry', threshold: 300 },
  { id: 'medbay', name: 'Medical bay link', threshold: 900 },
  { id: 'shelter', name: 'Radiation shelter readiness', threshold: 1500 },
  { id: 'nav', name: 'Deep-space navigation', threshold: 2200 },
]

export const systemsStatus = (totalPoints: number): (ShipSystem & { online: boolean })[] =>
  SYSTEMS.map((s) => ({ ...s, online: totalPoints >= s.threshold }))
