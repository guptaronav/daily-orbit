import { describe, expect, test } from 'vitest'
import { pos } from './pos'
import { dominantFrequency } from './spectrum'
import { synthRgb } from './synth'

describe('pos (plane-orthogonal-to-skin rPPG)', () => {
  test('recovers a 72 bpm pulse within 1.5 bpm', () => {
    const { r, g, b } = synthRgb({ bpm: 72, fps: 30, seconds: 30 })
    const { freq } = dominantFrequency(pos(r, g, b, 30), 30)
    expect(Math.abs(freq * 60 - 72)).toBeLessThan(1.5)
  })

  test('is not fooled by common-mode illumination drift alone', () => {
    const { r, g, b } = synthRgb({ bpm: 72, fps: 30, seconds: 30, pulseScale: 0, drift: 0.1 })
    expect(dominantFrequency(pos(r, g, b, 30), 30).prominence).toBeLessThan(0.3)
  })

  test('returns zeros when the capture is shorter than one window', () => {
    expect(pos([1, 2, 3], [1, 2, 3], [1, 2, 3], 30).every((v) => v === 0)).toBe(true)
  })

  test('output has the same length as the input', () => {
    const { r, g, b } = synthRgb({ bpm: 80, fps: 30, seconds: 12 })
    expect(pos(r, g, b, 30)).toHaveLength(r.length)
  })
})
