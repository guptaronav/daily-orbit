import { describe, expect, it } from 'vitest'
import type { Indicator, Measurement, Quality } from '../contract/types'
import { buildPacket, packetFilename } from './packet'

const NOW = new Date('2026-11-14T12:00:00.000Z')
const DAY_MS = 86_400_000
const PASSED: Quality = { score: 1, passed: true }
const FAILED: Quality = { score: 0, passed: false, reason: 'motion' }

/** `values` oldest first, one per day, the last one landing on `now`. */
function series(indicator: Indicator, values: number[], opts: { unit?: string; lastQuality?: Quality } = {}): Measurement[] {
  return values.map((value, i) => ({
    id: `${indicator}-${i}`,
    crewId: 'crew-1',
    timestamp: new Date(NOW.getTime() - (values.length - 1 - i) * DAY_MS).toISOString(),
    indicator,
    value,
    unit: opts.unit ?? 'h',
    quality: i === values.length - 1 ? (opts.lastQuality ?? PASSED) : PASSED,
    source: 'simulated',
  }))
}

const build = (measurements: Measurement[]) => buildPacket({ crewId: 'crew-1', measurements, now: NOW })

const STEADY = [7, 7.1, 6.9, 7, 7.2, 6.8, 7.1, 7, 6.9, 7.1]

describe('buildPacket: what goes in', () => {
  it('is empty when there are no measurements at all', () => {
    const packet = build([])
    expect(packet.changed).toEqual([])
  })

  it('is empty when nothing has changed', () => {
    expect(build(series('sleepHours', [...STEADY, 7])).changed).toEqual([])
  })

  it('is empty when there is history but no baseline yet (under 5 readings)', () => {
    expect(build(series('sleepHours', [7, 7, 7, 2])).changed).toEqual([])
  })

  it('lists an indicator whose latest reading left the baseline', () => {
    const packet = build(series('sleepHours', [...STEADY, 3]))
    expect(packet.changed).toHaveLength(1)
    const change = packet.changed[0]
    expect(change.indicator).toBe('sleepHours')
    expect(change.label).toBe('Sleep duration')
    expect(change.status).toBe('red')
    expect(change.from).toBeCloseTo(7.01, 1)
    expect(change.to).toBe(3)
    expect(change.deltaPct).toBeLessThan(-50)
    expect(change.quality.passed).toBe(true)
  })

  it('reports a rise as a positive delta', () => {
    const packet = build(series('heartRate', [60, 61, 59, 60, 62, 60, 61, 95], { unit: 'bpm' }))
    expect(packet.changed[0].deltaPct).toBeGreaterThan(0)
    expect(packet.changed[0].unit).toBe('bpm')
  })

  it('never includes a reading that failed the quality check', () => {
    const packet = build(series('sleepHours', [...STEADY, 3], { lastQuality: FAILED }))
    expect(packet.changed).toEqual([])
    expect(packet.json).not.toContain('"passed": false')
  })

  it('covers several indicators at once, in contract order', () => {
    const packet = build([
      ...series('sleepHours', [...STEADY, 3]),
      ...series('heartRate', [60, 61, 59, 60, 62, 60, 61, 95], { unit: 'bpm' }),
    ])
    expect(packet.changed.map((c) => c.indicator)).toEqual(['heartRate', 'sleepHours'])
  })
})

describe('buildPacket: sinceDays', () => {
  it('is 0 when only today left the baseline', () => {
    expect(build(series('sleepHours', [...STEADY, 3])).changed[0].sinceDays).toBe(0)
  })

  it('counts back over a run of consecutive deviating readings', () => {
    const packet = build(series('sleepHours', [...STEADY, 3.4, 3.2, 3]))
    expect(packet.changed[0].sinceDays).toBe(2)
  })

  it('stops at the most recent reading that was back inside the baseline', () => {
    const packet = build(series('sleepHours', [...STEADY, 3.4, 7, 3]))
    expect(packet.changed[0].sinceDays).toBe(0)
  })
})

describe('buildPacket: the wire format', () => {
  it('bytes matches the UTF-8 length of json', () => {
    const packet = build(series('sleepHours', [...STEADY, 3]))
    expect(packet.bytes).toBe(new TextEncoder().encode(packet.json).length)
    expect(packet.bytes).toBeGreaterThan(0)
  })

  it('an empty packet is still small, valid JSON that carries the disclaimer', () => {
    const packet = build([])
    const parsed = JSON.parse(packet.json)
    expect(parsed.changed).toEqual([])
    expect(parsed.crewId).toBe('crew-1')
    expect(parsed.generatedAt).toBe(NOW.toISOString())
    expect(parsed.disclaimer).toMatch(/not a medical device/i)
    expect(packet.bytes).toBeLessThan(500)
  })

  it('round-trips the changes it reports', () => {
    const packet = build(series('sleepHours', [...STEADY, 3]))
    expect(JSON.parse(packet.json).changed).toEqual(packet.changed)
  })

  it('names the download file after the crew member and the date', () => {
    expect(packetFilename('crew-2', NOW)).toBe('health-packet-crew-2-2026-11-14.json')
  })
})
