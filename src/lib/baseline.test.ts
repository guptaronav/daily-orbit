import { describe, expect, test } from 'vitest'
import { computeBaseline } from './baseline'

describe('computeBaseline', () => {
  test('returns null with fewer than 5 values', () => {
    expect(computeBaseline([60, 62, 61, 63])).toBeNull()
  })

  test('computes mean and sample sd', () => {
    const b = computeBaseline([2, 4, 4, 4, 5, 5, 7, 9])!
    expect(b.n).toBe(8)
    expect(b.mean).toBeCloseTo(5, 10)
    expect(b.sd).toBeCloseTo(2.138, 3)
  })

  test('natural variability is not swallowed by the floor: a body temperature baseline keeps its small spread', () => {
    const temps = Array.from({ length: 30 }, (_, i) => 36.6 + ((i % 5) - 2) * 0.1) // 36.4 to 36.8
    expect(computeBaseline(temps)!.sd).toBeLessThan(0.4)
  })

  test('floors sd so a perfectly flat history does not divide by zero', () => {
    const b = computeBaseline([60, 60, 60, 60, 60])!
    expect(b.sd).toBeGreaterThan(0)
  })
})
