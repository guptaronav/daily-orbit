import { describe, expect, test } from 'vitest'
import { TARGET_FPS, assembleCapture, type FrameSample } from './assemble'
import { mulberry32 } from '../sim/rng'

// ~30 fps with jittered frame times, a pulse-like wiggle in green, a still nose, constant brightness.
function samples(n = 300, jitter = 0.004, seed = 11): FrameSample[] {
  const rand = mulberry32(seed)
  return Array.from({ length: n }, (_, i) => ({
    t: i / 30 + (rand() - 0.5) * 2 * jitter,
    r: 180,
    g: 120 + Math.sin(i / 5),
    b: 100,
    luma: 130,
    nose: { x: 0.5, y: 0.5 },
    faceW: 0.4,
    blinkL: 0.05,
    blinkR: 0.07,
  }))
}

describe('assembleCapture', () => {
  test('resamples the color traces onto a uniform 30 Hz clock', () => {
    const a = assembleCapture(samples(), new Array(300).fill(true))
    expect(a.targetFps).toBe(TARGET_FPS)
    expect(a.r).toHaveLength(a.g.length)
    expect(a.g).toHaveLength(a.b.length)
    expect(Math.abs(a.g.length - 300)).toBeLessThanOrEqual(2)
  })

  test('reports the effective frame rate from timestamps', () => {
    expect(assembleCapture(samples(), new Array(300).fill(true)).fps).toBeGreaterThan(28)
  })

  test('a still nose has very low motion and brightness is averaged', () => {
    const a = assembleCapture(samples(), new Array(300).fill(true))
    expect(a.motion).toBeLessThan(0.001)
    expect(a.meanLuma).toBeCloseTo(130, 5)
  })

  test('face-lost fraction comes from the per-frame flags, including frames with no sample', () => {
    const flags = [...new Array(90).fill(true), ...new Array(10).fill(false)]
    expect(assembleCapture(samples(90), flags).faceLostFraction).toBeCloseTo(0.1, 5)
  })

  test('blink series keep the raw per-frame scores', () => {
    const a = assembleCapture(samples(), new Array(300).fill(true))
    expect(a.blink.left).toHaveLength(300)
    expect(a.blink.left[0]).toBe(0.05)
    expect(a.blink.right[0]).toBe(0.07)
  })

  test('no samples gives empty traces and a fully lost face, never NaN', () => {
    const a = assembleCapture([], [])
    expect(a.r).toEqual([])
    expect(a.faceLostFraction).toBe(1)
    expect(a.seconds).toBe(0)
    expect(Number.isFinite(a.motion) || a.motion === Infinity).toBe(true)
  })
})
