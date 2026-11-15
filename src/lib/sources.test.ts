import { describe, expect, test } from 'vitest'
import { INDICATORS } from '../contract/types'
import { COVERAGE } from './dataCoverage'
import { ENVIRONMENTS } from './environments'
import { CHANNEL_LABEL, DATASETS, NOT_USED, SOURCES, UNCOVERED_STANDARD_MEASURES, getSourceByUrl, isNasaSource } from './sources'

describe('sources list', () => {
  test('ids are unique and every entry has a title, an https URL and a use', () => {
    expect(new Set(SOURCES.map((s) => s.id)).size).toBe(SOURCES.length)
    for (const s of SOURCES) {
      expect(s.title.length, s.id).toBeGreaterThan(3)
      expect(s.url, s.id).toMatch(/^https:\/\//)
      expect(s.usedFor.length, s.id).toBeGreaterThan(0)
    }
  })

  test('there are NASA pages, and non-NASA pages are told apart from them', () => {
    expect(SOURCES.filter(isNasaSource).length).toBeGreaterThan(20)
    expect(isNasaSource({ id: 'x', title: 'x', url: 'https://medlineplus.gov/x', usedFor: 'x' })).toBe(false)
  })

  test('the datasets the app ships are listed', () => {
    expect(DATASETS.map((d) => d.id).sort()).toEqual(['donki-sep', 'iswa-crater', 'iswa-goes', 'nlsp-bedrest'])
  })
})

describe('environment equipment is cited', () => {
  test('every environment lists equipment and sources, and each source resolves to a listed page', () => {
    for (const env of ENVIRONMENTS) {
      expect(env.equipment.length, env.id).toBeGreaterThan(0)
      expect(env.sources.length, env.id).toBeGreaterThan(0)
      for (const url of env.sources) expect(getSourceByUrl(url), `${env.id} cites ${url}`).toBeDefined()
    }
  })
})

describe('sources screen data', () => {
  test('every collection channel used in the coverage map has a label', () => {
    for (const i of INDICATORS) for (const ch of [...COVERAGE[i].live, ...COVERAGE[i].planned]) expect(CHANNEL_LABEL[ch], ch).toBeTruthy()
  })

  test('the "could not use" lists are not empty and every item gives a reason', () => {
    expect(UNCOVERED_STANDARD_MEASURES.length).toBeGreaterThan(0)
    for (const n of NOT_USED) expect(n.why.length, n.what).toBeGreaterThan(20)
  })
})
