import { describe, expect, test } from 'vitest'
import { INDICATORS } from '../contract/types'
import { COVERAGE, plannedOnly } from './dataCoverage'
import { getContent } from './content'
import { REGIONS } from './regions'

describe('data coverage: we get and use every indicator we define', () => {
  test('every indicator has at least one collection channel, live or planned', () => {
    for (const i of INDICATORS) {
      const c = COVERAGE[i]
      expect(c.live.length + c.planned.length, i).toBeGreaterThan(0)
    }
  })

  test('every indicator belongs to exactly one body region, so it is always shown somewhere', () => {
    for (const i of INDICATORS) {
      expect(REGIONS.filter((r) => r.indicators.includes(i)), i).toHaveLength(1)
    }
  })

  test('every indicator has a unit and a content card', () => {
    for (const i of INDICATORS) expect(getContent(i).unit.length, i).toBeGreaterThan(0)
  })

  test('the gut region measures gut and nutrition, not just blood sugar', () => {
    const gut = REGIONS.find((r) => r.id === 'gut')!.indicators
    expect(gut).toEqual(expect.arrayContaining(['digestiveComfort', 'appetite', 'bodyMass', 'bloodSugar']))
  })

  test('sleep hours is collected in the check-in itself, not only by manual entry', () => {
    expect(COVERAGE.sleepHours.live).toContain('mirrorCheckIn')
  })

  test('gut comfort and appetite are collected live in the check-in', () => {
    expect(COVERAGE.digestiveComfort.live).toContain('mirrorCheckIn')
    expect(COVERAGE.appetite.live).toContain('mirrorCheckIn')
  })

  test('indicators that no screen collects yet are reported so they cannot be forgotten', () => {
    const gaps = plannedOnly()
    for (const i of gaps) expect(COVERAGE[i].live).toEqual([])
  })

  test('radiation dose is collected live now that the radiation replay is built', () => {
    expect(COVERAGE.radiationDose.live).toContain('radiationReplay')
    expect(plannedOnly()).not.toContain('radiationDose')
  })
})
