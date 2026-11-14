import { describe, expect, test } from 'vitest'
import { sine, whiteNoise } from './synth'
import { dominantFrequency } from './spectrum'

describe('dominantFrequency', () => {
  test('finds a 1.2 Hz sine and reports a strong peak', () => {
    const { freq, prominence } = dominantFrequency(sine(1.2, 30, 30), 30)
    expect(freq).toBeCloseTo(1.2, 1)
    expect(Math.abs(freq - 1.2)).toBeLessThan(0.05)
    expect(prominence).toBeGreaterThan(0.7)
  })

  test('white noise has no convincing peak', () => {
    const { prominence } = dominantFrequency(whiteNoise(30, 30), 30)
    expect(prominence).toBeLessThan(0.3)
  })

  test('ignores a strong component outside the heart-rate band', () => {
    // 0.3 Hz is below the 0.7 Hz floor, 1.5 Hz is in band and smaller.
    const mixed = sine(0.3, 30, 30, 5).map((v, i) => v + sine(1.5, 30, 30, 1)[i])
    expect(Math.abs(dominantFrequency(mixed, 30).freq - 1.5)).toBeLessThan(0.05)
  })

  test('an all-zero signal has zero prominence instead of NaN', () => {
    const { prominence } = dominantFrequency(new Array(900).fill(0), 30)
    expect(prominence).toBe(0)
  })
})
