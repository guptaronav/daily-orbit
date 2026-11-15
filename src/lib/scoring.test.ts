import { describe, expect, test } from 'vitest'
import type { GameEvent, GameEventKind, Quality } from '../contract/types'
import { DAILY_COIN_CAP, EVENT_LABEL, POINTS, SYSTEMS, WEEKLY_GOAL_PER_CREW, cappedPoints, creditableKinds, creditedEvents, crewProgress, pointsFor, pointsInWindow, systemsStatus } from './scoring'
import { buildSessionRecords, type MirrorSession } from './session'
import { mulberry32 } from './sim/rng'

const NOW = new Date('2026-11-14T12:00:00Z')
const ev = (kind: GameEventKind, daysAgo = 0, crewId = 'crew-1'): GameEvent => ({
  id: `${kind}-${daysAgo}-${crewId}`,
  crewId,
  kind,
  timestamp: new Date(NOW.getTime() - daysAgo * 86_400_000).toISOString(),
})

describe('pointsFor', () => {
  test('no events is zero', () => {
    expect(pointsFor([])).toBe(0)
  })

  test('each of the four effort events earns points', () => {
    for (const kind of ['checkInComplete', 'symptomReported', 'exerciseComplete', 'retakeAfterQualityFail'] as const) {
      expect(pointsFor([ev(kind)])).toBeGreaterThan(0)
    }
  })

  test('a symptom report always adds credit and never subtracts', () => {
    const base = [ev('checkInComplete'), ev('exerciseComplete')]
    expect(pointsFor([...base, ev('symptomReported')])).toBeGreaterThan(pointsFor(base))
  })

  test('retaking after a failed quality check earns credit', () => {
    expect(pointsFor([ev('checkInComplete'), ev('retakeAfterQualityFail')])).toBeGreaterThan(pointsFor([ev('checkInComplete')]))
  })
})

describe('health values never feed into points (randomized)', () => {
  const GOOD: Quality = { score: 0.9, passed: true }

  function sessionWith(rand: () => number, health: 'good' | 'bad'): MirrorSession {
    const lo = health === 'good' ? 0.7 : 0
    const span = 0.3 // the same effort, only the health values differ
    const v = () => Math.round((lo + rand() * span) * 10 * 10) / 10
    return {
      sessionId: 's',
      heartRate: { bpm: health === 'good' ? 55 + rand() * 15 : 110 + rand() * 60, quality: GOOD, source: 'camera' },
      blink: { blinkRate: health === 'good' ? 15 : 3, eyelidClosurePct: health === 'good' ? 3 : 40, quality: GOOD, source: 'camera' },
      selfReport: { sleepQuality: v(), mood: v(), stress: health === 'good' ? 1 : 9 },
      amsler: {
        left: { distortion: health === 'bad', distortedCells: health === 'bad' ? 7 : 0, fraction: 0, centralAffected: health === 'bad' },
        right: { distortion: false, distortedCells: 0, fraction: 0, centralAffected: false },
      },
      acuity: { logMar: health === 'good' ? 0 : 0.9 },
      symptoms: { symptoms: ['headache'] },
    }
  }

  test('a worse health day never earns fewer points than a better one, across 100 random days', () => {
    const rand = mulberry32(2026)
    for (let i = 0; i < 100; i++) {
      const good = buildSessionRecords(sessionWith(rand, 'good'), 'crew-1', NOW).events
      const bad = buildSessionRecords(sessionWith(rand, 'bad'), 'crew-1', NOW).events
      expect(pointsFor(bad)).toBeGreaterThanOrEqual(pointsFor(good))
    }
  })
})

describe('pointsInWindow', () => {
  test('counts only events inside the last N days, across the whole crew', () => {
    const events = [ev('checkInComplete', 0, 'crew-1'), ev('checkInComplete', 3, 'crew-2'), ev('checkInComplete', 8, 'crew-3')]
    expect(pointsInWindow(events, NOW, 7)).toBe(pointsFor(events.slice(0, 2)))
  })

  test('the weekly goal is a positive number per crew member', () => {
    expect(WEEKLY_GOAL_PER_CREW).toBeGreaterThan(0)
  })
})

