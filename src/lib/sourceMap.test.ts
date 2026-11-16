import { describe, expect, test } from 'vitest'
import { AREAS } from './sourceMap'
import { DATASETS, SOURCES } from './sources'

describe('where each source is used on the site', () => {
  test('every id in the map exists', () => {
    const ids = new Set(SOURCES.map((s) => s.id))
    const data = new Set(DATASETS.map((d) => d.id))
    for (const a of AREAS) {
      for (const id of a.sources) expect(ids.has(id), `${a.id}: ${id}`).toBe(true)
      for (const id of a.datasets ?? []) expect(data.has(id), `${a.id}: ${id}`).toBe(true)
    }
  })

  test('every source in sources.json is used somewhere on the site', () => {
    const used = new Set(AREAS.flatMap((a) => a.sources))
    const unused = SOURCES.filter((s) => !used.has(s.id)).map((s) => s.id)
    expect(unused).toEqual([])
  })

  test('every bundled NASA dataset is shown somewhere', () => {
    const used = new Set(AREAS.flatMap((a) => a.datasets ?? []))
    expect(DATASETS.filter((d) => !used.has(d.id)).map((d) => d.id)).toEqual([])
  })
})
