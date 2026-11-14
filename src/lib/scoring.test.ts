import { describe, expect, test } from 'vitest'
import type { GameEvent, GameEventKind, Quality } from '../contract/types'
import { SYSTEMS, WEEKLY_GOAL_PER_CREW, pointsFor, pointsInWindow, systemsStatus } from './scoring'
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
