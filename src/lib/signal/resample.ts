/** Frames per second actually achieved over a capture (webcams rarely hit their nominal rate). */
export function effectiveFps(times: readonly number[]): number {
  const n = times.length
  if (n < 2) return 0
  const duration = times[n - 1] - times[0]
  return duration > 0 ? (n - 1) / duration : 0
}

/**
 * Linear resample of unevenly timed samples (times in seconds, ascending) onto a uniform `fps` clock.
 * The pulse estimator assumes evenly spaced frames, and real webcam frames are not.
 */
export function resampleUniform(times: readonly number[], values: readonly number[], fps: number): number[] {
  if (times.length !== values.length) throw new Error('times and values must have the same length')
  const n = times.length
  if (n < 2 || fps <= 0) return [...values]

  const t0 = times[0]
  const count = Math.floor((times[n - 1] - t0) * fps + 1e-9) + 1
  const out = new Array<number>(count)
  let seg = 0
  for (let k = 0; k < count; k++) {
    const t = t0 + k / fps
    while (seg < n - 2 && times[seg + 1] < t) seg++
    const span = times[seg + 1] - times[seg]
    const f = span > 0 ? (t - times[seg]) / span : 0
    out[k] = values[seg] + (values[seg + 1] - values[seg]) * Math.min(1, Math.max(0, f))
  }
  return out
}