describe('systemsStatus', () => {
  test('systems come online as crew points pass their thresholds', () => {
    expect(systemsStatus(0).filter((s) => s.online)).toHaveLength(SYSTEMS.filter((s) => s.threshold === 0).length)
    const everything = systemsStatus(Number.MAX_SAFE_INTEGER)
    expect(everything.every((s) => s.online)).toBe(true)
  })

  test('is monotonic: more points never turns a system off', () => {
    let online = 0
    for (let pts = 0; pts <= 5000; pts += 50) {
      const now = systemsStatus(pts).filter((s) => s.online).length
      expect(now).toBeGreaterThanOrEqual(online)
      online = now
    }
  })
})

describe('crewProgress (shared weekly goal, never per person)', () => {
  test('sums this week across the whole crew against a goal that scales with crew size', () => {
    const events = [ev('checkInComplete', 0, 'crew-1'), ev('exerciseComplete', 2, 'crew-2'), ev('checkInComplete', 9, 'crew-3')]
    const p = crewProgress(events, NOW, 4)
    expect(p.weekPoints).toBe(POINTS.checkInComplete + POINTS.exerciseComplete)
    expect(p.goal).toBe(WEEKLY_GOAL_PER_CREW * 4)
    expect(p.fraction).toBeCloseTo(p.weekPoints / p.goal, 10)
    expect(p.reached).toBe(false)
    expect(p.totalPoints).toBe(pointsFor(events))
  })

  test('the bar caps at 100% but the goal can be exceeded, by genuine effort over several days and people', () => {
    const steps = ['sleep', 'nutrition', 'escalate']
    const real: GameEvent[] = []
    for (const crewId of ['crew-1', 'crew-2']) {
      for (let day = 0; day < 6; day++) {
        for (const kind of Object.keys(POINTS) as GameEventKind[]) {
          for (const detail of kind === 'countermeasureComplete' ? steps : [undefined]) real.push({ ...ev(kind, day, crewId), id: `${crewId}-${day}-${kind}-${detail}`, ...(detail ? { detail } : {}) })
        }
      }
    }
    const p = crewProgress(real, NOW, 2)
    expect(p.fraction).toBe(1)
    expect(p.reached).toBe(true)
    expect(p.weekPoints).toBeGreaterThan(p.goal)
  })

  test('piling events into one day cannot reach the goal', () => {
    const spam = Array.from({ length: 200 }, (_, i) => ({ ...ev('symptomReported', 0), id: `x${i}` }))
    expect(crewProgress(spam, NOW, 2).reached).toBe(false)
  })

  test('an empty crew has no goal and shows zero, never NaN', () => {
    expect(crewProgress([], NOW, 0)).toMatchObject({ weekPoints: 0, goal: 0, fraction: 0, reached: false })
  })

  test('every event kind has a label and positive points, so the credit list can always be explained', () => {
    for (const kind of Object.keys(POINTS) as (keyof typeof POINTS)[]) {
      expect(POINTS[kind]).toBeGreaterThan(0)
      expect(EVENT_LABEL[kind].length).toBeGreaterThan(3)
    }
  })
})

