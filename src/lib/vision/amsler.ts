export type AmslerSummary = {
  distortion: boolean
  distortedCells: number
  /** Marked cells / all cells in the grid. */
  fraction: number
  /** Any marked cell in the central third of the grid (where macular problems show first). */
  centralAffected: boolean
}

export const cellKey = (row: number, col: number): string => `${row},${col}`

/** Summarize the cells a person marked as wavy, blurred or missing on an n x n Amsler grid. */
export function summarizeAmsler(marked: ReadonlySet<string>, n: number): AmslerSummary {
  const lo = Math.floor(n / 3)
  const hi = Math.ceil((2 * n) / 3) - 1
  let count = 0
  let central = false
  for (const key of marked) {
    const [row, col] = key.split(',').map(Number)
    if (!Number.isInteger(row) || !Number.isInteger(col) || row < 0 || col < 0 || row >= n || col >= n) continue
    count++
    if (row >= lo && row <= hi && col >= lo && col <= hi) central = true
  }
  return { distortion: count > 0, distortedCells: count, fraction: count / (n * n), centralAffected: central }
}
