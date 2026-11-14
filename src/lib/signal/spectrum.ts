import { BAND_HI_HZ, BAND_LO_HZ, PEAK_HALF_WIDTH_HZ } from './constants'

const STEP_HZ = 0.01 // 0.6 bpm resolution
const SEGMENT_SECONDS = 10
const SEGMENT_OVERLAP = 0.5
const REFINE_HALF_WIDTH_HZ = 0.15
const HALVING_RATIO = 0.5 // power near f/2 must be at least this fraction of the power near f to prefer f/2

export type Peak = { freq: number; prominence: number }

const FREQS: number[] = []
for (let f = BAND_LO_HZ; f <= BAND_HI_HZ + 1e-9; f += STEP_HZ) FREQS.push(f)

/** Hann-windowed DFT power at each band frequency for one segment. */
function periodogram(segment: readonly number[], fps: number, freqs: readonly number[]): number[] {
  const n = segment.length
  const mean = segment.reduce((a, v) => a + v, 0) / n
  const x = segment.map((v, i) => (v - mean) * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1))))
  return freqs.map((f) => {
    const w = (2 * Math.PI * f) / fps
    let re = 0
    let im = 0
    for (let i = 0; i < n; i++) {
      re += x[i] * Math.cos(w * i)
      im += x[i] * Math.sin(w * i)
    }
    return re * re + im * im
  })
}

/**
 * Welch-style average: the periodograms of overlapping 10 s segments. Noise peaks wander between
 * segments and average out, while a steady pulse stays put, so a real pulse stands out more.
 */
function averagedSpectrum(signal: readonly number[], fps: number): number[] {
  const len = Math.round(SEGMENT_SECONDS * fps)
  if (signal.length < len * 1.5) return periodogram(signal, fps, FREQS)
  const hop = Math.round(len * (1 - SEGMENT_OVERLAP))
  const sum = new Array<number>(FREQS.length).fill(0)
  for (let start = 0; start + len <= signal.length; start += hop) {
    periodogram(signal.slice(start, start + len), fps, FREQS).forEach((p, k) => (sum[k] += p))
  }
  return sum
}

/**
 * Strongest frequency in the heart-rate band and how convincing it is.
 * `prominence` is the share of band power at the peak and at its second harmonic (a real pulse
 * waveform is not a pure sine): ~1 for a clean pulse, low for noise. A signal with no power returns
 * prominence 0 (never NaN). The peak is found on the averaged spectrum, then refined on the full
 * capture so the reported rate keeps its resolution.
 */
export function dominantFrequency(signal: readonly number[], fps: number): Peak {
  if (signal.length < 2 || fps <= 0) return { freq: 0, prominence: 0 }

  const power = averagedSpectrum(signal, fps)
  const total = power.reduce((a, v) => a + v, 0)
  if (total <= 0) return { freq: 0, prominence: 0 }

  const near = (center: number) => power.reduce((a, p, i) => (Math.abs(FREQS[i] - center) <= PEAK_HALF_WIDTH_HZ ? a + p : a), 0)
  let coarse = FREQS[power.indexOf(Math.max(...power))]

  // The strongest peak can be the second harmonic (72 bpm read as 144). If there is a substantial
  // component at half that frequency, that is the real fundamental.
  const half = coarse / 2
  if (half >= BAND_LO_HZ && near(half) >= HALVING_RATIO * near(coarse)) {
    const candidates = FREQS.map((f, i) => ({ f, p: power[i] })).filter(({ f }) => Math.abs(f - half) <= PEAK_HALF_WIDTH_HZ)
    coarse = candidates.reduce((best, c) => (c.p > best.p ? c : best)).f
  }
  const harmonic = 2 * coarse <= BAND_HI_HZ ? near(2 * coarse) : 0

  const around = FREQS.filter((f) => Math.abs(f - coarse) <= REFINE_HALF_WIDTH_HZ)
  const fine = periodogram(signal, fps, around)
  const freq = around[fine.indexOf(Math.max(...fine))]

  return { freq, prominence: (near(coarse) + harmonic) / total }
}
