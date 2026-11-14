import type { Measurement } from '../contract/types'

export function formatValue(m: Measurement): string {
  if (typeof m.value === 'number') {
    if (m.unit === '0-10') return `${m.value} / 10`
    return m.unit ? `${m.value} ${m.unit}` : `${m.value}`
  }
  const v = m.value
  if (Array.isArray(v.symptoms)) {
    const n = v.symptoms.length
    return n === 0 ? 'No symptoms' : `${n} ${n === 1 ? 'symptom' : 'symptoms'}`
  }
  if (typeof v.distortion === 'boolean') return v.distortion ? 'Distortion reported' : 'No distortion'
  return 'See details'
}
