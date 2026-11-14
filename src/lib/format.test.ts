import { describe, expect, test } from 'vitest'
import type { Measurement } from '../contract/types'
import { formatValue } from './format'

const base: Measurement = {
  id: 'x',
  crewId: 'c',
  timestamp: '2026-11-14T00:00:00Z',
  indicator: 'heartRate',
  value: 62,
  unit: 'bpm',
  quality: { score: 1, passed: true },
  source: 'simulated',
}

describe('formatValue', () => {
  test('numbers include the unit', () => {
    expect(formatValue(base)).toBe('62 bpm')
  })
  test('numbers without a unit are just the number', () => {
    expect(formatValue({ ...base, unit: undefined })).toBe('62')
  })
  test('0-10 scales read as a fraction of 10', () => {
    expect(formatValue({ ...base, indicator: 'mood', value: 7.3, unit: '0-10' })).toBe('7.3 / 10')
  })
  test('symptom reports are counted', () => {
    expect(formatValue({ ...base, indicator: 'symptomReport', value: { symptoms: ['a', 'b'] } })).toBe('2 symptoms')
    expect(formatValue({ ...base, indicator: 'symptomReport', value: { symptoms: ['a'] } })).toBe('1 symptom')
    expect(formatValue({ ...base, indicator: 'symptomReport', value: { symptoms: [] } })).toBe('No symptoms')
  })
  test('amsler distortion is described', () => {
    expect(formatValue({ ...base, indicator: 'amslerDistortion', value: { distortion: true } })).toBe('Distortion reported')
    expect(formatValue({ ...base, indicator: 'amslerDistortion', value: { distortion: false } })).toBe('No distortion')
  })
  test('unknown object shape falls back safely', () => {
    expect(formatValue({ ...base, value: { foo: 1 } })).toBe('See details')
  })
})
