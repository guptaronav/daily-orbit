import { resampleUniform, effectiveFps } from './resample'
import { faceLostFraction, motionScore, type Pt } from './quality'

/** Rate the pulse estimator runs at; capture frames are resampled onto this uniform clock. */
export const TARGET_FPS = 30

/** What we record for each video frame in which a face was found. */
export type FrameSample = {
  /** Seconds, from the video frame clock. */
  t: number
  /** Mean color over the skin regions. */
  r: number
  g: number
  b: number
  luma: number
  /** Nose tip, normalized 0-1. */
  nose: Pt
  /** Face width, normalized 0-1. */
  faceW: number
  blinkL: number
  blinkR: number
}

export type Assembled = {
  /** Effective capture rate from timestamps. */
  fps: number
  targetFps: number
  r: number[]
  g: number[]
  b: number[]
  motion: number
  meanLuma: number
  faceLostFraction: number
  blink: { left: number[]; right: number[]; fps: number }
  frames: number
  seconds: number
}

const mean = (x: readonly number[]) => (x.length === 0 ? 0 : x.reduce((a, v) => a + v, 0) / x.length)

/**
 * Turn raw per-frame samples into what the estimators need: uniform-rate color traces, head motion,
 * brightness, and how often the face was lost. `faceFlags` has one entry per video frame (found or
 * not), while `samples` only has the frames where a face was found.
 */
export function assembleCapture(samples: readonly FrameSample[], faceFlags: readonly boolean[]): Assembled {
  const times = samples.map((s) => s.t)
  const fps = effectiveFps(times)
  const trace = (pick: (s: FrameSample) => number) => resampleUniform(times, samples.map(pick), TARGET_FPS)
  return {
    fps,
    targetFps: TARGET_FPS,
    r: trace((s) => s.r),
    g: trace((s) => s.g),
    b: trace((s) => s.b),
    motion: motionScore(samples.map((s) => s.nose), mean(samples.map((s) => s.faceW))),
    meanLuma: mean(samples.map((s) => s.luma)),
    faceLostFraction: faceLostFraction(faceFlags),
    blink: { left: samples.map((s) => s.blinkL), right: samples.map((s) => s.blinkR), fps },
    frames: samples.length,
    seconds: times.length > 1 ? times[times.length - 1] - times[0] : 0,
  }
}
