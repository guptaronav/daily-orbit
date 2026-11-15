import { describe, expect, test } from 'vitest'
import type { GameEvent, GameEventKind, Indicator, Measurement } from '../contract/types'
import { readAll } from './bodyStatus'
import { dailyPlan, type PlanItem } from './plan'
import { POINTS } from './scoring'
import { getContent, isTodo } from './content'

const NOW = new Date('2026-11-14T12:00:00Z')
const HOUR = 3_600_000
const DAY = 24 * HOUR

let n = 0
const m = (indicator: Indicator, value: Measurement['value'], at: Date, passed = true): Measurement => ({
  id: `m${n++}`,
  crewId: 'crew-1',
  timestamp: at.toISOString(),
  indicator,
  value,
  quality: passed ? { score: 1, passed: true } : { score: 0.1, passed: false, reason: 'motion' },
  source: 'simulated',
})

/** 21 steady days (a small wiggle, so the baseline has a spread) then a latest reading an hour ago. */
function history(indicator: Indicator, base: number, latest: number): Measurement[] {
  const past = Array.from({ length: 21 }, (_, i) => m(indicator, base + ((i % 3) - 1) * base * 0.03, new Date(NOW.getTime() - (22 - i) * DAY)))
  return [...past, m(indicator, latest, new Date(NOW.getTime() - HOUR))]
}

const event = (kind: GameEventKind, at = NOW, detail?: string): GameEvent => ({ id: `e${n++}`, crewId: 'crew-1', kind, timestamp: at.toISOString(), ...(detail ? { detail } : {}) })

const plan = (measurements: Measurement[], events: GameEvent[] = []) => dailyPlan({ crewId: 'crew-1', readings: readAll(measurements), events, measurements, now: NOW })
const ids = (items: PlanItem[]) => items.map((i) => i.id)

describe('dailyPlan: what to do today, driven by your own data', () => {
  const healthy = [...history('sleepHours', 7, 7), ...history('heartRate', 62, 62), ...history('appetite', 7, 7)]

  test('on a steady day the plan is just the two daily habits', () => {
    expect(ids(plan(healthy))).toEqual(['checkin', 'exercise'])
  })

  test('a drop in sleep adds a sleep step that quotes your own numbers', () => {
    const items = plan([...history('sleepHours', 7, 5.5), ...history('heartRate', 62, 62)])
    const sleep = items.find((i) => i.id === 'sleep')!
    expect(sleep).toBeDefined()
    expect(sleep.why).toMatch(/5\.5/)
    expect(sleep.why).toMatch(/7/)
    expect(sleep.kind).toBe('countermeasureComplete')
    expect(sleep.detail).toBe('sleep')
  })

  test('low appetite adds a nutrition step', () => {
    expect(ids(plan(history('appetite', 7, 2)))).toContain('nutrition')
  })

  test('a flagged-red region puts "tell someone" first, because early escalation is what we reward most', () => {
    const items = plan(history('sleepHours', 7, 4.5))
    expect(items[0].id).toBe('escalate')
    expect(items[0].detail).toBe('escalate')
  })

  test('a reading that failed quality in the last day offers a retake', () => {
    const failed = m('heartRate', 0, new Date(NOW.getTime() - 2 * HOUR), false)
    const items = plan([...history('heartRate', 62, 62), failed])
    expect(ids(items)).toContain('retake')
    expect(items.find((i) => i.id === 'retake')!.kind).toBe('retakeAfterQualityFail')
  })

  test('an old failed reading does not nag', () => {
    const old = m('heartRate', 0, new Date(NOW.getTime() - 3 * DAY), false)
    expect(ids(plan([...history('heartRate', 62, 62), old]))).not.toContain('retake')
  })

  test('steps are marked done from what already happened today', () => {
    const items = plan(healthy, [event('checkInComplete'), event('exerciseComplete')])
    expect(items.every((i) => i.done)).toBe(true)
  })

  test('a care step counts as done only for its own detail', () => {
    const sleepy = history('sleepHours', 7, 5.5)
    expect(plan(sleepy, [event('countermeasureComplete', NOW, 'nutrition')]).find((i) => i.id === 'sleep')!.done).toBe(false)
    expect(plan(sleepy, [event('countermeasureComplete', NOW, 'sleep')]).find((i) => i.id === 'sleep')!.done).toBe(true)
  })

  test("yesterday's credit does not count as done today", () => {
    const items = plan(healthy, [event('checkInComplete', new Date(NOW.getTime() - DAY))])
    expect(items.find((i) => i.id === 'checkin')!.done).toBe(false)
  })

  test('each step shows the points it is worth', () => {
    for (const i of plan(history('sleepHours', 7, 5.5))) expect(i.points).toBe(POINTS[i.kind])
  })

  test('with no history there is nothing to flag, so only the daily habits appear', () => {
    expect(ids(plan([]))).toEqual(['checkin', 'exercise'])
  })

  test('worse data never offers fewer chances to earn credit than better data', () => {
    const good = plan(healthy).length
    for (const latest of [6.5, 5.5, 4.5, 3.5]) expect(plan(history('sleepHours', 7, latest)).length).toBeGreaterThanOrEqual(good)
  })

  test('guidance is the sourced recommended action when one exists, otherwise it points to people, never to invented advice', () => {
    const sleep = plan(history('sleepHours', 7, 5.5)).find((i) => i.id === 'sleep')!
    const sourced = getContent('sleepHours').recommendedAction
    if (isTodo(sourced)) expect(sleep.guidance).toMatch(/crewmate|crew medical officer/i)
    else expect(sleep.guidance).toBe(sourced)
  })
})
