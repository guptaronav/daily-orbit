import { describe, expect, test } from 'vitest'
import raw from '../../data/bedrest.json'
import { INDICATORS } from '../../contract/types'
import { BEDREST_DATA_LABEL, BEDREST_INDICATORS, loadBedrestEvents, loadBedrestMeasurements } from './bedrest'

const NOW = new Date('2026-11-14T12:00:00Z')
const DAY = 86_400_000
const ms = loadBedrestMeasurements('crew-3', NOW)

describe('loadBedrestMeasurements', () => {
  test('every record is labeled as NASA bed-rest data and cites its dataset', () => {
    expect(ms.length).toBeGreaterThan(100)
    for (const m of ms) {
      expect(m.source).toBe('nasa-bedrest')
      expect(m.sourceDatasetId).toMatch(/10\.83263\/wjw1-ta27/)
      expect(m.crewId).toBe('crew-3')
      expect(m.quality.passed).toBe(true)
    }
  })

  test('only indicators the app defines, each with a unit', () => {
    for (const m of ms) {
      expect(INDICATORS).toContain(m.indicator)
      expect(m.unit && m.unit.length).toBeGreaterThan(0)
    }
  })

  test('30 distinct days ending now, never in the future', () => {
    const days = new Set(ms.map((m) => m.timestamp.slice(0, 10)))
    expect(days.size).toBe(30)
    expect(Math.max(...ms.map((m) => Date.parse(m.timestamp)))).toBeLessThanOrEqual(NOW.getTime())
    expect(Math.min(...ms.map((m) => Date.parse(m.timestamp)))).toBe(NOW.getTime() - 29 * DAY)
  })

  test('ids are unique and stable across loads', () => {
    expect(new Set(ms.map((m) => m.id)).size).toBe(ms.length)
    expect(loadBedrestMeasurements('crew-3', NOW).map((m) => m.id)).toEqual(ms.map((m) => m.id))
  })

  test('covers vitals, body mass, temperature, gut, activity and symptoms from real logs', () => {
    for (const i of ['heartRate', 'bloodPressureSys', 'bloodPressureDia', 'bodyMass', 'temperature', 'bowelMovements', 'exerciseMinutes', 'symptomReport'] as const) {
      expect(BEDREST_INDICATORS.has(i), i).toBe(true)
    }
  })

  test('values pass through unchanged from the imported file', () => {
    const first = (raw.records as { day: number; indicator: string; value: number }[]).find((r) => r.day === 0 && r.indicator === 'bodyMass')!
    const loaded = ms.find((m) => m.indicator === 'bodyMass' && m.timestamp === new Date(NOW.getTime() - 29 * DAY).toISOString())!
    expect(loaded.value).toBe(first.value)
  })

  test('the real tilt effect is present: body mass is lower at the end than at the start', () => {
    const mass = ms.filter((m) => m.indicator === 'bodyMass').sort((a, b) => a.timestamp.localeCompare(b.timestamp)).map((m) => m.value as number)
    const mean = (xs: number[]) => xs.reduce((a, v) => a + v, 0) / xs.length
    expect(mean(mass.slice(-5))).toBeLessThan(mean(mass.slice(0, 10)) - 1)
  })

  test('symptom reports carry labels only', () => {
    const reports = ms.filter((m) => m.indicator === 'symptomReport')
    expect(reports.length).toBeGreaterThan(0)
    for (const r of reports) expect(Object.keys(r.value as object)).toEqual(['symptoms'])
  })
})

describe('loadBedrestEvents', () => {
  const events = loadBedrestEvents('crew-3', NOW)

  test('exercise and symptom events come only from days the real logs show them', () => {
    const exerciseDays = new Set(ms.filter((m) => m.indicator === 'exerciseMinutes').map((m) => m.timestamp))
    const symptomDays = new Set(ms.filter((m) => m.indicator === 'symptomReport').map((m) => m.timestamp))
    expect(events.filter((e) => e.kind === 'exerciseComplete').every((e) => exerciseDays.has(e.timestamp))).toBe(true)
    expect(events.filter((e) => e.kind === 'symptomReported').every((e) => symptomDays.has(e.timestamp))).toBe(true)
    expect(events.filter((e) => e.kind === 'exerciseComplete')).toHaveLength(exerciseDays.size)
    expect(events.filter((e) => e.kind === 'symptomReported')).toHaveLength(symptomDays.size)
  })

  test('no other kinds are invented from the real data', () => {
    expect(new Set(events.map((e) => e.kind))).toEqual(new Set(['exerciseComplete', 'symptomReported']))
  })
})

describe('honesty and de-identification', () => {
  test('the data label says it is NASA bed-rest analog data, de-identified, and partly simulated', () => {
    expect(BEDREST_DATA_LABEL).toMatch(/bed-rest/i)
    expect(BEDREST_DATA_LABEL).toMatch(/de-identified/i)
    expect(BEDREST_DATA_LABEL).toMatch(/simulated/i)
  })

  test('the shipped JSON has no dates, subject numbers, campaign codes or names', () => {
    const text = JSON.stringify(raw)
    expect(text).not.toMatch(/\b(19|20)\d{2}-\d{2}-\d{2}\b/)
    expect(text).not.toMatch(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/)
    expect(text).not.toMatch(/\bC3[A-Z]\b|C3[A-Z]_/)
    expect(text).not.toMatch(/\bDr\b|\bRN\b|Nurse/)
    expect(Object.keys(raw.source).sort()).toEqual(['archiveStatus', 'doi', 'name', 'note', 'participant', 'window'])
    expect(raw.source.participant).toBe('analog-1')
  })
})
