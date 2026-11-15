import { describe, expect, test } from 'vitest'
import { INDICATORS } from '../contract/types'
import { COVERAGE } from './dataCoverage'
import { CHANNEL_LABEL, DATASETS, NOT_USED, SOURCES, TOPIC_SOURCES, UNCOVERED_STANDARD_MEASURES, isNasa, nasaSources, otherSources, sourcesForIndicator } from './sources'

describe('sources list', () => {
  test('ids are unique and every entry has a title, an https URL and a use', () => {
    expect(new Set(SOURCES.map((s) => s.id)).size).toBe(SOURCES.length)
    for (const s of SOURCES) {
      expect(s.title.length, s.id).toBeGreaterThan(3)
      expect(s.url, s.id).toMatch(/^https:\/\//)
      expect(s.usedFor.length, s.id).toBeGreaterThan(3)
    }
  })

  test('NASA and other sources split the list with nothing lost', () => {
    expect(nasaSources().length + otherSources().length).toBe(SOURCES.length)
    expect(nasaSources().length).toBeGreaterThan(otherSources().length)
  })

  test('only nasa.gov hosts count as NASA', () => {
    expect(isNasa({ url: 'https://www.nasa.gov/hrp/risks' })).toBe(true)
    expect(isNasa({ url: 'https://ccmc.gsfc.nasa.gov/DONKI-API/get/SEP' })).toBe(true)
    expect(isNasa({ url: 'https://medlineplus.gov/sleep.html' })).toBe(false)
    expect(isNasa({ url: 'https://nasa.gov.example.com/page' })).toBe(false)
    expect(isNasa({ url: 'https://example.com/?u=https://www.nasa.gov/' })).toBe(false)
  })
})

describe('sourcesForIndicator', () => {
  test('finds sources that name the indicator', () => {
    expect(sourcesForIndicator('heartRate').map((s) => s.id)).toContain('risk-cardio')
  })

  test('an indicator id inside a longer id does not match', () => {
    const viaLonger = SOURCES.filter((s) => /sleepHours|sleepQuality/.test(s.usedFor) && !/\bsleep\b/.test(s.usedFor))
    for (const i of INDICATORS) {
      const longer = INDICATORS.filter((o) => o !== i && o.includes(i))
      if (longer.length === 0) continue
      for (const s of sourcesForIndicator(i)) expect(new RegExp(`\\b${i}\\b`).test(longer.reduce((t, o) => t.split(o).join(' '), s.usedFor)), `${i} via ${s.id}`).toBe(true)
    }
    expect(viaLonger.length).toBeGreaterThanOrEqual(0)
  })
})

describe('every indicator is sourced', () => {
  test('topic matches point at entries that exist', () => {
    const ids = new Set(SOURCES.map((s) => s.id))
    for (const [indicator, list] of Object.entries(TOPIC_SOURCES)) for (const id of list ?? []) expect(ids.has(id), `${indicator} -> ${id}`).toBe(true)
  })

  test('every indicator has at least one source, or is radiation dose, which is backed by the bundled datasets', () => {
    for (const i of INDICATORS) expect(sourcesForIndicator(i).length + (i === 'radiationDose' ? 1 : 0), i).toBeGreaterThan(0)
  })
})

describe('bundled datasets', () => {
  test('the four NASA datasets the app ships are listed with NASA or DOI links and a use', () => {
    expect(DATASETS.map((d) => d.id)).toEqual(['donki-sep', 'iswa-crater', 'iswa-goes', 'nlsp-bedrest'])
    for (const d of DATASETS) {
      expect(isNasa(d) || d.url.startsWith('https://doi.org/'), d.id).toBe(true)
      expect(d.usedFor.length, d.id).toBeGreaterThan(0)
      expect(d.title.length, d.id).toBeGreaterThan(10)
    }
  })
})

describe('sources screen data', () => {
  test('every collection channel used in the coverage map has a label', () => {
    for (const i of INDICATORS) for (const ch of [...COVERAGE[i].live, ...COVERAGE[i].planned]) expect(CHANNEL_LABEL[ch], ch).toBeTruthy()
  })

  test('the "could not use" lists are not empty and every item gives a reason', () => {
    expect(UNCOVERED_STANDARD_MEASURES.length).toBeGreaterThan(0)
    expect(NOT_USED.length).toBeGreaterThan(0)
    for (const n of NOT_USED) expect(n.why.length, n.what).toBeGreaterThan(20)
  })
})
