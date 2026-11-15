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
  // Any pain is worth a look; reporting it is what the app rewards most.
  if (m.indicator === 'painReport' && typeof m.value.level === 'number') {
    return m.value.level > 0 ? 'yellow' : 'green'
  }
  // PHQ-2 / GAD-2: a score of 3 or more on either is the published screening cutoff (Kroenke 2003, 2007).
  if (m.indicator === 'moodScreen' && typeof m.value.phq2 === 'number' && typeof m.value.gad2 === 'number') {
    return m.value.phq2 >= 3 || m.value.gad2 >= 3 ? 'yellow' : 'green'
  }
  if (m.indicator === 'amslerDistortion' && typeof m.value.distortion === 'boolean') {
    return m.value.distortion ? 'yellow' : 'green'
  }
  return 'gray'
}
