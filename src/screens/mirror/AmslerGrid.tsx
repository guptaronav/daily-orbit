import { cellKey } from '../../lib/vision/amsler'

type Props = {
  n: number
  marked: ReadonlySet<string>
  onToggle: (key: string) => void
  eyeLabel: string
}

/** 10 x 10 grid of buttons with a central fixation dot. Marked cells are wavy, blurred or missing. */
export function AmslerGrid({ n, marked, onToggle, eyeLabel }: Props) {
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
              type="button"
              aria-pressed={isMarked}
              aria-label={`Row ${row + 1}, column ${col + 1}`}
              onClick={() => onToggle(key)}
              className={`border border-rule/80 ${isMarked ? 'bg-act/70' : 'hover:bg-accent/10'}`}
            />
          )
        })}
      </div>
      <span aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink" />
    </div>
  )
}
