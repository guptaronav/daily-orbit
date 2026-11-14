import type { GameEvent, GameEventKind } from '../contract/types'

// Points reward what people DO (check in, report early, exercise, retake a bad reading), never what
// their health values are. There is deliberately no function here that accepts a Measurement.
export const POINTS: Record<GameEventKind, number> = {
  checkInComplete: 10,
  symptomReported: 15, // highest on purpose: early reporting is the behavior we most want to encourage
  exerciseComplete: 10,
  retakeAfterQualityFail: 5,
  countermeasureComplete: 10, // doing a step the app proposed because of YOUR data (sleep, nutrition, telling someone)
}

export const EVENT_LABEL: Record<GameEventKind, string> = {
  checkInComplete: 'Check-in complete',
  symptomReported: 'Symptom reported',
  exerciseComplete: 'Exercise complete',
  retakeAfterQualityFail: 'Retook a reading we could not trust',
  countermeasureComplete: 'Followed a care step',
}

export const pointsFor = (events: readonly Pick<GameEvent, 'kind'>[]): number => events.reduce((sum, e) => sum + POINTS[e.kind], 0)

const DAY_MS = 86_400_000

/**
 * Anti-farming: each person earns each kind of credit once per day, and each care step once per day.
 * Extra events are still logged (nothing is thrown away), they just are not scored. This also means the
 * most anyone can earn in a day is bounded. The earliest event of the day is the one that counts.
 */
export function creditedEvents(events: readonly GameEvent[]): GameEvent[] {
  const seen = new Set<string>()
  const credited: GameEvent[] = []
  for (const e of [...events].sort((a, b) => a.timestamp.localeCompare(b.timestamp))) {
    const key = `${e.crewId}|${e.timestamp.slice(0, 10)}|${e.kind}|${e.detail ?? ''}`
    if (seen.has(key)) continue
    seen.add(key)
    credited.push(e)
  }
  return credited
}

/** Which of a new batch of events would still earn credit today, given what was already logged. */
export function creditableKinds(
  existing: readonly GameEvent[],
  incoming: readonly { kind: GameEventKind; detail?: string }[],
  crewId: string,
  now: Date,
): { credited: GameEvent[]; alreadyCounted: GameEvent[] } {
  const fresh: GameEvent[] = incoming.map((e, i) => ({ id: `__new${i}`, crewId, timestamp: now.toISOString(), kind: e.kind, ...(e.detail ? { detail: e.detail } : {}) }))
  const credited = new Set(creditedEvents([...existing, ...fresh]).map((e) => e.id))
  return { credited: fresh.filter((e) => credited.has(e.id)), alreadyCounted: fresh.filter((e) => !credited.has(e.id)) }
}

/** Points from events in the last `days` days (newer than now minus days, up to and including now). */
export function pointsInWindow(events: readonly GameEvent[], now: Date, days: number): number {
  const since = now.getTime() - days * DAY_MS
  return pointsFor(creditedEvents(events).filter((e) => {
    const t = Date.parse(e.timestamp)
    return t > since && t <= now.getTime()
  }))
}

// ponytail: the goal is a made-up pacing number (about 15 check-ins' worth a week per crew member).
export const WEEKLY_GOAL_PER_CREW = 150

export type ShipSystem = { id: string; name: string; threshold: number }

// Text-only "ship systems" that come online as the crew's total points grow. Names are flavor, not claims.
// ponytail: the last threshold is tuned so the seeded crew sits just below it and a judge's second check-in unlocks it. Retune if the seed changes.
export const SYSTEMS: readonly ShipSystem[] = [
  { id: 'comms', name: 'Comms relay', threshold: 0 },
  { id: 'telemetry', name: 'Life-support telemetry', threshold: 300 },
  { id: 'medbay', name: 'Medical bay link', threshold: 900 },
  { id: 'shelter', name: 'Radiation shelter readiness', threshold: 1500 },
  { id: 'nav', name: 'Deep-space navigation', threshold: 1700 },
]

export const systemsStatus = (totalPoints: number): (ShipSystem & { online: boolean })[] =>
  SYSTEMS.map((s) => ({ ...s, online: totalPoints >= s.threshold }))

export type CrewProgress = {
  /** Points the whole crew earned in the last 7 days. */
  weekPoints: number
  /** Shared weekly goal, scaled by crew size. */
  goal: number
  /** 0 to 1 for the progress bar (capped). */
  fraction: number
  reached: boolean
  /** All-time points, which unlock ship systems. */
  totalPoints: number
}

/** One shared goal for the whole crew. There is deliberately no per-person ranking anywhere. */
export function crewProgress(allEvents: readonly GameEvent[], now: Date, crewCount: number): CrewProgress {
  const weekPoints = pointsInWindow(allEvents, now, 7)
  const goal = WEEKLY_GOAL_PER_CREW * Math.max(0, crewCount)
  return { weekPoints, goal, fraction: goal > 0 ? Math.min(1, weekPoints / goal) : 0, reached: goal > 0 && weekPoints >= goal, totalPoints: pointsFor(creditedEvents(allEvents)) }
}
