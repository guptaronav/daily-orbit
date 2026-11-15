import { useEffect, useReducer } from 'react'
import * as D from './data'

/*
 * Small things many screens share, kept in one place so they stay the same everywhere:
 *
 *  - useStoreTick: re-render when the app's data changes (and returns `bump` for timers).
 *  - useCrewId: the same, plus the current crew member's id.
 *  - timeAgo: "just now", "12 min ago", "3 h ago", "2 days ago".
 *  - painColor: the color for a 1-10 pain rating.
 */

/** Re-render whenever the data store changes. Returns a `bump` you can also call from a timer. */
export function useStoreTick(): () => void {
  const [, bump] = useReducer((n: number) => n + 1, 0)
  useEffect(() => D.onState(bump), [])
  return bump
}

/** Re-render on data changes and return the current crew member's id. */
export function useCrewId(): string {
  useStoreTick()
  return D.getState().crew.id as string
}

export function timeAgo(t: number, now = Date.now()): string {
  const m = Math.max(0, Math.round((now - t) / 60000))
  if (m < 1) return 'just now'
  if (m < 60) return `${m} min ago`
  const h = Math.round(m / 60)
  return h < 48 ? `${h} h ago` : `${Math.round(h / 24)} days ago`
}

export const painColor = (level: number): string => (level >= 7 ? 'var(--act)' : level >= 4 ? '#e8742c' : 'var(--watch)')
