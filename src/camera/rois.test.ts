import { describe, expect, test } from 'vitest'
import { faceWidth, roiRects, type Landmark } from './rois'

const W = 640
const H = 480

// A plausible upright face. Only the indices roiRects uses need real values.
function face(scale = 1): Landmark[] {
  const pts: Landmark[] = Array.from({ length: 478 }, () => ({ x: 0.5, y: 0.5 }))
  const at = (i: number, x: number, y: number) => (pts[i] = { x: 0.5 + (x - 0.5) * scale, y: 0.5 + (y - 0.5) * scale })
  at(10, 0.5, 0.2) // top of forehead
  at(168, 0.5, 0.4) // between the eyes
  at(152, 0.5, 0.8) // chin
  at(234, 0.3, 0.5) // face edge, image left
  at(454, 0.7, 0.5) // face edge, image right
  at(33, 0.4, 0.42) // eye outer corner, image left
  at(263, 0.6, 0.42) // eye outer corner, image right
  at(61, 0.43, 0.65) // mouth corner, image left
  at(291, 0.57, 0.65) // mouth corner, image right
  return pts
}

describe('faceWidth', () => {
  test('is the distance between the two face-edge landmarks', () => {
    expect(faceWidth(face())).toBeCloseTo(0.4, 5)
  })
})

describe('roiRects', () => {
  test('returns forehead and both cheeks', () => {
    const rects = roiRects(face(), W, H)!
    expect(Object.keys(rects).sort()).toEqual(['forehead', 'leftCheek', 'rightCheek'])
  })

  test('forehead sits above the cheeks and the cheeks are left and right of center', () => {
    const r = roiRects(face(), W, H)!
    expect(r.forehead.y + r.forehead.h).toBeLessThan(r.leftCheek.y)
    expect(r.leftCheek.x + r.leftCheek.w).toBeLessThan(W / 2)
    expect(r.rightCheek.x).toBeGreaterThan(W / 2)
  })

  test('every rectangle has a positive whole-pixel size and stays inside the image', () => {
    for (const r of Object.values(roiRects(face(), W, H)!)) {
      expect(Number.isInteger(r.x) && Number.isInteger(r.y) && Number.isInteger(r.w) && Number.isInteger(r.h)).toBe(true)
      expect(r.w).toBeGreaterThan(0)
      expect(r.h).toBeGreaterThan(0)
      expect(r.x).toBeGreaterThanOrEqual(0)
      expect(r.y).toBeGreaterThanOrEqual(0)
      expect(r.x + r.w).toBeLessThanOrEqual(W)
      expect(r.y + r.h).toBeLessThanOrEqual(H)
    }
  })

  test('rectangles shrink when the face is farther from the camera', () => {
    const near = roiRects(face(1), W, H)!
    const far = roiRects(face(0.5), W, H)!
    expect(far.forehead.w).toBeLessThan(near.forehead.w * 0.6)
    expect(far.leftCheek.w).toBeLessThan(near.leftCheek.w * 0.6)
  })

  test('a face at the image edge is clamped, never out of bounds', () => {
    const shifted = face().map((p) => ({ x: p.x + 0.4, y: p.y }))
    for (const r of Object.values(roiRects(shifted, W, H)!)) expect(r.x + r.w).toBeLessThanOrEqual(W)
  })

  test('too few landmarks or a zero-width face returns null instead of throwing', () => {
    expect(roiRects([{ x: 0.5, y: 0.5 }], W, H)).toBeNull()
    expect(roiRects(face(0), W, H)).toBeNull()
  })
})
