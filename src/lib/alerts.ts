import type { Indicator } from '../contract/types'
import type { IndicatorReading } from './bodyStatus'
import type { PatternHit } from './patterns'

/*
 * The alert loop. A red reading, or any cross-indicator pattern, opens an alert for the crew
 * medical officer. It stays open, and keeps being re-announced, until someone acknowledges it;
 * it is only cleared by closing it with a note. A closed alert reopens on its own if a NEW reading
 * keeps the condition going, so closing can never silence a problem that is still developing.
 */

export type AlertCandidate = {
  id: string
  crewId: string
  kind: 'reading' | 'pattern'
  title: string
  detail: string
  status: 'yellow' | 'red'
  /** Timestamp of the newest reading behind it; a new one reopens a closed alert. */
  signature: string
}

export type AlertRecord = { firstSeen?: number; ackAt?: number; closedAt?: number; note?: string; signature?: string }
export type AlertState = 'open' | 'acknowledged' | 'closed'

export function alertCandidates(crewId: string, readings: Record<Indicator, IndicatorReading>, patterns: readonly PatternHit[], label: (i: Indicator) => string): AlertCandidate[] {
  const out: AlertCandidate[] = []
  for (const r of Object.values(readings)) {
    if (r.status !== 'red' || !r.latest) continue
    out.push({ id: `${crewId}:reading:${r.indicator}`, crewId, kind: 'reading', title: `${label(r.indicator)} at Act`, detail: 'Far from this person’s own usual.', status: 'red', signature: r.latest.timestamp })
  }
  for (const p of patterns) {
    const sig = p.parts
      .map((x) => readings[x.indicator]?.latest?.timestamp ?? '')
      .sort()
      .at(-1) ?? ''
    out.push({ id: `${crewId}:pattern:${p.pattern.id}`, crewId, kind: 'pattern', title: p.pattern.title, detail: p.pattern.summary, status: p.status, signature: sig })
  }
  return out
}

export function alertState(c: AlertCandidate, rec: AlertRecord | undefined): AlertState {
  if (!rec) return 'open'
  // A newer reading behind the alert than the one it was closed or acknowledged on reopens it.
  if (rec.signature && rec.signature !== c.signature) return 'open'
  if (rec.closedAt) return 'closed'
  if (rec.ackAt) return 'acknowledged'
  return 'open'
}

/** How often an unacknowledged alert is announced again. */
export const RENOTIFY_MS = 5 * 60_000
