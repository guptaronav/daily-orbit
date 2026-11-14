import { describe, expect, test } from 'vitest'
import { retakeAdvice } from './retake'

describe('retakeAdvice', () => {
  test('every failure reason gives its own specific, actionable fix', () => {
    const reasons = ['lighting', 'motion', 'faceLost', 'lowSignal', 'other'] as const
    const advice = reasons.map(retakeAdvice)
    expect(advice.every((a) => a.length > 10)).toBe(true)
    expect(new Set(advice).size).toBe(reasons.length)
  })

  test('names the fix for the common cases', () => {
    expect(retakeAdvice('lighting')).toMatch(/light/i)
    expect(retakeAdvice('motion')).toMatch(/still/i)
    expect(retakeAdvice('faceLost')).toMatch(/closer|camera/i)
  })

  test('an unknown or missing reason still gives usable advice', () => {
    expect(retakeAdvice(undefined).length).toBeGreaterThan(10)
  })
})
