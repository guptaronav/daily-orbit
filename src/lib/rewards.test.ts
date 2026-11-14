import { describe, expect, it } from 'vitest'
import type { GameEvent, GameEventKind } from '../contract/types'
import {
  activityHeatmap,
  badgesFor,
  dropAvailable,
  MILESTONE_DAYS,
  milestonesFor,
  msToNextDay,
  PASS_TIERS,
  passProgress,
  shieldsFor,
  weeklyChallenge,
  WEEKLY_TARGET,
} from './rewards'
import { POINTS } from './scoring'

const NOW = new Date('2026-11-15T12:00:00.000Z')
const DAY_MS = 86_400_000

const ev = (kind: GameEventKind, daysAgo: number, detail?: string, i = 0): GameEvent => ({
  id: `${kind}-${daysAgo}-${detail ?? ''}-${i}`,
  crewId: 'crew-1',
  timestamp: new Date(NOW.getTime() - daysAgo * DAY_MS).toISOString(),
  kind,
  ...(detail ? { detail } : {}),
})

describe('activityHeatmap', () => {
  it('returns one cell per day, oldest first, ending today', () => {
    const cells = activityHeatmap([], NOW, 30)
    expect(cells).toHaveLength(30)
    expect(cells[29].day).toBe('2026-11-15')
    expect(new Date(cells[0].day) < new Date(cells[29].day)).toBe(true)
  })

  it('is all empty with no events', () => {
    expect(activityHeatmap([], NOW).every((c) => !c.done && c.count === 0)).toBe(true)
  })

  it('marks the days something was credited', () => {
    const cells = activityHeatmap([ev('checkInComplete', 0), ev('exerciseComplete', 2)], NOW)
    expect(cells[29].done).toBe(true)
    expect(cells[27].done).toBe(true)
    expect(cells[28].done).toBe(false)
  })

  it('counts credited events only, so farming one kind does not darken a cell further', () => {
    const spam = Array.from({ length: 9 }, (_, i) => ev('checkInComplete', 0, undefined, i))
    expect(activityHeatmap(spam, NOW)[29].count).toBe(1)
  })

  it('ignores events older than the window', () => {
    expect(activityHeatmap([ev('checkInComplete', 90)], NOW).some((c) => c.done)).toBe(false)
  })
})

describe('weeklyChallenge', () => {
  it('is zero with nothing logged', () => {
    expect(weeklyChallenge([], NOW)).toMatchObject({ days: 0, met: false, target: WEEKLY_TARGET })
  })

  it('counts distinct days, not events', () => {
    const sameDay = [ev('checkInComplete', 1, undefined, 1), ev('exerciseComplete', 1, undefined, 2)]
    expect(weeklyChallenge(sameDay, NOW).days).toBe(1)
  })

  it('is met at the target and not before', () => {
    const days = (n: number) => Array.from({ length: n }, (_, i) => ev('checkInComplete', i))
    expect(weeklyChallenge(days(WEEKLY_TARGET - 1), NOW).met).toBe(false)
    expect(weeklyChallenge(days(WEEKLY_TARGET), NOW).met).toBe(true)
  })

  it('ignores anything outside the last seven days', () => {
    expect(weeklyChallenge([ev('checkInComplete', 20)], NOW).days).toBe(0)
  })
})

describe('shieldsFor', () => {
  it('awards one shield per full week and never goes negative', () => {
    expect(shieldsFor(0)).toBe(0)
    expect(shieldsFor(6)).toBe(0)
    expect(shieldsFor(7)).toBe(1)
    expect(shieldsFor(20)).toBe(2)
    expect(shieldsFor(-5)).toBe(0)
  })
})

describe('passProgress', () => {
  it('starts at tier 1 and climbs on the threshold', () => {
    expect(passProgress(0).tier.n).toBe(1)
    for (const t of PASS_TIERS) expect(passProgress(t.at).tier.n, `at ${t.at}`).toBe(t.n)
  })

  it('reports what is left to the next tier', () => {
    const p = passProgress(100)
    expect(p.tier.n).toBe(2)
    expect(p.next?.n).toBe(3)
    expect(p.toNext).toBe(80)
  })

  it('saturates at the last tier', () => {
    const top = PASS_TIERS[PASS_TIERS.length - 1]
    const p = passProgress(top.at + 10_000)
    expect(p.tier.n).toBe(top.n)
    expect(p.next).toBeNull()
    expect(p.toNext).toBeNull()
  })
})

describe('dropAvailable', () => {
  it('is available when nothing was opened today', () => {
    expect(dropAvailable([], NOW)).toBe(true)
    expect(dropAvailable([ev('supplyDrop', 1)], NOW)).toBe(true)
  })

  it('is spent once opened today', () => {
    expect(dropAvailable([ev('supplyDrop', 0)], NOW)).toBe(false)
  })

  it('is not spent by some other kind of event', () => {
    expect(dropAvailable([ev('checkInComplete', 0)], NOW)).toBe(true)
  })
})

describe('msToNextDay', () => {
  it('is positive and no more than a day away', () => {
    const ms = msToNextDay(NOW)
    expect(ms).toBeGreaterThan(0)
    expect(ms).toBeLessThanOrEqual(DAY_MS)
  })
})

describe('milestonesFor', () => {
  it('lists every milestone, unreached at zero streak', () => {
    const list = milestonesFor(0, [])
    expect(list.map((m) => m.days)).toEqual(MILESTONE_DAYS)
    expect(list.every((m) => !m.reached && !m.claimed)).toBe(true)
  })

  it('reaches a milestone exactly on the day count', () => {
    expect(milestonesFor(7, []).find((m) => m.days === 7)?.reached).toBe(true)
    expect(milestonesFor(6, []).find((m) => m.days === 7)?.reached).toBe(false)
  })

  it('marks one as claimed once its own event exists, and not the others', () => {
    const list = milestonesFor(30, [ev('streakMilestone', 0, 'streak-7')])
    expect(list.find((m) => m.days === 7)?.claimed).toBe(true)
    expect(list.find((m) => m.days === 14)?.claimed).toBe(false)
  })

  it('pays the streak milestone rate', () => {
    expect(milestonesFor(3, [])[0].coins).toBe(POINTS.streakMilestone)
  })
})

describe('badgesFor', () => {
  it('earns nothing with no history', () => {
    expect(badgesFor([], 0).every((b) => !b.earned)).toBe(true)
  })

  it('earns a badge for each thing actually done', () => {
    const list = badgesFor([ev('symptomReported', 0), ev('supplyDrop', 0)], 0)
    expect(list.find((b) => b.id === 'honest')?.earned).toBe(true)
    expect(list.find((b) => b.id === 'crate')?.earned).toBe(true)
    expect(list.find((b) => b.id === 'mover')?.earned).toBe(false)
  })

  it('earns the streak badges from the streak alone', () => {
    const list = badgesFor([], 14)
    expect(list.find((b) => b.id === 'week')?.earned).toBe(true)
    expect(list.find((b) => b.id === 'fortnight')?.earned).toBe(true)
  })

  it('has no badge whose name or description mentions a healthy value', () => {
    for (const b of badgesFor([], 30)) {
      expect(`${b.name} ${b.desc}`.toLowerCase()).not.toMatch(/(healthy|fit|good reading|normal range|low|high|best|improved)/)
    }
  })
})
