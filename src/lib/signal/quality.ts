import { MAX_LUMA, MIN_LUMA } from './constants'

export type Pt = { x: number; y: number }

/**
 * Head motion: spread of the nose-tip position over the capture, as a fraction of face width
 * (both in the same normalized image units). Missing data counts as maximum motion, never NaN.
 */
export function motionScore(points: readonly Pt[], faceWidth: number): number {
  if (points.length === 0 || faceWidth <= 0) return Infinity
  const n = points.length
  const mx = points.reduce((a, p) => a + p.x, 0) / n
  const my = points.reduce((a, p) => a + p.y, 0) / n
  const variance = points.reduce((a, p) => a + (p.x - mx) ** 2 + (p.y - my) ** 2, 0) / n
  return Math.sqrt(variance) / faceWidth
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
