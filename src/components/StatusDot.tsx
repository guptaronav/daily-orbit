import type { Status } from '../contract/types'
import { STATUS_LABEL } from '../lib/regions'

export const STATUS_COLOR: Record<Status, string> = {
  green: 'var(--color-ok)',
  yellow: 'var(--color-watch)',
  red: 'var(--color-act)',
  gray: 'var(--color-nodata)',
}

/** Color is never the only signal: the status word is always shown beside the swatch. */
export function StatusDot({ status, label = STATUS_LABEL[status] }: { status: Status; label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <span aria-hidden className="inline-block h-3 w-3" style={{ background: STATUS_COLOR[status] }} />
      {label}
    </span>
  )
}
