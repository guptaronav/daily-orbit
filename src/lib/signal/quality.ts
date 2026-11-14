import { MAX_LUMA, MIN_LUMA } from './constants'

export type Pt = { x: number; y: number }

const median = (v: readonly number[]): number => {
  const s = [...v].sort((a, b) => a - b)
  const mid = s.length >> 1
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

/** Remove the straight-line trend so slow, steady drift (settling in, slouching) does not count. */
function detrend(v: readonly number[]): number[] {
  const n = v.length
  if (n < 2) return [...v]
  const mi = (n - 1) / 2
  const mv = v.reduce((a, x) => a + x, 0) / n
  let num = 0
  let den = 0
  v.forEach((x, i) => {
    num += (i - mi) * (x - mv)
    den += (i - mi) ** 2
  })
  const slope = num / den
  return v.map((x, i) => x - (mv + slope * (i - mi)))
}

/** Spread that ignores a few outliers (median absolute deviation, scaled to match a standard deviation). */
const robustSd = (v: readonly number[]): number => {
  const m = median(v)
  return 1.4826 * median(v.map((x) => Math.abs(x - m)))
}

/**
 * Head motion that actually hurts a pulse reading: sustained jitter of the nose tip as a fraction of
 * face width. Slow drift and a few brief glances away are ignored (trend removed, outlier-robust
 * spread). Missing data counts as maximum motion, never NaN.
 */
export function motionScore(points: readonly Pt[], faceWidth: number): number {
  if (points.length === 0 || faceWidth <= 0) return Infinity
  const sx = robustSd(detrend(points.map((p) => p.x)))
  const sy = robustSd(detrend(points.map((p) => p.y)))
  return Math.hypot(sx, sy) / faceWidth
}

/** Mean face brightness (0-255): too dark or blown out both ruin the pulse signal. */
export function lightingOk(meanLuma: number): 'ok' | 'dark' | 'bright' {
  if (meanLuma < MIN_LUMA) return 'dark'
  if (meanLuma > MAX_LUMA) return 'bright'
  return 'ok'
}

/** Share of frames where no face was found. Empty input counts as entirely lost. */
export function faceLostFraction(flags: readonly boolean[]): number {
  if (flags.length === 0) return 1
  return flags.filter((seen) => !seen).length / flags.length
}
