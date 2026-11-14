import type { ReactNode } from 'react'

type PanelProps = {
  /** Mono micro-label in the panel's header rail. */
  label?: string
  /** Right-hand side of the header rail: a status pill, a count, a control. */
  aside?: ReactNode
  children: ReactNode
  className?: string
  /** Corner brackets. On by default; off for panels that sit inside another panel. */
  brackets?: boolean
  /** Entrance animation delay in ms, for staggering a row of panels. */
  delay?: number
  as?: 'section' | 'div' | 'article' | 'aside'
  /** Passed through when the panel is a labelled landmark. */
  ariaLabelledby?: string
  ariaLabel?: string
}

/**
 * The console panel: hairline border, header rail with a mono label, optional corner brackets.
 * Everything on a screen sits in one of these so the page reads as instrumentation rather than
 * as a stack of web cards.
 */
export function Panel({
  label,
  aside,
  children,
  className = '',
  brackets = true,
  delay,
  as: Tag = 'section',
  ariaLabelledby,
  ariaLabel,
}: PanelProps) {
  return (
    <Tag
      aria-labelledby={ariaLabelledby}
      aria-label={ariaLabel}
      className={`panel ${brackets ? 'bracketed' : ''} ${delay === undefined ? '' : 'animate-rise'} ${className}`}
      style={delay === undefined ? undefined : { animationDelay: `${delay}ms` }}
    >
      {(label || aside) && (
        <header className="flex min-h-[38px] flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-rule px-4 py-2">
          {label ? <span className="label">{label}</span> : <span />}
          {aside}
        </header>
      )}
      {children}
    </Tag>
  )
}
