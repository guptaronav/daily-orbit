import type { GameEvent, GameEventKind } from '../contract/types'
import { POINTS, creditedEvents } from './scoring'

/*
 * The reward surface: heatmap, weekly challenge, streak shields, mission pass, supply drop,
 * milestones and badges.
 *
 * Every one of these is derived from events the person ALREADY earned by doing something. None of
 * them reads a Measurement, so none of them can pay more for a healthy number than for an honest
 * bad one. The thresholds and tier sizes are invented pacing numbers, like WEEKLY_GOAL_PER_CREW.
 */

const DAY_MS = 86_400_000
const dayOf = (iso: string) => iso.slice(0, 10)

export type HeatDay = { day: string; count: number; done: boolean }

/** One cell per day, oldest first, counting credited events. Used for "proof of consistency". */
export function activityHeatmap(events: readonly GameEvent[], now: Date, days = 30): HeatDay[] {
  const counts = new Map<string, number>()
  for (const e of creditedEvents([...events])) counts.set(dayOf(e.timestamp), (counts.get(dayOf(e.timestamp)) ?? 0) + 1)

  return Array.from({ length: days }, (_, i) => {
    const day = new Date(now.getTime() - (days - 1 - i) * DAY_MS).toISOString().slice(0, 10)
    const count = counts.get(day) ?? 0
    return { day, count, done: count > 0 }
  })
}

export type WeeklyChallenge = { days: number; target: number; met: boolean; reward: number }

export const WEEKLY_TARGET = 6
export const WEEKLY_REWARD = 75

/** Check in on 6 of the last 7 days. Counts distinct days with any credited event. */
export function weeklyChallenge(events: readonly GameEvent[], now: Date): WeeklyChallenge {
  const since = now.getTime() - 7 * DAY_MS
  const days = new Set(
    events.filter((e) => Date.parse(e.timestamp) > since && Date.parse(e.timestamp) <= now.getTime()).map((e) => dayOf(e.timestamp)),
  )
  return { days: days.size, target: WEEKLY_TARGET, met: days.size >= WEEKLY_TARGET, reward: WEEKLY_REWARD }
}

/** One shield per full week of streak. A shield is the story we tell about forgiving a missed day. */
export const shieldsFor = (streak: number): number => Math.floor(Math.max(0, streak) / 7)

export type PassTier = { n: number; at: number; name: string }

/** Ten cosmetic tiers across the season. Nothing behind them changes how the app measures anything. */
export const PASS_TIERS: readonly PassTier[] = [
  { n: 1, at: 0, name: 'Mission patch' },
  { n: 2, at: 80, name: 'Visor tint' },
  { n: 3, at: 180, name: 'Suit stripe' },
  { n: 4, at: 300, name: 'Helmet decal' },
  { n: 5, at: 440, name: 'Comms badge' },
  { n: 6, at: 600, name: 'Shoulder flag' },
  { n: 7, at: 780, name: 'Gold trim' },
  { n: 8, at: 980, name: 'Antenna light' },
  { n: 9, at: 1200, name: 'Nebula frame' },
  { n: 10, at: 1450, name: 'Season banner' },
]

export function passProgress(coins: number): { tier: PassTier; next: PassTier | null; toNext: number | null } {
  const total = Math.max(0, coins)
  let index = 0
  for (let i = 0; i < PASS_TIERS.length; i++) if (total >= PASS_TIERS[i].at) index = i
  const next = PASS_TIERS[index + 1] ?? null
  return { tier: PASS_TIERS[index], next, toNext: next ? next.at - total : null }
}

/** The daily crate is available once per day, enforced by the same credit cap as everything else. */
export const dropAvailable = (events: readonly GameEvent[], now: Date): boolean =>
  !events.some((e) => e.kind === 'supplyDrop' && dayOf(e.timestamp) === dayOf(now.toISOString()))

/** Milliseconds until the next local midnight, for the "next drop in" countdown. */
export function msToNextDay(now: Date): number {
  const next = new Date(now)
  next.setHours(24, 0, 0, 0)
  return next.getTime() - now.getTime()
}

export type Milestone = { days: number; label: string; coins: number; reached: boolean; claimed: boolean; detail: string }

export const MILESTONE_DAYS = [3, 7, 14, 30]

/** Streak milestones, claimed once each. `detail` is what keeps a claim unique in the credit cap. */
export function milestonesFor(streak: number, events: readonly GameEvent[]): Milestone[] {
  const claimedDetails = new Set(events.filter((e) => e.kind === 'streakMilestone').map((e) => e.detail))
  return MILESTONE_DAYS.map((days) => ({
    days,
    label: `${days} days in a row`,
    coins: POINTS.streakMilestone,
    reached: streak >= days,
    claimed: claimedDetails.has(`streak-${days}`),
    detail: `streak-${days}`,
  }))
}

export type Badge = { id: string; name: string; desc: string; earned: boolean }

/** Badges are for things you DID. There is deliberately no badge for a good reading. */
export function badgesFor(events: readonly GameEvent[], streak: number): Badge[] {
  const has = (kind: GameEventKind) => events.some((e) => e.kind === kind)
  return [
    { id: 'first', name: 'First light', desc: 'Completed your first mirror check', earned: has('checkInComplete') },
    { id: 'honest', name: 'Honest log', desc: 'Reported a symptom instead of hiding it', earned: has('symptomReported') },
    { id: 'retake', name: 'Second look', desc: 'Retook a reading the app could not trust', earned: has('retakeAfterQualityFail') },
    { id: 'mover', name: 'Mover', desc: 'Logged an exercise session', earned: has('exerciseComplete') },
    { id: 'care', name: 'Follow through', desc: 'Did a care step the app proposed', earned: has('countermeasureComplete') },
    { id: 'crate', name: 'Supply runner', desc: 'Opened a daily supply drop', earned: has('supplyDrop') },
    { id: 'week', name: 'Seven straight', desc: 'Kept a 7 day streak', earned: streak >= 7 },
    { id: 'fortnight', name: 'Two weeks on', desc: 'Kept a 14 day streak', earned: streak >= 14 },
  ]
}
