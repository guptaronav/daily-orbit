import { describe, expect, it } from 'vitest'
import type { GameEvent, GameEventKind } from '../contract/types'
import { coinsFor, doneToday, levelFor, RANKS } from './levels'

const NOW = new Date('2026-11-15T12:00:00.000Z')
const DAY_MS = 86_400_000

const event = (kind: GameEventKind, daysAgo: number, i = 0): GameEvent => ({
  id: `${kind}-${daysAgo}-${i}`,
  crewId: 'crew-1',
  timestamp: new Date(NOW.getTime() - daysAgo * DAY_MS).toISOString(),
  kind,
})

describe('RANKS', () => {
  it('starts at zero and climbs', () => {
    expect(RANKS[0].at).toBe(0)
    for (let i = 1; i < RANKS.length; i++) {
      expect(RANKS[i].at).toBeGreaterThan(RANKS[i - 1].at)
      expect(RANKS[i].level).toBe(RANKS[i - 1].level + 1)
    }
  })
})

describe('levelFor', () => {
  it('starts everyone at level 1 with nothing earned', () => {
    expect(levelFor(0)).toMatchObject({ level: 1, title: 'Cadet', into: 0, pct: 0 })
  })

  it('clamps a negative total instead of going below level 1', () => {
    expect(levelFor(-50).level).toBe(1)
    expect(levelFor(-50).into).toBe(0)
  })

  it('levels up exactly on the threshold, not one point late', () => {
    for (const rank of RANKS) {
      expect(levelFor(rank.at).level, `at ${rank.at}`).toBe(rank.level)
      if (rank.at > 0) expect(levelFor(rank.at - 1).level).toBe(rank.level - 1)
    }
  })

  it('reports progress inside the current level', () => {
    const s = levelFor(335) // level 4 starts at 300, level 5 at 550
    expect(s).toMatchObject({ level: 4, title: 'Navigator', into: 35, span: 250, toNext: 215 })
    expect(s.pct).toBeCloseTo(35 / 250, 5)
    expect(s.next?.level).toBe(5)
  })

  it('saturates at the top rank instead of promising a level that does not exist', () => {
    const top = RANKS[RANKS.length - 1]
    const s = levelFor(top.at + 5000)
    expect(s.level).toBe(top.level)
    expect(s.toNext).toBeNull()
    expect(s.next).toBeNull()
    expect(s.pct).toBe(1)
  })

  it('keeps pct between 0 and 1 across the whole ladder', () => {
    for (let p = 0; p <= 2000; p += 17) {
      const { pct } = levelFor(p)
      expect(pct).toBeGreaterThanOrEqual(0)
      expect(pct).toBeLessThanOrEqual(1)
    }
  })

  it('ignores fractional points rather than showing a fractional total', () => {
    expect(levelFor(60.9).into).toBe(0)
  })
})

describe('coinsFor', () => {
  it('is zero with no events', () => {
    expect(coinsFor([])).toBe(0)
  })

  it('counts each kind once per day, matching the credit cap', () => {
    const farmed = [event('checkInComplete', 0, 1), event('checkInComplete', 0, 2), event('checkInComplete', 0, 3)]
    expect(coinsFor(farmed)).toBe(coinsFor([event('checkInComplete', 0, 1)]))
  })

  it('adds up across days and kinds', () => {
    const coins = coinsFor([event('checkInComplete', 0), event('exerciseComplete', 0), event('checkInComplete', 1)])
    expect(coins).toBe(30) // 10 + 10 + 10
  })

  it('never goes down when an event is added', () => {
    const base = [event('checkInComplete', 2)]
    expect(coinsFor([...base, event('symptomReported', 1)])).toBeGreaterThanOrEqual(coinsFor(base))
  })
})

describe('doneToday', () => {
  it('is false with no events at all', () => {
    expect(doneToday([], NOW)).toBe(false)
  })

  it('is true when something was logged today', () => {
    expect(doneToday([event('checkInComplete', 0)], NOW)).toBe(true)
  })

  it('is false when the last event was yesterday', () => {
    expect(doneToday([event('checkInComplete', 1)], NOW)).toBe(false)
  })
})
