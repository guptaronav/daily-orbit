import type { Quality } from '../../contract/types'
import { bandpass } from './bandpass'
import { ESTIMATE_HALVES_AGREE_BPM, ESTIMATE_MIN_PROMINENCE, MAX_FACE_LOST, MAX_MOTION, MIN_PROMINENCE, MIN_SECONDS } from './constants'
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

export type HeartRateResult = {
  bpm: number | null
  prominence: number
  /** Best-guess rate from the strongest spectral peak, even when the reading was refused (diagnostics only). */
  candidateBpm: number | null
  /**
   * A low-confidence rate offered when the face, light and motion checks all passed and the signal is
   * above noise but below the pass line. Equals `bpm` for a clean reading. Null when the capture was
   * contaminated (motion, light, lost face) or too weak: then even a guess would be misleading.
   */
  estimateBpm: number | null
  quality: Quality
}

const fail = (reason: NonNullable<Quality['reason']>, prominence = 0, candidateBpm: number | null = null, estimateBpm: number | null = null): HeartRateResult => ({
  bpm: null,
  prominence,
  candidateBpm,
  estimateBpm,
  quality: { score: Math.min(1, prominence / 0.7), passed: false, reason },
})

/** Do the first and second half of the capture independently give about the same rate? */
function halvesAgree(pulse: number[], fps: number): boolean {
  const mid = pulse.length >> 1
  const first = dominantFrequency(pulse.slice(0, mid), fps).freq
  const second = dominantFrequency(pulse.slice(mid), fps).freq
  return Math.abs(first - second) * 60 <= ESTIMATE_HALVES_AGREE_BPM
}

/**
 * Heart rate from face-ROI color traces. The check order matters: we name the most fixable cause
 * first (face, light, motion) before blaming a weak signal, so the retake advice is specific.
 * The spectrum is computed before the gates so a refusal can still report what it saw.
 */
export function estimateHeartRate(input: HeartRateInput): HeartRateResult {
  const { r, g, b, fps } = input
  if (r.length < MIN_SECONDS * fps) return fail('lowSignal')

  const pulse = bandpass(pos(r, g, b, fps), fps)
  const { freq, prominence } = dominantFrequency(pulse, fps)
  const candidate = prominence > 0 ? Math.round(freq * 60) : null

  if ((input.faceLostFraction ?? 0) > MAX_FACE_LOST) return fail('faceLost', prominence, candidate)
  if (input.meanLuma !== undefined && lightingOk(input.meanLuma) !== 'ok') return fail('lighting', prominence, candidate)
  if ((input.motion ?? 0) > MAX_MOTION) return fail('motion', prominence, candidate)
  if (prominence < MIN_PROMINENCE) {
    const offer = prominence >= ESTIMATE_MIN_PROMINENCE && halvesAgree(pulse, fps)
    return fail('lowSignal', prominence, candidate, offer ? candidate : null)
  }
  return { bpm: candidate, prominence, candidateBpm: candidate, estimateBpm: candidate, quality: { score: Math.min(1, prominence / 0.7), passed: true } }
}
