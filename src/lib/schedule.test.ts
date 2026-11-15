import { describe, expect, it } from 'vitest'
import type { GameEvent, Measurement } from '../contract/types'
import { blockState, doneToday, dueItems, isBlockDone, planFor, ROLE_DUTIES, type Block, type CustomBlock } from './schedule'

const at = (iso: string) => new Date(iso)
const ev = (kind: GameEvent['kind'], timestamp: string, detail?: string): GameEvent => ({ id: kind + timestamp, crewId: 'c', kind, timestamp, ...(detail ? { detail } : {}) })
const mass = (timestamp: string): Measurement => ({ id: 'm' + timestamp, crewId: 'c', timestamp, indicator: 'bodyMass', value: 70, unit: 'kg', quality: { score: 1, passed: true }, source: 'manual' })

describe('planFor', () => {
  const now = new Date(2026, 10, 14, 9, 0)
  it('gives each role its own duties and nobody else', () => {
    const cdr = planFor('Commander', [], now).map((b) => b.id)
    const fe = planFor('Flight engineer', [], now).map((b) => b.id)
    for (const d of ROLE_DUTIES.Commander) {
      expect(cdr).toContain(d.id)
      expect(fe).not.toContain(d.id)
    }
  })
  it('shows a person no role duties when they have no known role', () => {
    expect(planFor('', [], now).some((b) => b.kind === 'role')).toBe(false)
  })
  it('keeps daily custom blocks every day and one-off blocks only on their day', () => {
    const custom: CustomBlock[] = [
      { id: 'a', start: '12:00', minutes: 30, title: 'Call home', kind: 'custom', repeat: 'daily' },
      { id: 'b', start: '13:00', minutes: 30, title: 'Fix filter', kind: 'custom', repeat: 'once', day: '2026-11-14' },
      { id: 'c', start: '14:00', minutes: 30, title: 'Old task', kind: 'custom', repeat: 'once', day: '2026-11-13' },
    ]
    const ids = planFor('Commander', custom, now).map((b) => b.id)
    expect(ids).toContain('a')
    expect(ids).toContain('b')
    expect(ids).not.toContain('c')
  })
  it('sorts by start time', () => {
    const starts = planFor('Mission specialist', [], now).map((b) => b.start)
    expect([...starts].sort()).toEqual(starts)
  })
})

describe('block state and completion', () => {
  const b: Block = { id: 'x', start: '10:00', minutes: 30, title: 'X', kind: 'work' }
  it('is upcoming, then now, then missed as the clock moves', () => {
    expect(blockState(b, new Date(2026, 0, 1, 9, 59), false)).toBe('upcoming')
    expect(blockState(b, new Date(2026, 0, 1, 10, 15), false)).toBe('now')
    expect(blockState(b, new Date(2026, 0, 1, 10, 30), false)).toBe('missed')
    expect(blockState(b, new Date(2026, 0, 1, 10, 30), true)).toBe('done')
  })
  it('counts a linked block done only when its real action happened today', () => {
    const now = new Date(2026, 10, 14, 12, 0)
    const linked: Block = { ...b, doneBy: { kind: 'checkInComplete' } }
    const today = doneToday([ev('checkInComplete', new Date(2026, 10, 14, 8, 0).toISOString())], now)
    const yesterday = doneToday([ev('checkInComplete', new Date(2026, 10, 13, 8, 0).toISOString())], now)
    expect(isBlockDone(linked, today, [], [])).toBe(true)
    expect(isBlockDone(linked, yesterday, [], [])).toBe(false)
  })
  it('counts meal blocks from the food log and other blocks from hand ticks', () => {
    expect(isBlockDone({ ...b, meal: 'lunch' }, new Set(), ['lunch'], [])).toBe(true)
    expect(isBlockDone(b, new Set(), [], ['x'])).toBe(true)
    expect(isBlockDone(b, new Set(), [], [])).toBe(false)
  })
})

describe('dueItems', () => {
  it('has nothing due right after a check-in', () => {
    expect(dueItems([], [ev('checkInComplete', '2026-11-14T08:00:00Z')], at('2026-11-14T09:00:00Z'))).toEqual([])
  })
  it('makes the mirror check due a day after the last one', () => {
    const due = dueItems([], [ev('checkInComplete', '2026-11-13T08:00:00Z')], at('2026-11-14T08:30:00Z'))
    expect(due.map((d) => d.id)).toEqual(['mirror'])
  })
  it('makes body mass due a week after the last reading', () => {
    expect(dueItems([mass('2026-11-10T08:00:00Z')], [], at('2026-11-14T08:00:00Z'))).toEqual([])
    expect(dueItems([mass('2026-11-06T08:00:00Z')], [], at('2026-11-14T08:00:00Z')).map((d) => d.id)).toEqual(['bodyMass'])
  })
  it('is never due for something with no data yet', () => {
    expect(dueItems([], [], at('2026-11-14T08:00:00Z'))).toEqual([])
  })
  it('labels the microbiome interval as an assumption', () => {
    const due = dueItems([], [ev('readingLogged', '2026-10-01T08:00:00Z', 'microbiome')], at('2026-11-14T08:00:00Z'))
    expect(due[0].assumption).toMatch(/placeholder/i)
  })
})
