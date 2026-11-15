/// <reference types="node" />
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import bedrest from '../data/bedrest.json'
import committed from '../content/validation.json'
import { validateOnBedrest, type BedrestDay, type BedrestRecord } from './validation'

/*
 * Keeps the published validation numbers honest: the committed src/content/validation.json must
 * match what the rules produce today. To regenerate it after changing a rule:
 *   WRITE_VALIDATION=1 npx vitest run src/lib/validation.test.ts
 */

const result = validateOnBedrest(bedrest.records as BedrestRecord[], bedrest.days as BedrestDay[])

describe('validation on real NASA bed-rest data', () => {
  it('matches the numbers the app and README publish', () => {
    if (process.env.WRITE_VALIDATION) {
      writeFileSync(join(process.cwd(), 'src', 'content', 'validation.json'), JSON.stringify(result, null, 2) + '\n')
      return
    }
    expect(result).toEqual(committed)
  })
  it('replays the whole record, both phases', () => {
    expect(result.baselineDays).toBeGreaterThan(0)
    expect(result.tiltDays).toBeGreaterThan(0)
  })
})
