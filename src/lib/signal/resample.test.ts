import { describe, expect, test } from 'vitest'
import { effectiveFps, resampleUniform } from './resample'

describe('effectiveFps', () => {
  test('is frames per second over the capture, not the nominal rate', () => {
    expect(effectiveFps([0, 0.1, 0.2, 0.3, 0.4])).toBeCloseTo(10, 5)
  })
  test('is 0 with fewer than two samples', () => {
    expect(effectiveFps([])).toBe(0)
    expect(effectiveFps([1])).toBe(0)
  })
})

describe('resampleUniform', () => {
  test('a linear ramp sampled unevenly comes back as the same ramp on a uniform clock', () => {
    const times = [0, 0.03, 0.07, 0.1, 0.16, 0.2, 0.25, 0.3]
    const out = resampleUniform(times, times.map((t) => 10 * t), 10)
    expect(out).toHaveLength(4) // t = 0, 0.1, 0.2, 0.3
    out.forEach((v, i) => expect(v).toBeCloseTo(i, 6))
  })

  test('length follows the duration and target rate', () => {
    const times = Array.from({ length: 31 }, (_, i) => i / 30)
    expect(resampleUniform(times, times.map(() => 1), 30)).toHaveLength(31)
  })

  test('keeps a constant signal constant', () => {
    const times = [0, 0.05, 0.11, 0.18, 0.3]
    resampleUniform(times, [5, 5, 5, 5, 5], 20).forEach((v) => expect(v).toBeCloseTo(5, 9))
  })

  test('fewer than two samples returns a copy, never NaN', () => {
    expect(resampleUniform([], [], 30)).toEqual([])
    expect(resampleUniform([0], [7], 30)).toEqual([7])
  })

  test('mismatched inputs are refused instead of producing garbage', () => {
    expect(() => resampleUniform([0, 1], [1], 30)).toThrow()
  })
})
