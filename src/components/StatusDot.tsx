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

/** Tints for pill backgrounds. */
export const STATUS_WASH: Record<Status, string> = {
  green: 'var(--color-ok-wash)',
  yellow: 'var(--color-watch-wash)',
  red: 'var(--color-act-wash)',
  gray: 'var(--color-nodata-wash)',
}

/** The short word a dense row shows when there is no room for the full sentence. */
export const STATUS_SHORT: Record<Status, string> = {
  green: 'Nominal',
  yellow: 'Watch',
  red: 'Act',
  gray: 'No data',
}

type Props = {
  status: Status
  label?: string
  size?: 'sm' | 'md'
  /** Use the one-word form ("Watch") instead of the full sentence. */
  short?: boolean
}

/**
 * Status as a tinted pill. Color is never the only signal: the word is inside the pill, so the
 * meaning survives a monochrome print, a color-blind reader and a bad projector.
 */
export function StatusDot({ status, label, size = 'sm', short = false }: Props) {
  const text = label ?? (short ? STATUS_SHORT[status] : STATUS_LABEL[status])
  return (
    <span
      className="pill"
      style={{
        background: STATUS_WASH[status],
        color: STATUS_TEXT[status],
        fontSize: size === 'md' ? '0.875rem' : undefined,
      }}
    >
      {text}
    </span>
  )
}

/** Swatch plus text, for legends where the color square itself is the thing being explained. */
export function StatusSwatch({ status, label }: { status: Status; label?: string }) {
  return (
    <span className="pill" style={{ background: STATUS_WASH[status], color: STATUS_TEXT[status] }}>
      <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: STATUS_COLOR[status] }} />
      {label ?? STATUS_LABEL[status]}
    </span>
  )
}
