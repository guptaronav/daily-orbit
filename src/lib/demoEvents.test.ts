import { describe, expect, test } from 'vitest'
import type { GameEvent, Measurement } from '../contract/types'
import { amslerDistortionEvent, eventsToRemove, noisyReadingEvent, sleepDeclineStep } from './demoEvents'
import { readIndicator } from './bodyStatus'

const NOW = new Date('2026-11-14T12:00:00Z')

const m = (indicator: Measurement['indicator'], value: number, ts = '2026-11-14T08:00:00Z'): Measurement => ({
  id: `${indicator}-${ts}-${value}`,
  crewId: 'crew-1',
  timestamp: ts,
  indicator,
  value,
  quality: { score: 1, passed: true },
  source: 'simulated',
})

describe('sleepDeclineStep', () => {
  test('each step lowers sleep hours and quality from the latest readings', () => {
    const [hours, quality] = sleepDeclineStep({ crewId: 'crew-1', now: NOW, latest: { sleepHours: m('sleepHours', 7), sleepQuality: m('sleepQuality', 7) } })
    expect(hours.indicator).toBe('sleepHours')
    expect(hours.value).toBeCloseTo(6.2, 5)
    expect(quality.indicator).toBe('sleepQuality')
    expect(quality.value).toBe(6)
  })

  test('repeated steps keep declining but never below a floor', () => {
    let hours = m('sleepHours', 7)
    let quality = m('sleepQuality', 7)
    for (let i = 0; i < 20; i++) {
      const [h, q] = sleepDeclineStep({ crewId: 'crew-1', now: NOW, latest: { sleepHours: hours, sleepQuality: quality } })
      hours = h
      quality = q
    }
    expect(hours.value as number).toBeGreaterThanOrEqual(2.5)
    expect(quality.value as number).toBeGreaterThanOrEqual(1)
  })

  test('new readings are always newer than the latest, so they become the latest', () => {
    const latestTs = '2026-11-14T12:00:00Z' // same moment as "now"
    const [h] = sleepDeclineStep({ crewId: 'crew-1', now: NOW, latest: { sleepHours: m('sleepHours', 7, latestTs) } })
    expect(Date.parse(h.timestamp)).toBeGreaterThan(Date.parse(latestTs))
  })

  test('starts from a sensible default when there is no history', () => {
    const [h] = sleepDeclineStep({ crewId: 'guest', now: NOW, latest: {} })
    expect(h.value as number).toBeLessThan(7)
  })

  test('injected readings are simulated and passed, so they count', () => {
    for (const x of sleepDeclineStep({ crewId: 'crew-1', now: NOW, latest: {} })) {
      expect(x.source).toBe('simulated')
      expect(x.quality.passed).toBe(true)
    }
  })

  test('two steps against a stable baseline turn the head yellow, then red', () => {
    const history = Array.from({ length: 30 }, (_, i) => m('sleepHours', 7 + (i % 3) * 0.3 - 0.3, `2026-10-${String((i % 28) + 1).padStart(2, '0')}T08:00:00Z`))
    const step1 = sleepDeclineStep({ crewId: 'crew-1', now: NOW, latest: { sleepHours: history[history.length - 1] } })[0]
    const step2 = sleepDeclineStep({ crewId: 'crew-1', now: NOW, latest: { sleepHours: step1 } })[0]
    const after1 = readIndicator('sleepHours', [...history, step1]).status
    const after2 = readIndicator('sleepHours', [...history, step1, step2]).status
    expect(['yellow', 'red']).toContain(after1)
    expect(after2).toBe('red')
  })
})

describe('noisyReadingEvent', () => {
  test('is a failed-quality heart rate with an alarming value that must never color anything', () => {
    const x = noisyReadingEvent({ crewId: 'crew-1', now: NOW })
    expect(x.indicator).toBe('heartRate')
    expect(x.quality.passed).toBe(false)
    expect(x.value as number).toBeGreaterThan(150)
  })

  test('being the newest reading does not change the status, because failed readings are skipped', () => {
    const base = Array.from({ length: 10 }, (_, i) => m('heartRate', 62 + (i % 3), `2026-11-0${(i % 9) + 1}T08:00:00Z`))
    const before = readIndicator('heartRate', base).status
    const after = readIndicator('heartRate', [...base, noisyReadingEvent({ crewId: 'crew-1', now: NOW })])
    expect(after.status).toBe(before)
    expect(after.failedCount).toBe(1)
  })
})

describe('amslerDistortionEvent', () => {
  test('reports a new distortion that affects the center', () => {
    const x = amslerDistortionEvent({ crewId: 'crew-1', now: NOW })
    expect(x.indicator).toBe('amslerDistortion')
    expect(x.value).toMatchObject({ distortion: true, centralAffected: true })
    expect(x.quality.passed).toBe(true)
  })
})

describe('eventsToRemove (missed check-ins)', () => {
  const ev = (kind: GameEvent['kind'], daysAgo: number, crewId = 'crew-1'): GameEvent => ({
    id: `${kind}-${daysAgo}-${crewId}`,
    crewId,
    kind,
    timestamp: new Date(NOW.getTime() - daysAgo * 86_400_000).toISOString(),
  })

  test('removes only this crew member\'s check-ins from the last N days', () => {
    const events = [ev('checkInComplete', 0), ev('checkInComplete', 2), ev('checkInComplete', 5), ev('exerciseComplete', 1), ev('checkInComplete', 1, 'crew-2')]
    expect(eventsToRemove(events, 'crew-1', NOW, 3).sort()).toEqual([ev('checkInComplete', 0).id, ev('checkInComplete', 2).id].sort())
  })

  test('nothing to remove is an empty list', () => {
    expect(eventsToRemove([], 'crew-1', NOW, 3)).toEqual([])
  })
})
