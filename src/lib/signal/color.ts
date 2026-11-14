export type Rgb = { r: number; g: number; b: number }

/** Mean R, G, B of RGBA pixel data (alpha ignored). Empty data is zeros, never NaN. */
export function meanRgb(data: ArrayLike<number>): Rgb {
  const pixels = Math.floor(data.length / 4)
  if (pixels === 0) return { r: 0, g: 0, b: 0 }
  let r = 0
  let g = 0
  let b = 0
  for (let i = 0; i < pixels * 4; i += 4) {
    r += data[i]
    g += data[i + 1]
    b += data[i + 2]
  }
  return { r: r / pixels, g: g / pixels, b: b / pixels }
}

/** Perceived brightness, 0-255 (Rec. 601 weights). */
export const lumaOf = ({ r, g, b }: Rgb): number => 0.299 * r + 0.587 * g + 0.114 * b
