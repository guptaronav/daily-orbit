import type { Status } from '../contract/types'
import { STATUS_LABEL } from '../lib/regions'

/** Swatch values: fills only (figure regions, legend squares). Too light for small text. */
export const STATUS_COLOR: Record<Status, string> = {
  green: 'var(--color-ok)',
  yellow: 'var(--color-watch)',
  red: 'var(--color-act)',
  gray: 'var(--color-nodata)',
}

/** Darker variants of the same hues, contrast-checked for text on paper. */
export const STATUS_TEXT: Record<Status, string> = {
  green: 'var(--color-ok-ink)',
  yellow: 'var(--color-watch-ink)',
  red: 'var(--color-act-ink)',
  gray: 'var(--color-nodata-ink)',
}

type Props = {
  status: Status
  label?: string
  /** 'sm' for dense lists, 'md' for a card header. */
  size?: 'sm' | 'md'
}

/**
 * Color is never the only signal: the status word is always shown beside the swatch,
 * and the word carries the AA-contrast variant of the same hue.
 */
export function StatusDot({ status, label = STATUS_LABEL[status], size = 'sm' }: Props) {
  const text = size === 'md' ? 'text-sm font-medium' : 'text-xs font-medium'
  return (
    <span className={`inline-flex items-center gap-2 whitespace-nowrap ${text}`} style={{ color: STATUS_TEXT[status] }}>
      <span
        aria-hidden
        className={size === 'md' ? 'inline-block h-3.5 w-3.5' : 'inline-block h-3 w-3'}
        style={{ background: STATUS_COLOR[status], outline: '1px solid rgb(0 0 0 / 0.2)' }}
      />
      {label}
    </span>
  )
}
