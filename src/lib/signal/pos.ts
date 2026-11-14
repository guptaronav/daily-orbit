const WINDOW_SECONDS = 1.6 // from the POS paper (Wang et al., 2017)

const mean = (x: number[]) => x.reduce((a, v) => a + v, 0) / x.length
const std = (x: number[]) => {
  const m = mean(x)
  return Math.sqrt(x.reduce((a, v) => a + (v - m) ** 2, 0) / x.length)
}

/**
 * Plane-Orthogonal-to-Skin rPPG. Takes per-frame mean R, G, B of the face ROI and returns a pulse
 * signal the same length. Overlap-adds one projected window per frame; captures shorter than one
 * window return all zeros.
 */
export function pos(r: number[], g: number[], b: number[], fps: number): number[] {
  const n = r.length
  const l = Math.round(WINDOW_SECONDS * fps)
  const out = new Array<number>(n).fill(0)
  if (n < l || l < 2) return out

  for (let end = l - 1; end < n; end++) {
    const start = end - l + 1
    const wr = r.slice(start, end + 1)
    const wg = g.slice(start, end + 1)
    const wb = b.slice(start, end + 1)
    const [mr, mg, mb] = [mean(wr), mean(wg), mean(wb)]
    if (mr === 0 || mg === 0 || mb === 0) continue

    // Temporal normalization, then the two skin-orthogonal projections.
    const s1 = wg.map((v, k) => v / mg - wb[k] / mb)
    const s2 = wr.map((v, k) => -2 * (v / mr) + wg[k] / mg + wb[k] / mb)
    const sd2 = std(s2)
    const alpha = sd2 === 0 ? 0 : std(s1) / sd2
    const h = s1.map((v, k) => v + alpha * s2[k])
    const hm = mean(h)
    for (let k = 0; k < l; k++) out[start + k] += h[k] - hm
  }
  return out
}
