export type Baseline = { mean: number; sd: number; n: number }

const MIN_SAMPLES = 5
const SD_FLOOR_FRACTION = 0.05 // sd never below 5% of |mean| (NOTES.md)
const SD_FLOOR_ABS = 1e-6

export function computeBaseline(values: readonly number[]): Baseline | null {
  const n = values.length
  if (n < MIN_SAMPLES) return null
  const mean = values.reduce((a, b) => a + b, 0) / n
  const variance = values.reduce((a, v) => a + (v - mean) ** 2, 0) / (n - 1)
  const sd = Math.max(Math.sqrt(variance), SD_FLOOR_FRACTION * Math.abs(mean), SD_FLOOR_ABS)
  return { mean, sd, n }
}
