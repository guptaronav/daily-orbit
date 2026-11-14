import { useRef, useState, type KeyboardEvent } from 'react'
import { cellKey, nextCell, type Cell } from '../../lib/vision/amsler'

type Props = {
  n: number
  marked: ReadonlySet<string>
  onToggle: (key: string) => void
  eyeLabel: string
}

/**
 * n x n grid of buttons with a central fixation dot. Marked cells are wavy, blurred or missing.
 * The grid is ONE tab stop: arrow keys move between squares, Space or Enter marks one.
 */
export function AmslerGrid({ n, marked, onToggle, eyeLabel }: Props) {
  const [active, setActive] = useState<Cell>({ row: Math.floor(n / 2), col: Math.floor(n / 2) })
  const cells = useRef(new Map<string, HTMLButtonElement>())

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, from: Cell) {
    const to = nextCell(from, e.key, n)
    if (!to) return
    e.preventDefault()
    setActive(to)
    cells.current.get(cellKey(to.row, to.col))?.focus()
  }

  return (
    <div className="relative aspect-square w-full max-w-[360px] border border-ink bg-panel" role="group" aria-label={`Amsler grid, ${eyeLabel}`}>
      <div className="grid h-full w-full" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
        {Array.from({ length: n * n }, (_, i) => {
          const row = Math.floor(i / n)
          const col = i % n
          const key = cellKey(row, col)
          const isMarked = marked.has(key)
          return (
            <button
              key={key}
              ref={(el) => {
                if (el) cells.current.set(key, el)
                else cells.current.delete(key)
              }}
              type="button"
              tabIndex={active.row === row && active.col === col ? 0 : -1}
              aria-pressed={isMarked}
              aria-label={`Row ${row + 1}, column ${col + 1}`}
              onClick={() => onToggle(key)}
              onFocus={() => setActive({ row, col })}
              onKeyDown={(e) => onKeyDown(e, { row, col })}
              className={`border border-rule/80 ${isMarked ? 'bg-act/70' : 'hover:bg-accent/10'}`}
            />
          )
        })}
      </div>
      <span aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink" />
    </div>
  )
}
