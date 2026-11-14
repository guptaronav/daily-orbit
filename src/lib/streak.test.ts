import { describe, expect, test } from 'vitest'
import type { GameEvent } from '../contract/types'
import { checkInDays, currentStreak } from './streak'

const TODAY = '2026-11-14'
// Days relative to TODAY as ISO date strings: d(0) = today, d(1) = yesterday, ...
const d = (n: number) => new Date(Date.UTC(2026, 10, 14 - n)).toISOString().slice(0, 10)

describe('currentStreak (forgiving: one missed day per week is fine)', () => {
  test('no check-ins is zero', () => {
    expect(currentStreak([], TODAY)).toBe(0)
  })

  test('consecutive days including today', () => {
    expect(currentStreak([d(0), d(1), d(2), d(3), d(4)], TODAY)).toBe(5)
  })

  test("today not checked in yet doesn't break the streak", () => {
    expect(currentStreak([d(1), d(2), d(3)], TODAY)).toBe(3)
  })

  test('one missed day in the middle is forgiven', () => {
    expect(currentStreak([d(0), d(1), d(2), d(4), d(5)], TODAY)).toBe(5)
  })

  test('two missed days within a week break the streak at the second miss', () => {
    // misses on d(3) and d(6): the walk back stops at d(6), so only the days newer than it count.
    expect(currentStreak([d(0), d(1), d(2), d(4), d(5), d(7), d(8)], TODAY)).toBe(5)
  })

  test('two misses more than a week apart are both forgiven', () => {
    const days = [0, 1, 2, 4, 5, 6, 7, 8, 9, 10, 12, 13].map(d) // misses at 3 and 11 (8 days apart)
    expect(currentStreak(days, TODAY)).toBe(12)
  })

  test('one missed day after the last check-in keeps the streak alive', () => {
    expect(currentStreak([d(2), d(3), d(4)], TODAY)).toBe(3) // yesterday missed, today still pending
  })

  test('two missed days in a row ends the streak', () => {
    expect(currentStreak([d(3), d(4), d(5)], TODAY)).toBe(0) // d(1) and d(2) missed
  })

  test('duplicate days count once', () => {
    expect(currentStreak([d(0), d(0), d(1)], TODAY)).toBe(2)
  })
})

describe('checkInDays', () => {
  const ev = (kind: GameEvent['kind'], iso: string, crewId = 'crew-1'): GameEvent => ({ id: `${kind}${iso}${crewId}`, crewId, kind, timestamp: iso })

  test('unique ISO dates of check-ins for that crew member only, oldest first', () => {
    const events = [
      ev('checkInComplete', '2026-11-13T09:00:00Z'),
      ev('checkInComplete', '2026-11-12T20:00:00Z'),
      ev('checkInComplete', '2026-11-13T21:00:00Z'), // same day twice counts once
      ev('exerciseComplete', '2026-11-11T09:00:00Z'), // not a check-in
      ev('checkInComplete', '2026-11-10T09:00:00Z', 'crew-2'), // someone else
    ]
    expect(checkInDays(events, 'crew-1')).toEqual(['2026-11-12', '2026-11-13'])
  })

  test('no check-ins is an empty list', () => {
    expect(checkInDays([], 'crew-1')).toEqual([])
  })
})
