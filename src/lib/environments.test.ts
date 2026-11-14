import { describe, expect, test } from 'vitest'
import { ENVIRONMENTS, formatDelay } from './environments'

describe('formatDelay', () => {
  test('sub-minute delays show seconds', () => {
    expect(formatDelay(1)).toBe('1 s')
    expect(formatDelay(1.3)).toBe('1.3 s')
  })

  test('minutes show whole or half minutes', () => {
    expect(formatDelay(1200)).toBe('20 min')
    expect(formatDelay(180)).toBe('3 min')
    expect(formatDelay(90)).toBe('1.5 min')
  })
})

describe('ENVIRONMENTS', () => {
  test('Mars defaults to 20 minutes one way, within the 3 to 22 minute range', () => {
    const mars = ENVIRONMENTS.find((e) => e.id === 'mars')!
    expect(mars.oneWayDelaySec).toBe(1200)
    expect(mars.minDelaySec).toBe(180)
    expect(mars.maxDelaySec).toBe(1320)
  })

  test('ISS and lunar delays match the brief', () => {
    expect(ENVIRONMENTS.find((e) => e.id === 'iss')!.oneWayDelaySec).toBe(1)
    expect(ENVIRONMENTS.find((e) => e.id === 'lunar')!.oneWayDelaySec).toBe(1.3)
  })
})
