import type { GameEvent } from '../contract/types'

const DAY_MS = 86_400_000
const FORGIVE_WINDOW_DAYS = 7 // a second missed day within this many days breaks the streak

const toDay = (iso: string): number => Math.floor(Date.parse(iso.slice(0, 10)) / DAY_MS)

/**
 * Consecutive check-in days ending today, forgiving one missed day per week.
 * `checkInDays` are ISO dates (YYYY-MM-DD). Today not being checked in yet is pending, not a miss.
 * Walking back from the newest day, a miss is forgiven unless another miss is less than 7 days newer.
 */
export function currentStreak(checkInDays: readonly string[], today: string): number {
  const days = new Set(checkInDays.map(toDay))
  if (days.size === 0) return 0
  const oldest = Math.min(...days)
  let day = toDay(today)
  if (!days.has(day)) day -= 1 // today is still pending

  let count = 0
  let lastMiss: number | null = null
  for (; day >= oldest; day--) {
    if (days.has(day)) {
      count++
    } else if (lastMiss !== null && lastMiss - day < FORGIVE_WINDOW_DAYS) {
      break
    } else {
      lastMiss = day
    }
  }
  return count
}

/** Unique ISO dates (UTC) on which this crew member completed a check-in, oldest first. */
export function checkInDays(events: readonly GameEvent[], crewId: string): string[] {
  const days = new Set(events.filter((e) => e.crewId === crewId && e.kind === 'checkInComplete').map((e) => e.timestamp.slice(0, 10)))
  return [...days].sort()
}
