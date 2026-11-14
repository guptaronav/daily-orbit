import type { Quality } from '../../contract/types'
import type { Assembled } from './assemble'
import { blinkMetrics, type BlinkMetrics } from './blink'
import { MAX_FACE_LOST, MIN_SECONDS } from './constants'
import { estimateHeartRate, type HeartRateResult } from './heartRate'
import { lightingOk } from './quality'

export type CaptureAnalysis = {
  heartRate: HeartRateResult
  blink: BlinkMetrics & { quality: Quality }
}

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
  return { heartRate, blink: { ...blinkMetrics(a.blink, a.blink.fps), quality: blinkQuality(a) } }
}
