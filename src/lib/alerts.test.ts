import { describe, expect, it } from 'vitest'
import { alertState, type AlertCandidate } from './alerts'

const c: AlertCandidate = { id: 'c:reading:temperature', crewId: 'c', kind: 'reading', title: 'Temperature at Act', detail: '', status: 'red', signature: '2026-11-14T08:00:00Z' }

describe('alert loop', () => {
  it('starts open', () => expect(alertState(c, undefined)).toBe('open'))
  it('is acknowledged once someone acknowledges it', () => expect(alertState(c, { ackAt: 1, signature: c.signature })).toBe('acknowledged'))
  it('is closed only when closed on the same reading', () => expect(alertState(c, { ackAt: 1, closedAt: 2, note: 'Rested, rechecking', signature: c.signature })).toBe('closed'))
  it('reopens when a newer reading keeps the condition going', () => {
    expect(alertState({ ...c, signature: '2026-11-15T08:00:00Z' }, { ackAt: 1, closedAt: 2, note: 'x', signature: c.signature })).toBe('open')
  })
})
