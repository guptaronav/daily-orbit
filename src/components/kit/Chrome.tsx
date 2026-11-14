import { useMemo } from 'react'
import { mulberry32 } from '../../lib/sim/rng'
import { Icon } from './Icon'
import { useTheme } from './theme'

/**
 * Deterministic starfield, drawn once from the seeded PRNG the simulations already use, so it
 * never reflows between renders and never differs between two people looking at the same demo.
 * Hidden entirely on the paper theme (--star-opacity: 0) and invisible to screen readers.
 */
export function Starfield({ seed = 7, count = 90, className = '' }: { seed?: number; count?: number; className?: string }) {
  const stars = useMemo(() => {
    const rand = mulberry32(seed)
    return Array.from({ length: count }, () => ({
      x: rand() * 100,
      y: rand() * 100,
      r: 0.4 + rand() * 1.1,
      o: 0.25 + rand() * 0.6,
    }))
  }, [seed, count])

  return (
    <svg
      aria-hidden
      focusable="false"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      style={{ opacity: 'var(--star-opacity)' }}
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
    >
      {stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r / 8} fill="var(--color-ink)" opacity={s.o} />
      ))}
    </svg>
  )
}

/** Switches between the flight-deck and paper themes. The label always says what you will get. */
export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggle } = useTheme()
  const next = theme === 'deck' ? 'paper' : 'flight deck'
  return (
    <button
      type="button"
      onClick={toggle}
      className={`btn btn-secondary ${compact ? 'btn-icon' : ''}`}
      aria-label={`Switch to the ${next} theme`}
      title={`Switch to the ${next} theme`}
    >
      <Icon name={theme === 'deck' ? 'sun' : 'moon'} size={16} />
      {!compact && <span>{next}</span>}
    </button>
  )
}

type SegmentedProps<T extends string> = {
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
  label: string
}

/** Segmented control: a row of mutually exclusive choices, one tab stop per option. */
export function Segmented<T extends string>({ options, value, onChange, label }: SegmentedProps<T>) {
  return (
    <div role="group" aria-label={label} className="inline-flex border border-rule-strong">
      {options.map((o, i) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={o.value === value}
          className={`label min-h-[40px] px-3 transition-colors ${i > 0 ? 'border-l border-rule-strong' : ''} ${
            o.value === value ? 'bg-accent text-paper-deep' : 'hover:text-ink'
          }`}
          style={o.value === value ? { color: 'var(--color-paper-deep)' } : undefined}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** The scrolling status rail that runs along the bottom of a console screen. */
export function StatusRail({ items }: { items: (string | null | undefined)[] }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-5 gap-y-1">
      {items.filter(Boolean).map((text, i) => (
        <li key={i} className="ticker flex items-center gap-2">
          {i === 0 && <span className="animate-blip inline-block h-1.5 w-1.5 rounded-full" style={{ background: 'var(--color-ok)' }} />}
          {text}
        </li>
      ))}
    </ul>
  )
}
