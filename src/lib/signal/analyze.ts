import type { Quality } from '../../contract/types'
import type { Assembled } from './assemble'
import { blinkMetrics, type BlinkMetrics } from './blink'
import { MAX_FACE_LOST, MIN_SECONDS } from './constants'
import { estimateHeartRate, type HeartRateResult } from './heartRate'
import { lightingOk } from './quality'

/** Raw facts behind the verdicts, shown to the user so a refusal is explainable. */
export type CaptureDiagnostics = {
  seconds: number
  frames: number
  fps: number
  motion: number
  meanLuma: number
  faceLostFraction: number
  prominence: number
  candidateBpm: number | null
}

/** Average skin color per frame (numbers only, no images), for offline calibration. */
export type CaptureTrace = { fps: number; r: number[]; g: number[]; b: number[] }

export type CaptureAnalysis = {
  heartRate: HeartRateResult
  blink: BlinkMetrics & { quality: Quality }
  diagnostics: CaptureDiagnostics
  trace: CaptureTrace
}

const round1 = (v: number) => Math.round(v * 10) / 10
const round2 = (v: number) => Math.round(v * 100) / 100

const fail = (reason: NonNullable<Quality['reason']>): Quality => ({ score: 0, passed: false, reason })

// Blink comes from the face blendshapes, not from skin color, so head motion alone does not
// invalidate it; it needs a face, light and enough footage.
function blinkQuality(a: Assembled): Quality {
  if (a.seconds < MIN_SECONDS) return fail('lowSignal')
  if (a.faceLostFraction > MAX_FACE_LOST) return fail('faceLost')
  if (lightingOk(a.meanLuma) !== 'ok') return fail('lighting')
  return { score: 1, passed: true }
}

export function analyzeCapture(a: Assembled): CaptureAnalysis {
  const heartRate = estimateHeartRate({
    r: a.r,
    g: a.g,
    b: a.b,
    fps: a.targetFps,
    motion: a.motion,
    meanLuma: a.meanLuma,
    faceLostFraction: a.faceLostFraction,
  })
  const blink = blinkMetrics(a.blink, a.blink.fps)
  return {
    heartRate,
    blink: { blinkRate: round1(blink.blinkRate), eyelidClosurePct: round1(blink.eyelidClosurePct), quality: blinkQuality(a) },
    diagnostics: {
      seconds: a.seconds,
      frames: a.frames,
      fps: a.fps,
      motion: a.motion,
      meanLuma: a.meanLuma,
      faceLostFraction: a.faceLostFraction,
      prominence: heartRate.prominence,
      candidateBpm: heartRate.candidateBpm,
    },
    trace: { fps: a.targetFps, r: a.r.map(round2), g: a.g.map(round2), b: a.b.map(round2) },
  }
}
