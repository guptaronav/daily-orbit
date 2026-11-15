import { describe, expect, test } from 'vitest'
import { streakWithShields } from './shields'

const run = (from: string, n: number, skip: number[] = []) =>
  Array.from({ length: n }, (_, i) => i)
    .filter((i) => !skip.includes(i))
    .map((i) => new Date(Date.parse(from) + i * 86_400_000).toISOString().slice(0, 10))

describe('streak shields', () => {
  test('earn one shield per seven days in a row', () => {
    expect(streakWithShields(run('2026-11-01', 7), '2026-11-07').shields).toBe(1)
    expect(streakWithShields(run('2026-11-01', 14), '2026-11-14').shields).toBe(2)
  })
  test('a missed day spends a shield and the streak survives, with the save recorded', () => {
    const r = streakWithShields(run('2026-11-01', 14, [10]), '2026-11-14')
    expect(r.streak).toBe(13)
    expect(r.saves).toEqual([{ day: '2026-11-11', streak: 10 }])
  })
  test('without a shield, a missed day ends the streak', () => {
    const r = streakWithShields(run('2026-11-01', 10, [3]), '2026-11-10')
    expect(r.streak).toBe(6)
    expect(r.saves).toEqual([])
  })
  test('today not checked in yet is not a miss', () => {
    expect(streakWithShields(run('2026-11-01', 9), '2026-11-10').streak).toBe(9)
  })
  test('never holds more than two shields', () => {
    expect(streakWithShields(run('2026-10-01', 30), '2026-10-30').shields).toBe(2)
  })
})
