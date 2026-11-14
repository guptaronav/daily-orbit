/**
 * A small hand-drawn icon set. Inline SVG rather than an icon package: no new dependency,
 * nothing to fetch at runtime, and every glyph inherits currentColor and the 1.5px hairline
 * weight the rest of the console uses.
 */
export type IconName =
  | 'head'
  | 'eye'
  | 'heart'
  | 'bone'
  | 'body'
  | 'gut'
  | 'send'
  | 'download'
  | 'check'
  | 'alert'
  | 'clock'
  | 'arrowRight'
  | 'sun'
  | 'moon'
  | 'spark'
  | 'shield'
  | 'target'
  | 'plus'
  | 'globe'
  | 'flame'
  | 'coin'
  | 'chevronDown'

const PATHS: Record<IconName, string> = {
  head: 'M12 3a6 6 0 0 0-6 6c0 2 .7 2.9.7 4.3 0 .8-.7 1.2-.7 1.9 0 .6.6.8.6.8s-.3.4-.3.9.5.8.5.8-.2.4-.2.8c0 .9.8 1.5 2 1.5h2.4V18c0-1.4 1-2 1-3.3M15 9.2a2 2 0 1 1 2.6 1.9c-.5.2-.6.5-.6 1',
  eye: 'M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Z M12 9.2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6Z',
  heart: 'M12 20s-7.5-4.6-7.5-9.4A4.1 4.1 0 0 1 12 8.2a4.1 4.1 0 0 1 7.5 2.4C19.5 15.4 12 20 12 20Z',
  bone: 'M7 17 17 7 M7.5 4.5a2.5 2.5 0 1 0-2 4 2.5 2.5 0 1 0 4 2 M16.5 19.5a2.5 2.5 0 1 0 2-4 2.5 2.5 0 1 0-4-2',
  body: 'M12 2.6a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z M12 7.4c-2.4 0-4 1.2-4 3v4.2M12 7.4c2.4 0 4 1.2 4 3v4.2M9.4 13.8 8.6 21M14.6 13.8l.8 7.2M8 10.4 5.2 15M16 10.4 18.8 15',
  gut: 'M8 5v4.5c0 2 2.5 2 2.5 4S8 15.5 8 17.5V21M16 5v3c0 2-2.5 2-2.5 4s2.5 2.2 2.5 4.2V21',
  send: 'M3.6 11.4 20.4 4l-7.4 16.8-2-7-7.4-2.4Z',
  download: 'M12 3.8v10.4M7.8 10l4.2 4.2 4.2-4.2M4.5 19.2h15',
  check: 'M4.8 12.6 9.6 17.4 19.2 6.6',
  alert: 'M12 4.2 2.6 20.4h18.8L12 4.2Z M12 10v4.4 M12 17.2v.1',
  clock: 'M12 3.4a8.6 8.6 0 1 0 0 17.2 8.6 8.6 0 0 0 0-17.2Z M12 7.4V12l3 2',
  arrowRight: 'M4.5 12h15M13.5 6l6 6-6 6',
  sun: 'M12 7.6a4.4 4.4 0 1 0 0 8.8 4.4 4.4 0 0 0 0-8.8Z M12 2.4v2.2M12 19.4v2.2M2.4 12h2.2M19.4 12h2.2M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6',
  moon: 'M20 14.4A8.6 8.6 0 0 1 9.6 4 8.6 8.6 0 1 0 20 14.4Z',
  spark: 'M12 3.2 13.9 9l5.8 1.9-5.8 1.9L12 18.6 10.1 12.8 4.3 10.9 10.1 9 12 3.2Z',
  shield: 'M12 3.2 4.8 6v5.4c0 4.2 3 7.4 7.2 9 4.2-1.6 7.2-4.8 7.2-9V6L12 3.2Z',
  target: 'M12 3.4a8.6 8.6 0 1 0 0 17.2 8.6 8.6 0 0 0 0-17.2Z M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Z',
  plus: 'M12 5v14M5 12h14',
  globe: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z M3 12h18 M12 3a14 14 0 0 1 0 18 M12 3a14 14 0 0 0 0 18',
  flame: 'M12 2.6c.6 3.1-1.3 4.5-2.7 5.9C7.6 10.1 6 11.7 6 14.3a6 6 0 0 0 12 .6c0-2.3-1-3.8-2.2-5.2-.5.8-1.2 1.3-2 1.5.8-2.4.2-5.4-1.8-8.6Z',
  coin: 'M12 3.4a8.6 8.6 0 1 0 0 17.2 8.6 8.6 0 0 0 0-17.2Z M12 7.6v8.8 M9.4 9.6h3.8a1.9 1.9 0 0 1 0 3.8H9.4',
  chevronDown: 'M6 9l6 6 6-6',
}

type Props = {
  name: IconName
  /** Pixel size of the square box. */
  size?: number
  className?: string
  /** Give a label only when the icon is the sole carrier of meaning. */
  label?: string
}

export function Icon({ name, size = 16, className = '', label }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
