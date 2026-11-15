import type { Indicator, Status } from '../contract/types'
import type { IndicatorReading } from './bodyStatus'
import { worstStatus } from './bodyStatus'

/*
 * NASA's five hazards of human spaceflight, and which of our readings each one touches.
 *
 * The link between a hazard and a reading is not hand-picked: a reading belongs to a hazard when
 * that reading's own NASA-sourced "how do spaceflight hazards affect it" text names the hazard.
 * So the mapping can only be as good as, and never more confident than, the sourced content.
 */

export type HazardId = 'radiation' | 'isolation' | 'distance' | 'gravity' | 'environment'

export const HAZARD_IDS: HazardId[] = ['radiation', 'isolation', 'distance', 'gravity', 'environment']

/** Words that name each hazard in the sourced hazardEffect text. */
export const HAZARD_WORDS: Record<HazardId, RegExp> = {
  radiation: /radiation|solar particle/i,
  isolation: /isolation|confine/i,
  distance: /distance|far from earth|from earth|light[- ]?time|delay/i,
  gravity: /gravity|weightless|microgravity|fluid shift/i,
  environment: /closed environment|hostile|cabin|carbon dioxide|\bco2\b|microb/i,
}

export function hazardIndicators(content: readonly { id: Indicator; hazardEffect: string }[]): Record<HazardId, Indicator[]> {
  const out = Object.fromEntries(HAZARD_IDS.map((h) => [h, [] as Indicator[]])) as Record<HazardId, Indicator[]>
  for (const c of content) {
    for (const h of HAZARD_IDS) if (HAZARD_WORDS[h].test(c.hazardEffect ?? '')) out[h].push(c.id)
  }
  return out
}

export type HazardState = { status: Status; flagged: Indicator[]; measured: number }

/** Each hazard's status: the worst status among its readings that have good data. */
export function hazardStatus(map: Record<HazardId, Indicator[]>, readings: Record<Indicator, IndicatorReading>): Record<HazardId, HazardState> {
  return Object.fromEntries(
    HAZARD_IDS.map((h) => {
      const rs = map[h].map((i) => readings[i]).filter(Boolean)
      const flagged = rs.filter((r) => r.status === 'yellow' || r.status === 'red').map((r) => r.indicator)
      return [h, { status: worstStatus(rs.map((r) => r.status)), flagged, measured: rs.filter((r) => r.status !== 'gray').length }]
    }),
  ) as Record<HazardId, HazardState>
}
