import { useId } from 'react'
import { linkBtn } from './ui'

type Props = {
  label: string
  hint?: string
  /** `undefined` means not answered. Answering the middle value (5) must still count. */
  value: number | undefined
  onChange: (value: number | undefined) => void
}

/**
 * A 0 to 10 question that can be skipped. It starts unanswered at the middle position, so a plain
 * `onChange` is not enough: clicking the thumb where it already sits (5) fires no change event.
 * Releasing the pointer, or pressing Enter or Space, therefore also counts as answering.
 */
export function OptionalSlider({ label, hint, value, onChange }: Props) {
  const id = useId()
  const answer = (el: HTMLInputElement) => onChange(Number(el.value))
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm">
      <label htmlFor={id}>
        {label}
        {hint && <span className="text-xs text-muted"> ({hint})</span>}
      </label>
      <span className="flex items-center gap-3">
        <input
          id={id}
          type="range"
          min={0}
          max={10}
          step={1}
          value={value ?? 5}
          aria-valuetext={value === undefined ? 'not answered' : String(value)}
          onChange={(e) => answer(e.currentTarget)}
          onPointerUp={(e) => answer(e.currentTarget)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              answer(e.currentTarget)
            }
          }}
        />
        <span className={`w-10 text-right ${value === undefined ? 'text-muted' : 'font-medium'}`}>{value ?? 'skip'}</span>
        <span className="w-12 text-right">
          {value !== undefined && (
            <button type="button" onClick={() => onChange(undefined)} aria-label={`Clear answer: ${label}`} className={linkBtn}>
              Clear
            </button>
          )}
        </span>
      </span>
    </div>
  )
}
