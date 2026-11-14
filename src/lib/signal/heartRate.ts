import type { Quality } from '../../contract/types'
import { bandpass } from './bandpass'
import { MAX_FACE_LOST, MAX_MOTION, MIN_PROMINENCE, MIN_SECONDS } from './constants'
import { pos } from './pos'
import { lightingOk } from './quality'
import { dominantFrequency } from './spectrum'

export type HeartRateInput = {
  /** Per-frame mean R, G, B of the face ROIs. */
  r: number[]
  g: number[]
  b: number[]
  fps: number
  /** From motionScore(). */
  motion?: number
  /** Mean face brightness, 0-255. */
  meanLuma?: number
  /** From faceLostFraction(). */
  faceLostFraction?: number
}

export type HeartRateResult = { bpm: number | null; prominence: number; quality: Quality }

const fail = (reason: NonNullable<Quality['reason']>, prominence = 0): HeartRateResult => ({
  bpm: null,
  prominence,
  quality: { score: Math.min(1, prominence / 0.7), passed: false, reason },
})

/**
 * Heart rate from face-ROI color traces. The check order matters: we name the most fixable cause
 * first (face, light, motion) before blaming a weak signal, so the retake advice is specific.
 */
export function estimateHeartRate(input: HeartRateInput): HeartRateResult {
  const { r, g, b, fps } = input
  if (r.length < MIN_SECONDS * fps) return fail('lowSignal')
  if ((input.faceLostFraction ?? 0) > MAX_FACE_LOST) return fail('faceLost')
  if (input.meanLuma !== undefined && lightingOk(input.meanLuma) !== 'ok') return fail('lighting')
  if ((input.motion ?? 0) > MAX_MOTION) return fail('motion')

  const { freq, prominence } = dominantFrequency(bandpass(pos(r, g, b, fps), fps), fps)
  if (prominence < MIN_PROMINENCE) return fail('lowSignal', prominence)
  return { bpm: Math.round(freq * 60), prominence, quality: { score: Math.min(1, prominence / 0.7), passed: true } }
}
