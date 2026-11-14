import { describe, expect, test } from 'vitest'
import { bandpass } from './bandpass'
import { sine } from './synth'

const FPS = 30
const SECONDS = 40

// RMS of the middle of the signal, away from filter edge effects.
const midRms = (x: number[]) => {
  const mid = x.slice(5 * FPS, -5 * FPS)
  return Math.sqrt(mid.reduce((a, v) => a + v * v, 0) / mid.length)
}

describe('bandpass 0.7 to 3.0 Hz', () => {
  const inRms = midRms(sine(1, FPS, SECONDS))

  test('passes 1.2 Hz within 20%', () => {
    const out = midRms(bandpass(sine(1.2, FPS, SECONDS), FPS))
    expect(out / inRms).toBeGreaterThan(0.8)
    expect(out / inRms).toBeLessThan(1.2)
  })

  test('attenuates slow drift (0.2 Hz) by at least 10x', () => {
    expect(midRms(bandpass(sine(0.2, FPS, SECONDS), FPS)) / inRms).toBeLessThan(0.1)
  })

  test('attenuates fast noise (6 Hz) by at least 10x', () => {
    expect(midRms(bandpass(sine(6, FPS, SECONDS), FPS)) / inRms).toBeLessThan(0.1)
  })

  test('removes a constant offset', () => {
    const out = bandpass(sine(1.2, FPS, SECONDS).map((v) => v + 100), FPS)
    const mean = midRms(out.map((v) => v)) // rms ~ signal amplitude, not ~100
    expect(mean).toBeLessThan(2)
  })

  test('returns a same-length array', () => {
    expect(bandpass(sine(1.2, FPS, SECONDS), FPS)).toHaveLength(FPS * SECONDS)
  })
})
