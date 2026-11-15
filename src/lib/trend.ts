import { computeBaseline, type Baseline } from './baseline'

/*
 * Two ways a change can hide from a rolling baseline, and how we catch them.
 *
 * 1. A fixed reference. A baseline built from ALL earlier readings follows a slow decline down,
 *    so a steady loss partly hides itself (Crew 3's real bed-rest weight loss read "Watch" when it
 *    should read "Act"). NASA compares in-flight results with a pre-flight reference, so each
 *    indicator also gets a frozen reference from its first REFERENCE_DAYS of readings.
 *
 * 2. A steady slide. Several small steps in the same direction can each look normal on their own.
 *    A drift is a straight-line trend over the last few readings that is both consistent (good fit)
 *    and large compared with the person's own spread.
 *
 * Both are statistical flags about the person's own history, not clinical thresholds.
 */

export const REFERENCE_DAYS = 14
export const DRIFT_WINDOW = 7
export const DRIFT_MIN_POINTS = 6
export const DRIFT_MIN_DAYS = 4
/** The fitted change across the window must be at least this many reference SDs... */
export const DRIFT_MIN_SDS = 2
/** ...and the straight line must explain at least this much of the variation (R²). */
export const DRIFT_MIN_FIT = 0.6

const DAY_MS = 86_400_000

export type Point = { t: number; v: number }
export type Drift = { direction: 'up' | 'down'; perDay: number; days: number; change: number }

/**
 * The frozen reference: readings from the first REFERENCE_DAYS of this indicator's history. Only
 * available once the history is longer than that window, so a new person is never judged against
 * a half-built reference, and only when the window holds enough readings for a baseline.
 */
export function referenceBaseline(points: readonly Point[], latestT: number): Baseline | null {
  if (!points.length) return null
  const t0 = Math.min(...points.map((p) => p.t))
  if (latestT - t0 < REFERENCE_DAYS * DAY_MS) return null
  return computeBaseline(points.filter((p) => p.t < t0 + REFERENCE_DAYS * DAY_MS && p.t < latestT).map((p) => p.v))
}

/** A consistent straight-line slide over the most recent readings, or null. */
export function detectDrift(points: readonly Point[], scale: Baseline | null): Drift | null {
  if (!scale) return null
  const recent = [...points].sort((a, b) => a.t - b.t).slice(-DRIFT_WINDOW)
  if (recent.length < DRIFT_MIN_POINTS) return null
  const days = (recent[recent.length - 1].t - recent[0].t) / DAY_MS
  if (days < DRIFT_MIN_DAYS) return null

  const xs = recent.map((p) => (p.t - recent[0].t) / DAY_MS)
  const ys = recent.map((p) => p.v)
  const n = xs.length
  const mx = xs.reduce((a, b) => a + b, 0) / n
  const my = ys.reduce((a, b) => a + b, 0) / n
  const sxx = xs.reduce((a, x) => a + (x - mx) ** 2, 0)
  const syy = ys.reduce((a, y) => a + (y - my) ** 2, 0)
  if (sxx === 0 || syy === 0) return null
  const sxy = xs.reduce((a, x, i) => a + (x - mx) * (ys[i] - my), 0)
  const slope = sxy / sxx
  const fit = (sxy * sxy) / (sxx * syy)
  const change = slope * days
  if (fit < DRIFT_MIN_FIT || Math.abs(change) < DRIFT_MIN_SDS * scale.sd) return null
  return { direction: slope > 0 ? 'up' : 'down', perDay: slope, days: Math.round(days), change }
}
