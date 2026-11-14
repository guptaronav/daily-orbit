import { describe, expect, test } from 'vitest'
import { cellKey, nextCell, summarizeAmsler } from './amsler'

const N = 10 // 10 x 10 grid

describe('summarizeAmsler', () => {
  test('no marked cells means no distortion', () => {
    expect(summarizeAmsler(new Set(), N)).toEqual({ distortion: false, distortedCells: 0, fraction: 0, centralAffected: false })
  })

  test('counts marked cells and reports the fraction of the grid', () => {
    const marked = new Set([cellKey(0, 0), cellKey(0, 1), cellKey(9, 9)])
    const out = summarizeAmsler(marked, N)
    expect(out.distortion).toBe(true)
    expect(out.distortedCells).toBe(3)
    expect(out.fraction).toBeCloseTo(0.03, 5)
  })

  test('a mark in the central 3x3 flags central involvement', () => {
    expect(summarizeAmsler(new Set([cellKey(4, 4)]), N).centralAffected).toBe(true)
    expect(summarizeAmsler(new Set([cellKey(5, 5)]), N).centralAffected).toBe(true)
  })

  test('marks only at the edge are not central', () => {
    expect(summarizeAmsler(new Set([cellKey(0, 0), cellKey(9, 9)]), N).centralAffected).toBe(false)
  })

  test('cells outside the grid are ignored, never counted', () => {
    const out = summarizeAmsler(new Set([cellKey(-1, 0), cellKey(0, 10), cellKey(2, 2)]), N)
    expect(out.distortedCells).toBe(1)
  })
})

describe('nextCell (keyboard movement on the grid)', () => {
  test('arrow keys move one square', () => {
    expect(nextCell({ row: 4, col: 4 }, 'ArrowUp', N)).toEqual({ row: 3, col: 4 })
    expect(nextCell({ row: 4, col: 4 }, 'ArrowDown', N)).toEqual({ row: 5, col: 4 })
    expect(nextCell({ row: 4, col: 4 }, 'ArrowLeft', N)).toEqual({ row: 4, col: 3 })
    expect(nextCell({ row: 4, col: 4 }, 'ArrowRight', N)).toEqual({ row: 4, col: 5 })
  })

  test('stops at the edges instead of wrapping or leaving the grid', () => {
    expect(nextCell({ row: 0, col: 0 }, 'ArrowUp', N)).toEqual({ row: 0, col: 0 })
    expect(nextCell({ row: 0, col: 0 }, 'ArrowLeft', N)).toEqual({ row: 0, col: 0 })
    expect(nextCell({ row: 9, col: 9 }, 'ArrowDown', N)).toEqual({ row: 9, col: 9 })
    expect(nextCell({ row: 9, col: 9 }, 'ArrowRight', N)).toEqual({ row: 9, col: 9 })
  })

  test('Home and End jump to the ends of the row', () => {
    expect(nextCell({ row: 3, col: 6 }, 'Home', N)).toEqual({ row: 3, col: 0 })
    expect(nextCell({ row: 3, col: 6 }, 'End', N)).toEqual({ row: 3, col: 9 })
  })

  test('any other key returns null so the browser keeps its normal behavior', () => {
    expect(nextCell({ row: 3, col: 3 }, 'a', N)).toBeNull()
    expect(nextCell({ row: 3, col: 3 }, 'Tab', N)).toBeNull()
    expect(nextCell({ row: 3, col: 3 }, ' ', N)).toBeNull()
  })
})
