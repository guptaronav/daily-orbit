import { describe, expect, test } from 'vitest'
import { ESTIMATE_MIN_PROMINENCE, MIN_PROMINENCE } from './constants'
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

  test('a realistic pulse waveform (with a second harmonic) in webcam-level noise still passes', () => {
    let passed = 0
    for (let seed = 1; seed <= 20; seed++) {
      const bpm = 55 + ((seed * 7) % 60)
      const { r, g, b } = synthRgb({ bpm, fps: FPS, seconds: 40, noise: 0.01, harmonic: 0.6, seed })
      const out = estimateHeartRate({ r, g, b, fps: FPS, motion: 0.005, meanLuma: 130, faceLostFraction: 0 })
      if (out.quality.passed && Math.abs(out.bpm! - bpm) <= 2) passed++
    }
    expect(passed).toBeGreaterThanOrEqual(19)
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

describe('low-confidence estimate (shown as an estimate, never as a clean reading)', () => {
  const clean = { motion: 0.005, meanLuma: 130, faceLostFraction: 0 }
  const run = (seed: number, noise: number) => {
    const bpm = 55 + ((seed * 7) % 60)
    const { r, g, b } = synthRgb({ bpm, fps: FPS, seconds: 40, noise, harmonic: 0.6, seed })
    return { bpm, out: estimateHeartRate({ r, g, b, fps: FPS, ...clean }) }
  }

  test('a clean-gated signal below the pass line but above noise offers an estimate that is almost always close and never grossly wrong', () => {
    const errors: number[] = []
    for (let seed = 1; seed <= 100; seed++) {
      const { bpm, out } = run(seed, 0.02)
      if (out.quality.passed || out.estimateBpm === null) continue
      expect(out.bpm).toBeNull() // still not a clean reading
      expect(out.quality.reason).toBe('lowSignal')
      errors.push(Math.abs(out.estimateBpm - bpm))
    }
    expect(errors.length).toBeGreaterThan(5) // the test must actually exercise the tier
    expect(Math.max(...errors)).toBeLessThanOrEqual(10) // no wrong-peak estimates (the half-capture agreement check)
    expect(errors.filter((e) => e <= 3).length / errors.length).toBeGreaterThanOrEqual(0.95)
  })

  test('the estimate floor sits below the pass line, and a very weak signal offers no estimate', () => {
    expect(ESTIMATE_MIN_PROMINENCE).toBeLessThan(MIN_PROMINENCE)
    for (let seed = 1; seed <= 60; seed++) {
      const { out } = run(seed, 0.02)
      if (!out.quality.passed && out.prominence < ESTIMATE_MIN_PROMINENCE) expect(out.estimateBpm).toBeNull()
    }
  })

  test('a passed reading reports the same number as its estimate', () => {
    const { r, g, b } = synthRgb({ bpm: 72, fps: FPS, seconds: 30, harmonic: 0.6 })
    const out = estimateHeartRate({ r, g, b, fps: FPS, ...clean })
    expect(out.quality.passed).toBe(true)
    expect(out.estimateBpm).toBe(out.bpm)
  })

  test('motion, lighting and lost-face failures never offer an estimate, because the signal is contaminated', () => {
    const { r, g, b } = synthRgb({ bpm: 72, fps: FPS, seconds: 30 })
    for (const bad of [{ motion: 0.08 }, { meanLuma: 20 }, { faceLostFraction: 0.4 }]) {
      expect(estimateHeartRate({ r, g, b, fps: FPS, ...clean, ...bad }).estimateBpm).toBeNull()
    }
  })

  test('across 100 pulse-free noise captures, an estimate appears rarely (under 5%)', () => {
    let estimates = 0
    for (let seed = 1; seed <= 100; seed++) {
      const { r, g, b } = synthRgb({ bpm: 72, fps: FPS, seconds: 40, pulseScale: 0, noise: 0.01, seed })
      if (estimateHeartRate({ r, g, b, fps: FPS, ...clean }).estimateBpm !== null) estimates++
    }
    expect(estimates).toBeLessThan(5)
  })
})