describe('anti-farming: each kind earns credit once per person per day', () => {
  const at = (kind: GameEventKind, iso: string, crewId = 'crew-1', detail?: string): GameEvent => ({
    id: `${kind}-${iso}-${crewId}-${detail ?? ''}-${Math.random()}`,
    crewId,
    kind,
    timestamp: iso,
    ...(detail ? { detail } : {}),
  })

  test('fifty check-ins in one day are worth the same as one', () => {
    const spam = Array.from({ length: 50 }, (_, i) => at('checkInComplete', `2026-11-14T0${i % 9}:${String(i).padStart(2, '0')}:00Z`))
    expect(pointsFor(creditedEvents(spam))).toBe(POINTS.checkInComplete)
  })

  test('check-ins on different days, and by different people, each count', () => {
    const events = [at('checkInComplete', '2026-11-13T09:00:00Z'), at('checkInComplete', '2026-11-14T09:00:00Z'), at('checkInComplete', '2026-11-14T09:00:00Z', 'crew-2')]
    expect(creditedEvents(events)).toHaveLength(3)
  })

  test('fake symptom reports cannot be farmed: one credited per day', () => {
    const spam = Array.from({ length: 10 }, (_, i) => at('symptomReported', `2026-11-14T1${i % 9}:00:00Z`))
    expect(pointsFor(creditedEvents(spam))).toBe(POINTS.symptomReported)
  })

  test('different care steps on the same day each count, the same step twice does not', () => {
    const events = [at('countermeasureComplete', '2026-11-14T08:00:00Z', 'crew-1', 'sleep'), at('countermeasureComplete', '2026-11-14T09:00:00Z', 'crew-1', 'nutrition'), at('countermeasureComplete', '2026-11-14T10:00:00Z', 'crew-1', 'sleep')]
    expect(creditedEvents(events)).toHaveLength(2)
  })

  test('the earliest event of the day is the one that is credited', () => {
    const early = at('exerciseComplete', '2026-11-14T06:00:00Z')
    const late = at('exerciseComplete', '2026-11-14T20:00:00Z')
    expect(creditedEvents([late, early]).map((e) => e.id)).toEqual([early.id])
  })

  test('the weekly crew total and the all-time total use the capped credit', () => {
    const spam = Array.from({ length: 30 }, (_, i) => ({ ...ev('checkInComplete', 0), id: `s${i}` }))
    expect(pointsInWindow(spam, NOW, 7)).toBe(POINTS.checkInComplete)
    expect(crewProgress(spam, NOW, 4).totalPoints).toBe(POINTS.checkInComplete)
  })

  test('the most anyone can earn in a day is bounded', () => {
    const everything: GameEvent[] = (Object.keys(POINTS) as GameEventKind[]).flatMap((kind) =>
      Array.from({ length: 20 }, (_, i) => at(kind, `2026-11-14T${String(i % 20).padStart(2, '0')}:00:00Z`, 'crew-1', kind === 'countermeasureComplete' ? ['sleep', 'nutrition', 'escalate'][i % 3] : undefined)),
    )
    // Every plain kind once each + countermeasure once per distinct step (3).
    // Derived from POINTS so adding a kind updates the bound instead of breaking the test.
    const plain = (Object.keys(POINTS) as GameEventKind[])
      .filter((k) => k !== 'countermeasureComplete')
      .reduce((sum, k) => sum + POINTS[k], 0)
    const max = plain + 3 * POINTS.countermeasureComplete
    expect(pointsFor(creditedEvents(everything))).toBe(max)
  })

  test('creditableKinds says which of a new check-in\'s events still earn credit today', () => {
    const existing = [at('checkInComplete', '2026-11-14T08:00:00Z')]
    const out = creditableKinds(existing, [{ kind: 'checkInComplete' }, { kind: 'symptomReported' }], 'crew-1', new Date('2026-11-14T12:00:00Z'))
    expect(out.credited.map((e) => e.kind)).toEqual(['symptomReported'])
    expect(out.alreadyCounted.map((e) => e.kind)).toEqual(['checkInComplete'])
  })

  test('creditableKinds with no earlier events credits everything', () => {
    const out = creditableKinds([], [{ kind: 'checkInComplete' }, { kind: 'retakeAfterQualityFail' }], 'crew-1', NOW)
    expect(out.credited).toHaveLength(2)
    expect(out.alreadyCounted).toHaveLength(0)
  })

  test('a new kind has a label and positive points', () => {
    expect(POINTS.countermeasureComplete).toBeGreaterThan(0)
    expect(EVENT_LABEL.countermeasureComplete.length).toBeGreaterThan(3)
  })
})

describe('daily coin cap', () => {
  const at = (kind: Parameters<typeof pointsFor>[0][number]['kind'], detail: string, day = '2026-11-14') => ({ id: kind + detail + day, crewId: 'c', timestamp: `${day}T08:00:00Z`, kind, detail })
  test('never pays more than the cap for one day, however many different things are logged', () => {
    const many = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n'].map((d) => at('readingLogged', d))
    expect(pointsFor(many)).toBeGreaterThan(DAILY_COIN_CAP)
    expect(cappedPoints(many)).toBe(DAILY_COIN_CAP)
  })
  test('caps each day on its own', () => {
    const two = [...['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm'].map((d) => at('readingLogged', d)), ...['a', 'b'].map((d) => at('readingLogged', d, '2026-11-15'))]
    expect(cappedPoints(two)).toBe(DAILY_COIN_CAP + 2 * POINTS.readingLogged)
  })
  test('leaves streak milestones outside the cap', () => {
    const day = [...['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm'].map((d) => at('readingLogged', d)), at('streakMilestone', 'streak-7')]
    expect(cappedPoints(day)).toBe(DAILY_COIN_CAP + POINTS.streakMilestone)
  })
})
