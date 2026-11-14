import { describe, expect, test } from 'vitest'
import { INDICATORS } from '../contract/types'
import { REGIONS } from './regions'
import { getContent, isTodo } from './content'

describe('indicator content', () => {
  test('every indicator has a content entry', () => {
    for (const i of INDICATORS) expect(getContent(i).id).toBe(i)
  })

  test('content region matches the region that lists the indicator', () => {
    for (const region of REGIONS) {
      for (const i of region.indicators) expect(getContent(i).region).toBe(region.id)
    }
  })

  test('isTodo detects placeholders', () => {
    expect(isTodo('[CONTENT TODO]')).toBe(true)
    expect(isTodo('Real text')).toBe(false)
  })
})
