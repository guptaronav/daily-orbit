import { describe, expect, test } from 'vitest'
import { LADDER, acuityResult, nextStep, type Trial } from './acuity'

const t = (level: number, correct: boolean): Trial => ({ level, correct })

describe('acuity ladder', () => {
  test('has 8 sizes, largest first, strictly shrinking', () => {
    expect(LADDER).toHaveLength(8)
    for (let i = 1; i < LADDER.length; i++) expect(LADDER[i].sizePx).toBeLessThan(LADDER[i - 1].sizePx)
  })

  test('logMAR rises as the optotype shrinks', () => {
    for (let i = 1; i < LADDER.length; i++) expect(LADDER[i].logMar).toBeLessThan(LADDER[i - 1].logMar)
  })
})

describe('nextStep (staircase)', () => {
  const last = LADDER.length - 1

  test('starts at the largest size', () => {
    expect(nextStep([])).toEqual({ done: false, level: 0 })
  })

  test('stays at a size until it has 2 correct answers', () => {
    expect(nextStep([t(0, true)])).toEqual({ done: false, level: 0 })
    expect(nextStep([t(0, true), t(0, false)])).toEqual({ done: false, level: 0 })
  })

  test('moves to the next smaller size after 2 correct', () => {
    expect(nextStep([t(0, true), t(0, true)])).toEqual({ done: false, level: 1 })
  })

  test('stops after 2 wrong answers at the current size', () => {
    expect(nextStep([t(0, true), t(0, true), t(1, false), t(1, false)])).toMatchObject({ done: true })
  })

  test('stops after 2 correct at the smallest size', () => {
    expect(nextStep([t(last, true), t(last, true)])).toMatchObject({ done: true })
  })
})

describe('acuityResult', () => {
  test('is the smallest size answered correctly at least 2 of 3 times', () => {
    const history = [t(0, true), t(0, true), t(1, true), t(1, false), t(1, true), t(2, false), t(2, false), t(2, true)]
    expect(acuityResult(history)?.level).toBe(1)
  })

  test('returns null when no size reached 2 of 3 correct', () => {
    expect(acuityResult([t(0, false), t(0, false), t(0, true)])).toBeNull()
  })

  test('ignores a size with fewer than 3 trials unless 2 are already correct', () => {
    expect(acuityResult([t(0, true), t(0, true)])?.level).toBe(0)
    expect(acuityResult([t(0, true)])).toBeNull()
  })
})
