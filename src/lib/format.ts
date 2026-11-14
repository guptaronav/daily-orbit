import type { Measurement } from '../contract/types'

export function formatValue(m: Measurement): string {
  if (typeof m.value === 'number') {
    const v = Math.round(m.value * 100) / 100 // 2 decimals covers logMAR; stored values stay unrounded
    if (m.unit === '0-10') return `${v} / 10`
    return m.unit ? `${v} ${m.unit}` : `${v}`
  }
  const v = m.value
  if (Array.isArray(v.symptoms)) {
    const n = v.symptoms.length
    return n === 0 ? 'No symptoms' : `${n} ${n === 1 ? 'symptom' : 'symptoms'}`
  }
  if (typeof v.distortion === 'boolean') return v.distortion ? 'Distortion reported' : 'No distortion'
  return 'See details'
}
