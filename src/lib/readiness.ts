import type { Status } from '../contract/types'

/*
 * Readiness, as a label with its reasons rather than a made-up score. It is derived only from
 * things the app already judges: each body region's status, the cross-indicator patterns, open
 * alerts and self-report gaps. It answers "should I take on something demanding today without
 * checking first?". It is a prompt, not a medical clearance, and the screen says so.
 *
 * It is worded as a mission call, the way flight controllers poll a team: Go, Go with limits,
 * No-go. The limits are about what kind of work to take on, never a treatment.
 */

export type ReadinessLevel = 'ready' | 'check' | 'notToday' | 'unknown'

export type ReadinessInput = {
  regions: { label: string; status: Status }[]
  patterns: { title: string; status: 'yellow' | 'red' }[]
  openAlerts: { title: string; status: 'yellow' | 'red' }[]
  gaps: number
}

export type Readiness = { level: ReadinessLevel; label: string; reasons: string[] }

export const READINESS_LABEL: Record<ReadinessLevel, string> = {
  ready: 'Go',
  check: 'Go with limits',
  notToday: 'No-go',
  unknown: 'No call yet',
}

export function readiness(input: ReadinessInput): Readiness {
  const red = [
    ...input.regions.filter((r) => r.status === 'red').map((r) => `${r.label} at Act`),
    ...input.patterns.filter((p) => p.status === 'red').map((p) => p.title),
    ...input.openAlerts.filter((a) => a.status === 'red').map((a) => `Open alert: ${a.title}`),
  ]
  if (red.length) return { level: 'notToday', label: READINESS_LABEL.notToday, reasons: Array.from(new Set(red)) }

  const yellow = [
    ...input.regions.filter((r) => r.status === 'yellow').map((r) => `${r.label} at Watch`),
    ...input.patterns.map((p) => p.title),
    ...(input.gaps ? ['How you feel and what was measured disagree'] : []),
  ]
  if (yellow.length) return { level: 'check', label: READINESS_LABEL.check, reasons: Array.from(new Set(yellow)) }

  if (input.regions.every((r) => r.status === 'gray')) return { level: 'unknown', label: READINESS_LABEL.unknown, reasons: ['No region has enough good readings yet'] }
  return { level: 'ready', label: READINESS_LABEL.ready, reasons: ['Every region with good data is within your usual'] }
}
