import { BAND_HI_HZ, BAND_LO_HZ, PEAK_HALF_WIDTH_HZ } from './constants'

const STEP_HZ = 0.01 // 0.6 bpm resolution

export type Peak = { freq: number; prominence: number }

/**
 * Strongest frequency in the heart-rate band, via a Hann-windowed DFT evaluated only on the band.
 * `prominence` is the share of band power within +/- PEAK_HALF_WIDTH_HZ of the peak: ~1 for a clean
 * pulse, low for noise. A signal with no power returns prominence 0 (never NaN).
 */
export function dominantFrequency(signal: readonly number[], fps: number): Peak {
  const n = signal.length
  if (n < 2 || fps <= 0) return { freq: 0, prominence: 0 }

  const mean = signal.reduce((a, v) => a + v, 0) / n
  const x = signal.map((v, i) => (v - mean) * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1))))

  const freqs: number[] = []
  const power: number[] = []
  for (let f = BAND_LO_HZ; f <= BAND_HI_HZ + 1e-9; f += STEP_HZ) {
    const w = (2 * Math.PI * f) / fps
    let re = 0
    let im = 0
    for (let i = 0; i < n; i++) {
      re += x[i] * Math.cos(w * i)
      im += x[i] * Math.sin(w * i)
    }
    freqs.push(f)
    power.push(re * re + im * im)
  }

  const total = power.reduce((a, v) => a + v, 0)
  if (total <= 0) return { freq: 0, prominence: 0 }

  const peak = power.indexOf(Math.max(...power))
  const near = power.reduce((a, p, i) => (Math.abs(freqs[i] - freqs[peak]) <= PEAK_HALF_WIDTH_HZ ? a + p : a), 0)
  return { freq: freqs[peak], prominence: near / total }
}
