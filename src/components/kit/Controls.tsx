import type { ReactNode } from 'react'
import { Icon } from './Icon'

/**
 * Controls built from 21st.dev community patterns (Border Beam, Glow Button, Price Range Slider,
 * stepper-style number inputs), rebuilt on our own tokens so nothing new is installed.
 */

/** The travelling light on a card border. Decorative: a solid accent border carries the real signal. */
export function BorderBeam({ active }: { active: boolean }) {
  return <span aria-hidden className={`beam ${active ? 'beam-on' : ''}`} />
}

type ButtonProps = {
  children: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  variant?: 'primary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
  disabled?: boolean
  className?: string
  'aria-label'?: string
}

const VARIANT = {
  primary: 'btn-primary btn-sheen',
  outline: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
} as const

/** Four weights: a solid primary that catches a sheen on hover, an outline, a ghost, and a danger. */
export function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled,
  className = '',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn ${VARIANT[variant]} ${size === 'sm' ? 'btn-sm' : ''} ${className}`}
      aria-label={rest['aria-label']}
    >
      {children}
    </button>
  )
}

type StepperProps = {
  value: string
  onChange: (next: string) => void
  step: number
  min: number
  max: number
  name: string
  invalid?: boolean
  describedBy?: string
  /** Shown to assistive tech on the two buttons, e.g. "systolic". */
  unitLabel: string
}

const round = (n: number, step: number): number => {
  const places = (String(step).split('.')[1] ?? '').length
  return Number(n.toFixed(places))
}

/**
 * Number field with its own increment and decrement buttons. The browser's spin buttons are
 * 12 px tall and unusable on a touchscreen; these are 44 px and visible without hovering.
 * Typing stays the primary path, so an exact value is never more than a keystroke away.
 */
export function Stepper({ value, onChange, step, min, max, name, invalid, describedBy, unitLabel }: StepperProps) {
  const current = value.trim() === '' ? null : Number(value)
  const valid = current !== null && Number.isFinite(current)

  // Stepping an empty field starts at its minimum: predictable, and never a number the app
  // made up on the person's behalf. Typing stays the primary path for an exact value.
  const nudge = (direction: 1 | -1) => {
    if (!valid) return onChange(String(min))
    onChange(String(round(Math.min(max, Math.max(min, current + direction * step)), step)))
  }

  return (
    <div className="stepper" data-invalid={invalid ? 'true' : undefined}>
      <button
        type="button"
        className="stepper-btn"
        onClick={() => nudge(-1)}
        disabled={valid && current <= min}
        aria-label={`Decrease ${unitLabel}`}
      >
        <span aria-hidden className="text-lg leading-none">
          &minus;
        </span>
      </button>
      <input
        className="stepper-input"
        type="number"
        inputMode="decimal"
        name={name}
        step={step}
        value={value}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        type="button"
        className="stepper-btn"
        onClick={() => nudge(1)}
        disabled={valid && current >= max}
        aria-label={`Increase ${unitLabel}`}
      >
        <Icon name="plus" size={16} />
      </button>
    </div>
  )
}

type SliderProps = {
  value: string
  onChange: (next: string) => void
  step: number
  min: number
  max: number
  label: string
  /** Captions under each end of the track. */
  minLabel?: string
  maxLabel?: string
}

/** Coarse companion to the stepper: drag for the rough value, type for the exact one. */
export function Slider({ value, onChange, step, min, max, label, minLabel, maxLabel }: SliderProps) {
  const n = value.trim() === '' ? min : Number(value)
  const safe = Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min
  const pct = ((safe - min) / (max - min)) * 100

  return (
    <div>
      <input
        className="range"
        type="range"
        aria-label={label}
        step={step}
        min={min}
        max={max}
        value={safe}
        style={{ ['--pct' as string]: `${pct}%` }}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="mono flex justify-between text-[0.625rem] uppercase tracking-wider text-muted">
        <span>{minLabel ?? min}</span>
        <span>{maxLabel ?? max}</span>
      </div>
    </div>
  )
}

/** Shown where a list has nothing in it yet: says what will appear here, never just "No data". */
export function EmptyState({ title, body, icon = 'spark' }: { title: string; body: string; icon?: Parameters<typeof Icon>[0]['name'] }) {
  return (
    <div className="flex flex-col items-center px-4 py-8 text-center">
      <span
        aria-hidden
        className="grid h-12 w-12 place-items-center border border-dashed text-muted"
        style={{ borderColor: 'var(--color-rule-strong)' }}
      >
        <Icon name={icon} size={20} />
      </span>
      <p className="label mt-3">{title}</p>
      <p className="mt-1.5 max-w-[22rem] text-xs leading-relaxed text-muted">{body}</p>
    </div>
  )
}
