import { gaussian, mulberry32 } from '../sim/rng'

export type SynthOptions = {
  bpm: number
  fps: number
  seconds: number
  /** Per-channel relative noise (sd). Default is a realistic well-lit webcam. */
  noise?: number
  /** Slow common-mode illumination drift amplitude (relative). */
  drift?: number
  /** 0 removes the pulse entirely (noise/drift only). Default 1. */
  pulseScale?: number
  seed?: number
}

// Skin-tone DC levels and relative pulse strength per channel (green strongest, as in real rPPG).
const DC = { r: 180, g: 120, b: 100 }
const PULSE = { r: 0.003, g: 0.01, b: 0.005 }

/** Synthetic face-ROI mean RGB traces with a known heart rate. Test helper only. */
export function synthRgb({ bpm, fps, seconds, noise = 0.0015, drift = 0.02, pulseScale = 1, seed = 1 }: SynthOptions) {
  const rand = mulberry32(seed)
  const n = Math.round(fps * seconds)
  const r: number[] = []
  const g: number[] = []
  const b: number[] = []
  for (let i = 0; i < n; i++) {
    const t = i / fps
    const pulse = pulseScale * Math.sin(2 * Math.PI * (bpm / 60) * t)
    const light = 1 + drift * Math.sin(2 * Math.PI * 0.1 * t)
    r.push(DC.r * light * (1 + PULSE.r * pulse + noise * gaussian(rand)))
    g.push(DC.g * light * (1 + PULSE.g * pulse + noise * gaussian(rand)))
    b.push(DC.b * light * (1 + PULSE.b * pulse + noise * gaussian(rand)))
  }
  return { r, g, b }
}

export function sine(hz: number, fps: number, seconds: number, amplitude = 1): number[] {
  return Array.from({ length: Math.round(fps * seconds) }, (_, i) => amplitude * Math.sin((2 * Math.PI * hz * i) / fps))
}

export function whiteNoise(fps: number, seconds: number, seed = 7): number[] {
  const rand = mulberry32(seed)
  return Array.from({ length: Math.round(fps * seconds) }, () => gaussian(rand))
}
