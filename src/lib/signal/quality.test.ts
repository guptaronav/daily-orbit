import { describe, expect, test } from 'vitest'
import { mulberry32 } from '../sim/rng'
import { faceLostFraction, lightingOk, motionScore, type Pt } from './quality'

const FACE_WIDTH = 0.3 // normalized image units

function wander(amplitude: number, n = 600, seed = 3): Pt[] {
  const rand = mulberry32(seed)
  return Array.from({ length: n }, () => ({ x: 0.5 + (rand() - 0.5) * 2 * amplitude, y: 0.5 + (rand() - 0.5) * 2 * amplitude }))
}

describe('motionScore', () => {
  test('a still head scores well under the 3% limit', () => {
    expect(motionScore(wander(0.002), FACE_WIDTH)).toBeLessThan(0.03)
  })

  test('a moving head scores over the 3% limit', () => {
    expect(motionScore(wander(0.03), FACE_WIDTH)).toBeGreaterThan(0.03)
  })

  test('no points or a zero face width is treated as maximum motion, never NaN', () => {
    expect(motionScore([], FACE_WIDTH)).toBe(Infinity)
    expect(motionScore(wander(0.002), 0)).toBe(Infinity)
  })
})

describe('lightingOk', () => {
  test('fails when too dark or blown out, passes in between', () => {
    expect(lightingOk(20)).toBe('dark')
    expect(lightingOk(250)).toBe('bright')
    expect(lightingOk(130)).toBe('ok')
  })
})

describe('faceLostFraction', () => {
  test('is the share of frames without a face', () => {
    expect(faceLostFraction([true, true, false, true])).toBe(0.25)
    expect(faceLostFraction([])).toBe(1)
  })
})
