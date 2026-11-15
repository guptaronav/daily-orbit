/*
 * Streak shields, for real. Every 7 check-in days in a row earns one shield (you can hold at most
 * MAX_SHIELDS). A missed day spends a shield automatically and the streak survives; with no
 * shield, a missed day ends the streak. Today not being checked in yet is pending, not a miss.
 * Each save is recorded so the app can say "Your shield saved a 12-day streak."
 */

export const SHIELD_EVERY = 7
export const MAX_SHIELDS = 2

const DAY_MS = 86_400_000
const toDay = (iso: string): number => Math.floor(Date.parse(iso.slice(0, 10)) / DAY_MS)
const toIso = (d: number): string => new Date(d * DAY_MS).toISOString().slice(0, 10)

export type ShieldSave = { day: string; streak: number }
export type ShieldStreak = { streak: number; shields: number; saves: ShieldSave[] }

export function streakWithShields(checkInDays: readonly string[], today: string): ShieldStreak {
  const days = new Set(checkInDays.map(toDay))
  if (!days.size) return { streak: 0, shields: 0, saves: [] }
  const start = Math.min(...days)
  const end = toDay(today)
  let run = 0
  let sinceShield = 0
  let shields = 0
  const saves: ShieldSave[] = []
  for (let d = start; d <= end; d++) {
    if (days.has(d)) {
      run++
      sinceShield++
      if (sinceShield >= SHIELD_EVERY) {
        shields = Math.min(MAX_SHIELDS, shields + 1)
        sinceShield = 0
      }
    } else if (d === end) {
      // Today is still open: not a miss yet.
    } else if (shields > 0) {
      shields--
      saves.push({ day: toIso(d), streak: run })
    } else {
      run = 0
      sinceShield = 0
    }
  }
  return { streak: run, shields, saves }
}
