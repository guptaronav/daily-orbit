import { describe, expect, test } from 'vitest'
import { INDICATORS } from '../contract/types'
import { COVERAGE } from './dataCoverage'
import { getContent, isTodo } from './content'
import { ENVIRONMENTS } from './environments'
import { CHANNEL_LABEL, NOT_USED, SOURCES, UNCOVERED_STANDARD_MEASURES, getSource, sourcesOfKind } from './sources'

const NASA_HOST = /^https:\/\/([a-z0-9-]+\.)*nasa\.gov\//
const TEXT_FIELDS = ['canMeasureInSpace', 'whyCheck', 'hazardEffect', 'whenToEscalate', 'prevention', 'recommendedAction'] as const

describe('sources list', () => {
  test('ids are unique and every entry has a title, a URL and at least one use', () => {
    expect(new Set(SOURCES.map((s) => s.id)).size).toBe(SOURCES.length)
    for (const s of SOURCES) {
      expect(s.title.length, s.id).toBeGreaterThan(3)
      expect(s.url, s.id).toMatch(/^https:\/\//)
      expect(s.usedFor.length, s.id).toBeGreaterThan(0)
    }
  })

  test('every page and standard is on a nasa.gov host', () => {
    for (const s of [...sourcesOfKind('page'), ...sourcesOfKind('standard')]) expect(s.url, s.id).toMatch(NASA_HOST)
  })

  test('the datasets the app ships are listed', () => {
    expect(sourcesOfKind('dataset').map((s) => s.id).sort()).toEqual(['donki-sep', 'iswa-crater', 'iswa-goes', 'nlsp-bedrest'])
  })
})

describe('indicator content is cited', () => {
  test('every indicator with written text names at least one source, and every source id exists', () => {
    for (const i of INDICATORS) {
      const c = getContent(i)
      const written = TEXT_FIELDS.some((f) => !isTodo(c[f]))
      if (written) expect(c.sources?.length ?? 0, i).toBeGreaterThan(0)
      for (const id of c.sources ?? []) expect(getSource(id), `${i} cites ${id}`).toBeDefined()
    }
  })

  test('no answer is empty: it is real text or the exact placeholder', () => {
    for (const i of INDICATORS) {
      const c = getContent(i)
      for (const f of TEXT_FIELDS) expect(c[f].trim().length, `${i}.${f}`).toBeGreaterThan(10)
      expect(c.hrpRisk.trim().length, i).toBeGreaterThan(10)
    }
  })

  test('answers stay short enough to read on a card', () => {
    for (const i of INDICATORS) for (const f of TEXT_FIELDS) expect(getContent(i)[f].length, `${i}.${f}`).toBeLessThanOrEqual(420)
  })
})

describe('environment equipment is cited', () => {
  test('every environment lists equipment with sources that exist', () => {
    for (const env of ENVIRONMENTS) {
      expect(env.equipment.length, env.id).toBeGreaterThan(0)
      expect(env.equipmentSources?.length ?? 0, env.id).toBeGreaterThan(0)
      for (const id of env.equipmentSources ?? []) expect(getSource(id), `${env.id} cites ${id}`).toBeDefined()
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
