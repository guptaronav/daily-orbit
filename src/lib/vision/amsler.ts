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

export type Cell = { row: number; col: number }

/**
 * Where the keyboard focus goes next on the grid. Arrow keys move one square and stop at the edges,
 * Home/End jump to the ends of the row. Any other key returns null so normal behavior (Tab, Space) is kept.
 */
export function nextCell(from: Cell, key: string, n: number): Cell | null {
  const clamp = (v: number) => Math.min(n - 1, Math.max(0, v))
  switch (key) {
    case 'ArrowUp':
      return { row: clamp(from.row - 1), col: from.col }
    case 'ArrowDown':
      return { row: clamp(from.row + 1), col: from.col }
    case 'ArrowLeft':
      return { row: from.row, col: clamp(from.col - 1) }
    case 'ArrowRight':
      return { row: from.row, col: clamp(from.col + 1) }
    case 'Home':
      return { row: from.row, col: 0 }
    case 'End':
      return { row: from.row, col: n - 1 }
    default:
      return null
  }
}
