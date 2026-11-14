import { describe, expect, test } from 'vitest'
import { sine, whiteNoise } from './synth'
import { MIN_PROMINENCE } from './constants'
import { dominantFrequency } from './spectrum'

describe('dominantFrequency', () => {
  test('finds a 1.2 Hz sine and reports a strong peak', () => {
    const { freq, prominence } = dominantFrequency(sine(1.2, 30, 30), 30)
    expect(freq).toBeCloseTo(1.2, 1)
    expect(Math.abs(freq - 1.2)).toBeLessThan(0.05)
    expect(prominence).toBeGreaterThan(0.7)
  })

  test('a real pulse waveform (fundamental plus second harmonic) counts the harmonic as signal', () => {
    const fund = sine(1.2, 30, 40)
    const harm = sine(2.4, 30, 40)
    const both = fund.map((v, i) => v + harm[i])
    const { freq, prominence } = dominantFrequency(both, 30)
    expect(Math.abs(freq - 1.2)).toBeLessThan(0.03) // reports the fundamental, not the harmonic
    expect(prominence).toBeGreaterThan(0.8)
  })

  test('a genuine fast pulse (2.4 Hz = 144 bpm) is not wrongly halved', () => {
    expect(Math.abs(dominantFrequency(sine(2.4, 30, 40), 30).freq - 2.4)).toBeLessThanOrEqual(0.02)
  })

  test('the reported frequency stays precise (within 0.02 Hz, about 1 bpm) on a 40 s capture', () => {
    for (const hz of [0.95, 1.13, 1.47, 2.03]) {
      expect(Math.abs(dominantFrequency(sine(hz, 30, 40), 30).freq - hz)).toBeLessThanOrEqual(0.02)
    }
  })

  test('noise margin guard: across 60 noise-only signals the score stays well under the pass line', () => {
    let worst = 0
    for (let seed = 1; seed <= 60; seed++) worst = Math.max(worst, dominantFrequency(whiteNoise(30, 40, seed), 30).prominence)
    expect(worst).toBeLessThan(MIN_PROMINENCE - 0.05)
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
