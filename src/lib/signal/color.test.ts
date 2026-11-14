import { describe, expect, test } from 'vitest'
import { lumaOf, meanRgb } from './color'

describe('meanRgb', () => {
  test('averages RGBA pixel data and ignores alpha', () => {
    // two pixels: (10, 20, 30, 255) and (30, 40, 50, 0)
    const data = new Uint8ClampedArray([10, 20, 30, 255, 30, 40, 50, 0])
    expect(meanRgb(data)).toEqual({ r: 20, g: 30, b: 40 })
  })

  test('empty data is all zeros, never NaN', () => {
    expect(meanRgb(new Uint8ClampedArray([]))).toEqual({ r: 0, g: 0, b: 0 })
  })
})

describe('lumaOf', () => {
  test('white is 255, black is 0, green is brighter than blue', () => {
    expect(lumaOf({ r: 255, g: 255, b: 255 })).toBeCloseTo(255, 5)
    expect(lumaOf({ r: 0, g: 0, b: 0 })).toBe(0)
    expect(lumaOf({ r: 0, g: 200, b: 0 })).toBeGreaterThan(lumaOf({ r: 0, g: 0, b: 200 }))
  })
})
