import { INDICATORS, type Indicator, type Measurement, type Quality } from '../contract/types'
import { computeBaseline } from './baseline'
import { readAll } from './bodyStatus'
import { getContent } from './content'
import { getStatus } from './status'

const DAY_MS = 86_400_000

export type PacketChange = {
  indicator: Indicator
  label: string
  unit: string
  /** 'yellow' = watch, 'red' = act. Green and gray are never sent. */
  status: 'yellow' | 'red'
  /** This crew member's own baseline mean, before the latest reading. */
  from: number
  /** The latest reading that passed the quality check. */
  to: number
  deltaPct: number
  /** Whole days the indicator has been outside baseline, counting back over consecutive readings. */
  sinceDays: number
  quality: Quality
}

export type Packet = {
  changed: PacketChange[]
  /** Size of `json` on the wire, in bytes. */
  bytes: number
  json: string
}

type Input = { crewId: string; measurements: readonly Measurement[]; now: Date }

const round = (n: number, places = 1): number => {
  const f = 10 ** places
  return Math.round(n * f) / f
}

/**
 * How long the current deviation has lasted: walk back over this indicator's quality-passed
 * numeric readings while each one is still outside the baseline of everything before it, and
 * return whole days from the oldest of that run to `now`. Mirrors readIndicator's rule that a
 * reading is never compared against a baseline that includes itself.
 */
function deviationSinceDays(history: readonly Measurement[], now: Date): number {
  const passed = history.filter((m) => m.quality.passed && typeof m.value === 'number')
  let oldest: Measurement | null = null

  for (let i = passed.length - 1; i >= 0; i--) {
    const prior = passed.slice(0, i).map((m) => m.value as number)
    const baseline = computeBaseline(prior)
    if (baseline === null) break
    const status = getStatus(passed[i], baseline)
    if (status !== 'yellow' && status !== 'red') break
    oldest = passed[i]
  }

  if (!oldest) return 0
  return Math.max(0, Math.floor((now.getTime() - Date.parse(oldest.timestamp)) / DAY_MS))
}

/**
 * The smallest useful thing to send to the ground: only what changed.
 *
 * An indicator is included when its latest quality-passed reading sits outside this person's own
 * baseline (yellow or red). Readings that failed the quality check are never included, and neither
 * is anything with no good data or no deviation — a packet with nothing in it is the normal case.
 * Nothing here is a clinical judgement; the JSON carries that disclaimer with it.
 */
export function buildPacket({ crewId, measurements, now }: Input): Packet {
  const readings = readAll(measurements)
  const changed: PacketChange[] = []

  for (const indicator of INDICATORS) {
    const r = readings[indicator]
    if (r.status !== 'yellow' && r.status !== 'red') continue
    const latest = r.latest
    if (!latest || typeof latest.value !== 'number' || !r.baseline) continue

    const from = r.baseline.mean
    const to = latest.value
    changed.push({
      indicator,
      label: getContent(indicator).label,
      unit: latest.unit ?? getContent(indicator).unit,
      status: r.status,
      from: round(from, 2),
      to: round(to, 2),
      deltaPct: from === 0 ? 0 : round(((to - from) / Math.abs(from)) * 100),
      sinceDays: deviationSinceDays(r.history, now),
      quality: latest.quality,
    })
  }

  const json = JSON.stringify(
    {
      packet: 'crew-health-change-summary',
      version: 1,
      crewId,
      generatedAt: now.toISOString(),
      basis: "Deviation from this crew member's own 30-day baseline (mean ± SD), not a clinical threshold.",
      disclaimer: 'Prototype. Not a medical device.',
      changed,
    },
    null,
    2,
  )

  return { changed, bytes: new TextEncoder().encode(json).length, json }
}

export const packetFilename = (crewId: string, now: Date): string => `health-packet-${crewId}-${now.toISOString().slice(0, 10)}.json`
