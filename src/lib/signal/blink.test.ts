import { describe, expect, test } from 'vitest'
import { blinkMetrics } from './blink'

const FPS = 30

// 20 s, `blinks` evenly spaced blinks each `frames` long at score 0.9, otherwise 0.05.
function series(blinks: number, frames = 6, seconds = 20) {
  const n = FPS * seconds
  const left = new Array(n).fill(0.05)
  const gap = Math.floor(n / (blinks + 1))
  for (let b = 1; b <= blinks; b++) for (let k = 0; k < frames; k++) left[b * gap + k] = 0.9
  return { left, right: [...left] }
}

describe('blinkMetrics', () => {
  test('counts 4 blinks in 20 s as 12 per minute', () => {
    const { blinkRate } = blinkMetrics(series(4), FPS)
    expect(Math.abs(blinkRate - 12)).toBeLessThanOrEqual(1)
  })

  test('eyelid closure is the share of closed frames', () => {
    const { eyelidClosurePct } = blinkMetrics(series(4), FPS)
    expect(eyelidClosurePct).toBeCloseTo((4 * 6 * 100) / 600, 1)
  })

  test('no blinks gives zero rate and zero closure', () => {
    expect(blinkMetrics(series(0), FPS)).toEqual({ blinkRate: 0, eyelidClosurePct: 0 })
  })

  test('a flickering score around the threshold counts as one blink (hysteresis)', () => {
    const left = new Array(300).fill(0.05)
    ;[0.55, 0.45, 0.55, 0.45, 0.55].forEach((v, k) => (left[100 + k] = v))
    expect(blinkMetrics({ left, right: [...left] }, FPS).blinkRate).toBeCloseTo(6, 0) // 1 blink in 10 s
  })

  test('empty input is zeros, never NaN', () => {
    expect(blinkMetrics({ left: [], right: [] }, FPS)).toEqual({ blinkRate: 0, eyelidClosurePct: 0 })
  })
})
