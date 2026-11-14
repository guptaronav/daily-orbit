import { BAND_HI_HZ, BAND_LO_HZ } from './constants'

type Biquad = { b0: number; b1: number; b2: number; a1: number; a2: number }

const Q = Math.SQRT1_2 // Butterworth

// RBJ audio-EQ-cookbook biquads, normalized so a0 = 1.
function biquad(kind: 'low' | 'high', fc: number, fs: number): Biquad {
  const w0 = (2 * Math.PI * fc) / fs
  const cos = Math.cos(w0)
  const alpha = Math.sin(w0) / (2 * Q)
  const a0 = 1 + alpha
  const [b0, b1] = kind === 'low' ? [(1 - cos) / 2, 1 - cos] : [(1 + cos) / 2, -(1 + cos)]
  return { b0: b0 / a0, b1: b1 / a0, b2: b0 / a0, a1: (-2 * cos) / a0, a2: (1 - alpha) / a0 }
}

function run(x: number[], f: Biquad): number[] {
  const y = new Array<number>(x.length)
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0
  for (let i = 0; i < x.length; i++) {
    const v = f.b0 * x[i] + f.b1 * x1 + f.b2 * x2 - f.a1 * y1 - f.a2 * y2
    y[i] = v
    x2 = x1; x1 = x[i]; y2 = y1; y1 = v
  }
  return y
}

/** Zero-phase (forward then backward) filtering, with odd-reflection padding to tame edge transients. */
function filtfilt(x: number[], f: Biquad, fs: number): number[] {
  const pad = Math.min(x.length - 1, Math.round(3 * fs))
  const n = x.length
  const padded = [
    ...Array.from({ length: pad }, (_, k) => 2 * x[0] - x[pad - k]),
    ...x,
    ...Array.from({ length: pad }, (_, k) => 2 * x[n - 1] - x[n - 2 - k]),
  ]
  const forward = run(padded, f)
  const backward = run(forward.reverse(), f).reverse()
  return backward.slice(pad, pad + n)
}

/** Heart-rate band-pass (0.7 to 3.0 Hz): a high-pass then a low-pass, each applied zero-phase. */
export function bandpass(x: number[], fs: number): number[] {
  if (x.length < 4) return [...x]
  return filtfilt(filtfilt(x, biquad('high', BAND_LO_HZ, fs), fs), biquad('low', BAND_HI_HZ, fs), fs)
}
