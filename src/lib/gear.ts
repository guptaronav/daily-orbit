/*
 * Cosmetic crew gear: a visor tint and a suit shade for the placeholder portraits.
 *
 * Gear is decoration and nothing else. No reading, baseline, status, score or threshold looks at
 * it, and the colors here are deliberately kept away from the status palette so a suit can never
 * be mistaken for a health signal.
 */

export type VisorId = 'standard' | 'gold' | 'clear'
export type SuitId = 'white' | 'graphite' | 'sand'

export type Gear = { visor: VisorId; suit: SuitId }

export const DEFAULT_GEAR: Gear = { visor: 'standard', suit: 'white' }

export const GEAR_VISORS: readonly { id: VisorId; name: string; from: string; to: string }[] = [
  { id: 'standard', name: 'Standard', from: 'var(--color-accent)', to: 'color-mix(in srgb, var(--color-accent) 40%, transparent)' },
  { id: 'gold', name: 'Gold', from: 'var(--color-coin-deep)', to: 'color-mix(in srgb, var(--color-coin) 55%, transparent)' },
  { id: 'clear', name: 'Clear', from: 'color-mix(in srgb, var(--color-ink) 42%, transparent)', to: 'color-mix(in srgb, var(--color-ink) 12%, transparent)' },
]

export const GEAR_SUITS: readonly { id: SuitId; name: string; fill: string }[] = [
  { id: 'white', name: 'White', fill: 'color-mix(in srgb, var(--color-ink) 16%, transparent)' },
  { id: 'graphite', name: 'Graphite', fill: 'color-mix(in srgb, var(--color-ink) 38%, transparent)' },
  { id: 'sand', name: 'Sand', fill: 'color-mix(in srgb, var(--color-rule-strong) 55%, transparent)' },
]

export const visorById = (id: VisorId) => GEAR_VISORS.find((v) => v.id === id) ?? GEAR_VISORS[0]
export const suitById = (id: SuitId) => GEAR_SUITS.find((s) => s.id === id) ?? GEAR_SUITS[0]

const KEY = 'chm-gear'

/** Blocked or unavailable storage falls back to the default kit rather than throwing. */
export function getGear(): Gear {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULT_GEAR
    const parsed = JSON.parse(raw) as Partial<Gear>
    return { visor: visorById(parsed.visor as VisorId).id, suit: suitById(parsed.suit as SuitId).id }
  } catch {
    return DEFAULT_GEAR
  }
}

export function setGear(gear: Gear): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(gear))
  } catch {
    // Not being able to remember the kit is not a reason to refuse the choice.
  }
}
