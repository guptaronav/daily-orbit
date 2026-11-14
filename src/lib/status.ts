import type { Measurement, Status } from '../contract/types'
import type { Baseline } from './baseline'

// Statistical deviation from the astronaut's own baseline, NOT a clinical threshold.
const YELLOW_SD = 1
const RED_SD = 2

export function getStatus(m: Measurement, baseline: Baseline | null): Status {
  if (!m.quality.passed || baseline === null || typeof m.value !== 'number') return 'gray'
  const z = Math.abs(m.value - baseline.mean) / baseline.sd
  if (z <= YELLOW_SD) return 'green'
  if (z <= RED_SD) return 'yellow'
  return 'red'
}

export function getCategoricalStatus(m: Measurement): Status {
  if (!m.quality.passed || typeof m.value === 'number') return 'gray'
  if (m.indicator === 'symptomReport' && Array.isArray(m.value.symptoms)) {
    return m.value.symptoms.length > 0 ? 'yellow' : 'green'
  }
  if (m.indicator === 'amslerDistortion' && typeof m.value.distortion === 'boolean') {
    return m.value.distortion ? 'yellow' : 'green'
  }
  return 'gray'
}
