import { describe, expect, it } from 'vitest'
import { getThreshold } from '../config/thresholds'
import { ENTRY_FORMS, getForm, validateEntry, type EntryKind } from './manualEntry'
import { REGIONS } from './regions'

const KINDS: EntryKind[] = ['bloodPressure', 'temperature', 'bloodSugar', 'sleepHours', 'exerciseMinutes', 'bodyMass', 'bowelMovements']

const ok = (kind: EntryKind, raw: Record<string, string>) => {
  const result = validateEntry(kind, raw)
  if (!result.ok) throw new Error(`expected ok, got: ${result.error}`)
  return result.values
}

const err = (kind: EntryKind, raw: Record<string, string>) => {
  const result = validateEntry(kind, raw)
  if (result.ok) throw new Error('expected an error')
  return result
}

describe('ENTRY_FORMS', () => {
  it('has the five original forms plus body mass and bowel movements (the gut and nutrition region needs a way to log data)', () => {
    expect(ENTRY_FORMS.map((f) => f.kind)).toEqual(KINDS)
  })

  it('takes every unit from the threshold table, never a hardcoded string', () => {
    for (const form of ENTRY_FORMS) {
      for (const f of form.fields) expect(f.unit).toBe(getThreshold(f.indicator).unit)
    }
  })

  it('uses unique field names inside each form and a sane guard range', () => {
    for (const form of ENTRY_FORMS) {
      expect(new Set(form.fields.map((f) => f.name)).size).toBe(form.fields.length)
      for (const f of form.fields) expect(f.min).toBeLessThan(f.max)
    }
  })

  it('getForm throws on an unknown kind', () => {
    expect(() => getForm('nope' as EntryKind)).toThrow()
  })
})

describe('validateEntry: accepted input', () => {
  it('parses blood pressure into two measurements in field order', () => {
    expect(ok('bloodPressure', { systolic: '118', diastolic: '76' })).toEqual([
      { indicator: 'bloodPressureSys', value: 118, unit: 'mmHg' },
      { indicator: 'bloodPressureDia', value: 76, unit: 'mmHg' },
    ])
  })

  it('parses decimals and surrounding whitespace', () => {
    expect(ok('temperature', { temperature: ' 36.8 ' })).toEqual([{ indicator: 'temperature', value: 36.8, unit: '°C' }])
    expect(ok('sleepHours', { sleepHours: '.5' })).toEqual([{ indicator: 'sleepHours', value: 0.5, unit: 'h' }])
  })

  it('accepts zero where zero is a real answer', () => {
    expect(ok('exerciseMinutes', { exerciseMinutes: '0' })[0].value).toBe(0)
    expect(ok('sleepHours', { sleepHours: '0' })[0].value).toBe(0)
  })

  it('accepts both boundary values of every guard range', () => {
    for (const form of ENTRY_FORMS) {
      if (form.kind === 'bloodPressure') continue // covered separately: sys must exceed dia
      for (const f of form.fields) {
        expect(ok(form.kind, { [f.name]: String(f.min) })[0].value).toBe(f.min)
        expect(ok(form.kind, { [f.name]: String(f.max) })[0].value).toBe(f.max)
      }
    }
  })

  it('accepts the boundary values of blood pressure', () => {
    expect(ok('bloodPressure', { systolic: '300', diastolic: '20' })).toHaveLength(2)
    expect(ok('bloodPressure', { systolic: '40', diastolic: '20' })).toHaveLength(2)
  })
})

describe('validateEntry: rejected input', () => {
  it('rejects empty and whitespace-only input, naming the field', () => {
    expect(err('temperature', { temperature: '' })).toMatchObject({ field: 'temperature' })
    expect(err('temperature', { temperature: '   ' }).error).toMatch(/enter a value/i)
    expect(err('bloodPressure', { systolic: '', diastolic: '76' }).field).toBe('systolic')
  })

  it('rejects a missing field entirely', () => {
    expect(err('bloodSugar', {}).field).toBe('bloodSugar')
  })

  it('rejects non-numeric text, including half-numeric typos', () => {
    for (const text of ['abc', '12abc', '1.2.3', '1,200', '1e3', '--5', '.', '-', '+5', 'NaN', 'Infinity']) {
      expect(validateEntry('bloodSugar', { bloodSugar: text }).ok, text).toBe(false)
    }
  })

  it('rejects negatives on fields that cannot be negative', () => {
    expect(err('sleepHours', { sleepHours: '-1' }).error).toMatch(/between 0 and 24/)
    expect(err('exerciseMinutes', { exerciseMinutes: '-0.5' }).field).toBe('exerciseMinutes')
  })

  it('rejects values past either end of the guard range', () => {
    expect(err('bloodPressure', { systolic: '9000', diastolic: '80' }).field).toBe('systolic')
    expect(err('temperature', { temperature: '98.6' }).field).toBe('temperature') // Fahrenheit by mistake
    expect(err('temperature', { temperature: '24.9' }).field).toBe('temperature')
    expect(err('sleepHours', { sleepHours: '24.5' }).field).toBe('sleepHours')
    expect(err('bloodSugar', { bloodSugar: '901' }).field).toBe('bloodSugar')
  })

  it('says the range is an input guard, not a health limit', () => {
    expect(err('bloodSugar', { bloodSugar: '901' }).error).toMatch(/input guard/i)
  })

  it('rejects swapped blood-pressure numbers', () => {
    expect(err('bloodPressure', { systolic: '76', diastolic: '118' }).field).toBe('diastolic')
    expect(err('bloodPressure', { systolic: '90', diastolic: '90' }).error).toMatch(/higher than diastolic/i)
  })

  it('reports the first bad field when several are bad', () => {
    expect(err('bloodPressure', { systolic: 'x', diastolic: 'y' }).field).toBe('systolic')
  })
})

describe('gut and nutrition forms', () => {
  it('body mass parses to kilograms', () => {
    expect(ok('bodyMass', { bodyMass: ' 72.4 ' })).toEqual([{ indicator: 'bodyMass', value: 72.4, unit: 'kg' }])
  })

  it('body mass rejects impossible typos, naming the guard and the field', () => {
    for (const bad of ['5', '500']) {
      const e = err('bodyMass', { bodyMass: bad })
      expect(e.field).toBe('bodyMass')
      expect(e.error).toMatch(/input guard/i)
    }
  })

  it('bowel movements are a whole number per day, zero included', () => {
    expect(ok('bowelMovements', { bowelMovements: '0' })[0].value).toBe(0)
    expect(ok('bowelMovements', { bowelMovements: '3' })).toEqual([{ indicator: 'bowelMovements', value: 3, unit: 'per day' }])
  })

  it('bowel movements reject fractions and absurd counts', () => {
    expect(err('bowelMovements', { bowelMovements: '2.5' }).error).toMatch(/whole number/i)
    expect(err('bowelMovements', { bowelMovements: '25' }).error).toMatch(/between/i)
  })

  it('both forms log into the gut and nutrition region, so the body map reacts', () => {
    const gut = REGIONS.find((r) => r.id === 'gut')!
    for (const kind of ['bodyMass', 'bowelMovements'] as const) {
      for (const f of getForm(kind).fields) expect(gut.indicators).toContain(f.indicator)
    }
  })
})
