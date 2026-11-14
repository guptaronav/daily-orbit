import { describe, expect, test } from 'vitest'
import { analyzeCapture } from './analyze'
import type { Assembled } from './assemble'
import { synthRgb } from './synth'

function assembled(over: Partial<Assembled> = {}): Assembled {
  const { r, g, b } = synthRgb({ bpm: 72, fps: 30, seconds: 30 })
  // 4 blinks in 30 s: 6 closed frames each, otherwise open.
  const left = new Array(900).fill(0.05)
  ;[100, 300, 500, 700].forEach((s) => left.fill(0.9, s, s + 6))
  return {
    fps: 30,
    targetFps: 30,
    r,
    g,
    b,
    motion: 0.005,
    meanLuma: 130,
    faceLostFraction: 0,
    blink: { left, right: [...left], fps: 30 },
    frames: 900,
    seconds: 30,
    ...over,
  }
}

describe('analyzeCapture', () => {
  test('a good capture gives a passed heart rate near the true value and blink metrics', () => {
    const out = analyzeCapture(assembled())
    expect(out.heartRate.quality.passed).toBe(true)
    expect(Math.abs(out.heartRate.bpm! - 72)).toBeLessThanOrEqual(2)
    expect(out.blink.quality.passed).toBe(true)
    expect(out.blink.blinkRate).toBeCloseTo(8, 0) // 4 blinks in 30 s
  })

  test('diagnostics expose why a reading passed or failed', () => {
    const d = analyzeCapture(assembled({ motion: 0.08 })).diagnostics
    expect(d).toMatchObject({ seconds: 30, frames: 900, fps: 30, motion: 0.08, meanLuma: 130, faceLostFraction: 0 })
    expect(d.prominence).toBeGreaterThan(0.7)
    expect(Math.abs(d.candidateBpm! - 72)).toBeLessThanOrEqual(2)
  })

  test('exposes a compact numbers-only trace for calibration (rounded, same length as the capture)', () => {
    const a = assembled()
    const { trace } = analyzeCapture(a)
    expect(trace.fps).toBe(a.targetFps)
    expect(trace.r).toHaveLength(a.r.length)
    expect(trace.g.every((v) => v === Math.round(v * 100) / 100)).toBe(true)
  })

  test('blink metrics are rounded to one decimal', () => {
    const { blink } = analyzeCapture(assembled())
    expect(blink.blinkRate).toBe(Math.round(blink.blinkRate * 10) / 10)
    expect(blink.eyelidClosurePct).toBe(Math.round(blink.eyelidClosurePct * 10) / 10)
  })

  test('losing the face fails both readings with faceLost', () => {
    const out = analyzeCapture(assembled({ faceLostFraction: 0.4 }))
    expect(out.heartRate.quality).toMatchObject({ passed: false, reason: 'faceLost' })
    expect(out.blink.quality).toMatchObject({ passed: false, reason: 'faceLost' })
  })

  test('a dark room fails both with lighting', () => {
    const out = analyzeCapture(assembled({ meanLuma: 20 }))
    expect(out.heartRate.quality.reason).toBe('lighting')
    expect(out.blink.quality.reason).toBe('lighting')
  })

  test('head motion fails the pulse but not the blink reading', () => {
    const out = analyzeCapture(assembled({ motion: 0.1 }))
    expect(out.heartRate.quality).toMatchObject({ passed: false, reason: 'motion' })
    expect(out.blink.quality.passed).toBe(true)
  })

  test('a capture that was too short fails both rather than reporting noise', () => {
    const out = analyzeCapture(assembled({ seconds: 4, r: [], g: [], b: [] }))
    expect(out.heartRate.quality.passed).toBe(false)
    expect(out.blink.quality.passed).toBe(false)
  })
})
