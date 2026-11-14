import { describe, expect, test } from 'vitest'
import { estimateHeartRate } from './heartRate'
import { synthRgb } from './synth'

const FPS = 30

describe('estimateHeartRate', () => {
  test.each([55, 72, 100, 140])('recovers %i bpm within 2 bpm with quality passed', (bpm) => {
    const { r, g, b } = synthRgb({ bpm, fps: FPS, seconds: 30 })
    const out = estimateHeartRate({ r, g, b, fps: FPS, motion: 0.005, meanLuma: 130, faceLostFraction: 0 })
    expect(Math.abs(out.bpm! - bpm)).toBeLessThanOrEqual(2)
    expect(out.quality.passed).toBe(true)
  })

  test('a clean signal with too much head motion is refused as motion', () => {
    const { r, g, b } = synthRgb({ bpm: 72, fps: FPS, seconds: 30 })
    const out = estimateHeartRate({ r, g, b, fps: FPS, motion: 0.08, meanLuma: 130, faceLostFraction: 0 })
    expect(out.quality).toMatchObject({ passed: false, reason: 'motion' })
  })

  test('a refused reading still reports the best-guess bpm and prominence for diagnostics', () => {
    const { r, g, b } = synthRgb({ bpm: 72, fps: FPS, seconds: 30 })
    const out = estimateHeartRate({ r, g, b, fps: FPS, motion: 0.08, meanLuma: 130, faceLostFraction: 0 })
    expect(out.bpm).toBeNull()
    expect(Math.abs(out.candidateBpm! - 72)).toBeLessThanOrEqual(2)
    expect(out.prominence).toBeGreaterThan(0.7)
  })

  test('a dark room is refused as lighting', () => {
    const { r, g, b } = synthRgb({ bpm: 72, fps: FPS, seconds: 30 })
    const out = estimateHeartRate({ r, g, b, fps: FPS, motion: 0.005, meanLuma: 25, faceLostFraction: 0 })
    expect(out.quality).toMatchObject({ passed: false, reason: 'lighting' })
  })

  test('losing the face too often is refused as faceLost', () => {
    const { r, g, b } = synthRgb({ bpm: 72, fps: FPS, seconds: 30 })
    const out = estimateHeartRate({ r, g, b, fps: FPS, motion: 0.005, meanLuma: 130, faceLostFraction: 0.4 })
    expect(out.quality).toMatchObject({ passed: false, reason: 'faceLost' })
  })

  test('a flat signal is refused as lowSignal', () => {
    const flat = new Array(900).fill(120)
    const out = estimateHeartRate({ r: flat, g: flat, b: flat, fps: FPS, motion: 0.005, meanLuma: 130, faceLostFraction: 0 })
    expect(out.quality).toMatchObject({ passed: false, reason: 'lowSignal' })
  })

  test('noise with no pulse is refused as lowSignal instead of reporting a confident number', () => {
    const { r, g, b } = synthRgb({ bpm: 72, fps: FPS, seconds: 30, pulseScale: 0, noise: 0.01 })
    const out = estimateHeartRate({ r, g, b, fps: FPS, motion: 0.005, meanLuma: 130, faceLostFraction: 0 })
    expect(out.quality).toMatchObject({ passed: false, reason: 'lowSignal' })
  })

  test('captures shorter than 10 s are refused', () => {
    const { r, g, b } = synthRgb({ bpm: 72, fps: FPS, seconds: 5 })
    const out = estimateHeartRate({ r, g, b, fps: FPS, motion: 0.005, meanLuma: 130, faceLostFraction: 0 })
    expect(out.bpm).toBeNull()
    expect(out.quality).toMatchObject({ passed: false, reason: 'lowSignal' })
  })
})
