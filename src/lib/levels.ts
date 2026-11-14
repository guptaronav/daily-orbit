import type { GameEvent } from '../contract/types'
import { creditedEvents, pointsFor } from './scoring'

/*
 * Levels, coins and streak flame: the reward surface of the UI overhaul.
 *
 * This file only RE-EXPRESSES the points Ronav's scoring already produces. It never scores
 * anything itself, and like scoring.ts it has no function that accepts a Measurement: a level is
 * earned by showing up, never by being healthy. Reporting a bad day earns exactly what a good day
 * does, so the reward surface can never give anyone a reason to hide a symptom.
 *
 * The thresholds below are invented pacing numbers, the same kind of guess as
 * WEEKLY_GOAL_PER_CREW. They are not a claim about anything.
 */

export type Rank = { level: number; title: string; at: number }

/** Cumulative points needed to reach each level. */
export const RANKS: readonly Rank[] = [
  { level: 1, title: 'Cadet', at: 0 },
  { level: 2, title: 'Crew', at: 60 },
  { level: 3, title: 'Specialist', at: 150 },
  { level: 4, title: 'Navigator', at: 300 },
  { level: 5, title: 'Flight engineer', at: 550 },
  { level: 6, title: 'Commander', at: 850 },
  { level: 7, title: 'Mission lead', at: 1200 },
]

export type LevelState = {
  level: number
  title: string
  /** Points earned inside the current level. */
  into: number
  /** Points the current level spans. Equals `into` at the top rank, so `pct` is 1 there. */
  span: number
  /** Points still needed for the next level, or null at the top rank. */
  toNext: number | null
  /** 0 to 1 progress through the current level. */
  pct: number
  /** The rank after this one, or null at the top. */
  next: Rank | null
}

/** Where a points total sits in the rank ladder. Negative totals clamp to level 1. */
export function levelFor(points: number): LevelState {
  const total = Math.max(0, Math.floor(points))
  let index = 0
  for (let i = 0; i < RANKS.length; i++) if (total >= RANKS[i].at) index = i

  const rank = RANKS[index]
  const next = RANKS[index + 1] ?? null
  const into = total - rank.at

  if (!next) return { level: rank.level, title: rank.title, into, span: into, toNext: null, pct: 1, next: null }

  const span = next.at - rank.at
  return {
    level: rank.level,
    title: rank.title,
    into,
    span,
    toNext: next.at - total,
    pct: Math.min(1, into / span),
    next,
  }
}

/**
 * Coins are the lifetime credited points for one crew member: the same number the progress screen
 * calls points, shown as a spendable-looking total because that is what the overhaul asks for.
 * Nothing in the app spends them.
 */
export const coinsFor = (events: readonly GameEvent[]): number => pointsFor(creditedEvents([...events]))

const DAY_MS = 86_400_000
const toDay = (iso: string): number => Math.floor(Date.parse(iso.slice(0, 10)) / DAY_MS)

/**
 * Whether this crew member has already earned credit today, which is what the dock's
 * "All done today" state reads. Uses the same day boundary as the credit cap.
 */
export function doneToday(events: readonly GameEvent[], now: Date): boolean {
  const today = toDay(now.toISOString())
  return events.some((e) => toDay(e.timestamp) === today)
}
