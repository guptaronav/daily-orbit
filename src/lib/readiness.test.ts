import { describe, expect, it } from 'vitest'
import { readiness } from './readiness'

const regions = (s: 'green' | 'yellow' | 'red' | 'gray') => [
  { label: 'Head', status: s },
  { label: 'Heart', status: 'green' as const },
]

describe('readiness', () => {
  it('is ready when every region with data is within the usual', () => {
    expect(readiness({ regions: regions('green'), patterns: [], openAlerts: [], gaps: 0 }).level).toBe('ready')
  })
  it('asks to check first on any Watch, pattern or self-report gap, and says why', () => {
    const r = readiness({ regions: regions('yellow'), patterns: [], openAlerts: [], gaps: 0 })
    expect(r.level).toBe('check')
    expect(r.reasons).toContain('Head at Watch')
    expect(readiness({ regions: regions('green'), patterns: [], openAlerts: [], gaps: 1 }).level).toBe('check')
  })
  it('says not today on anything at Act, including an open red alert', () => {
    expect(readiness({ regions: regions('red'), patterns: [], openAlerts: [], gaps: 0 }).level).toBe('notToday')
    expect(readiness({ regions: regions('green'), patterns: [], openAlerts: [{ title: 'Possible infection', status: 'red' }], gaps: 0 }).level).toBe('notToday')
  })
  it('does not pretend to know when there is no good data', () => {
    expect(readiness({ regions: [{ label: 'Head', status: 'gray' }], patterns: [], openAlerts: [], gaps: 0 }).level).toBe('unknown')
  })
})
