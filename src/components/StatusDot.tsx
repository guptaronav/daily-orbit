import type { Status } from '../contract/types'
import { STATUS_LABEL } from '../lib/regions'

/** Swatch values: fills only (figure regions, legend squares, chart marks). Not for small text. */
export const STATUS_COLOR: Record<Status, string> = {
  green: 'var(--color-ok)',
  yellow: 'var(--color-watch)',
  red: 'var(--color-act)',
  gray: 'var(--color-nodata)',
}

/** Same hues, tuned per theme for AA text contrast against the panel. */
export const STATUS_TEXT: Record<Status, string> = {
  green: 'var(--color-ok-ink)',
  yellow: 'var(--color-watch-ink)',
  red: 'var(--color-act-ink)',
  gray: 'var(--color-nodata-ink)',
}

/** The short word a console shows when there is no room for the full sentence. */
export const STATUS_SHORT: Record<Status, string> = {
  green: 'nominal',
  yellow: 'watch',
  red: 'act',
  gray: 'no data',
}

type Props = {
  status: Status
  label?: string
  /** 'sm' for dense lists, 'md' for a panel header. */
  size?: 'sm' | 'md'
  /** Use the one-word form ("nominal") instead of the full sentence. */
  short?: boolean
}

/**
 * Color is never the only signal: the status word is always shown beside the swatch, and the
 * pill's border and text carry the AA-contrast variant of the same hue.
 */
export function StatusDot({ status, label, size = 'sm', short = false }: Props) {
  const text = label ?? (short ? STATUS_SHORT[status] : STATUS_LABEL[status])
  return (
    <span className="pill" style={{ color: STATUS_TEXT[status], fontSize: size === 'md' ? '0.75rem' : undefined }}>
      <span
        aria-hidden
        className={size === 'md' ? 'inline-block h-2.5 w-2.5' : 'inline-block h-2 w-2'}
        style={{ background: STATUS_COLOR[status] }}
      />
      {text}
    </span>
  )
}

/** Bare swatch plus text, for legends and dense rows where a bordered pill would be noise. */
export function StatusSwatch({ status, label }: { status: Status; label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm" style={{ color: STATUS_TEXT[status] }}>
      <span aria-hidden className="inline-block h-3 w-3" style={{ background: STATUS_COLOR[status] }} />
      {label ?? STATUS_LABEL[status]}
    </span>
  )
}
