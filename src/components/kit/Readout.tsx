import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { Status } from '../../contract/types'
import { STATUS_COLOR, STATUS_TEXT } from '../StatusDot'

const MQ = '(prefers-reduced-motion: reduce)'

const subscribe = (cb: () => void) => {
  if (typeof matchMedia !== 'function') return () => {}
  const m = matchMedia(MQ)
  m.addEventListener('change', cb)
  return () => m.removeEventListener('change', cb)
}

/** Subscribed, not sampled: switching the OS setting updates the page without a reload. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => (typeof matchMedia === 'function' ? matchMedia(MQ).matches : true),
    () => true,
  )
}

function Animated({ value, decimals, durationMs }: { value: number; decimals: number; durationMs: number }) {
  const [shown, setShown] = useState(0)
  const from = useRef(0)
  const frame = useRef(0)

  useEffect(() => {
    const start = performance.now()
    const begin = from.current
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / durationMs)
      setShown(begin + (value - begin) * (1 - (1 - p) ** 3))
      if (p < 1) frame.current = requestAnimationFrame(step)
      else from.current = value
    }
    frame.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame.current)
  }, [value, durationMs])

  return <>{shown.toFixed(decimals)}</>
}

/**
 * A number that counts up to its value once, then tracks it exactly.
 *
 * Under prefers-reduced-motion it simply prints the value: the animation is decoration, and a
 * readout that lies for 700 ms is worse than one that never moved.
 */
export function Counter({ value, decimals = 0, durationMs = 700 }: { value: number; decimals?: number; durationMs?: number }) {
  const reduce = useReducedMotion()
  if (reduce) return <>{value.toFixed(decimals)}</>
  return <Animated value={value} decimals={decimals} durationMs={durationMs} />
}

type GaugeProps = {
  /** 0 to 1. Values outside are clamped. */
  value: number
  label: string
  /** Printed in the middle. Defaults to the percentage. */
  caption?: string
  status?: Status
  size?: number
}

const TAU = Math.PI * 2

/** Radial arc gauge, 270 degrees, drawn as a stroked circle so it animates on stroke-dashoffset. */
export function Gauge({ value, label, caption, status = 'green', size = 160 }: GaugeProps) {
  const v = Math.min(1, Math.max(0, value))
  const r = size / 2 - 14
  const circumference = TAU * r
  const arc = 0.75 // 270 degrees
  const track = circumference * arc

  return (
    <figure className="m-0 flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden focusable="false">
          <g transform={`rotate(135 ${size / 2} ${size / 2})`}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke="var(--color-rule)"
              strokeWidth={9}
              strokeLinecap="butt"
              strokeDasharray={`${track} ${circumference}`}
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={STATUS_COLOR[status]}
              strokeWidth={9}
              strokeLinecap="butt"
              strokeDasharray={`${track * v} ${circumference}`}
              style={{ transition: 'stroke-dasharray 800ms cubic-bezier(0.22, 1, 0.36, 1)' }}
            />
          </g>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="value" style={{ fontSize: size * 0.24 }}>
            <Counter value={Math.round(v * 100)} />
            <span className="value-unit">%</span>
          </span>
          {caption && <span className="label mt-1">{caption}</span>}
        </div>
      </div>
      <figcaption className="label mt-1">{label}</figcaption>
    </figure>
  )
}

/**
 * Tiny inline trend. Flat-line safe (a constant series draws through the middle rather than
 * dividing by a zero range) and skips readings that failed quality, like the full chart does.
 */
export function Sparkline({
  values,
  status = 'green',
  width = 108,
  height = 30,
}: {
  values: readonly number[]
  status?: Status
  width?: number
  height?: number
}) {
  if (values.length < 2) return <div style={{ width, height }} aria-hidden />
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  const span = hi - lo || 1
  const pad = 3
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * (width - pad * 2) + pad
    const y = height - pad - ((v - lo) / span) * (height - pad * 2)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  const last = points[points.length - 1].split(',')

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden focusable="false" className="overflow-visible">
      <polyline points={points.join(' ')} fill="none" stroke="var(--color-rule-strong)" strokeWidth={1.5} strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r={2.6} fill={STATUS_COLOR[status]} />
    </svg>
  )
}

/** Horizontal bar with a mono caption. Used for comparisons, not for status. */
export function Bar({ value, max, label, caption, status }: { value: number; max: number; label: string; caption?: string; status?: Status }) {
  const pct = max <= 0 ? 0 : Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="label">{label}</span>
        {caption && <span className="mono text-sm text-muted">{caption}</span>}
      </div>
      <div className="meter mt-1.5">
        <span style={{ width: `${pct}%`, background: status ? STATUS_COLOR[status] : undefined }} />
      </div>
    </div>
  )
}

/** Signed deviation in standard deviations: the console way to say "how far outside normal". */
export function Sigma({ z, status }: { z: number | null; status: Status }) {
  if (z === null) return <span className="mono text-sm text-muted">no baseline</span>
  const sign = z > 0 ? '+' : ''
  return (
    <span className="mono text-sm font-semibold" style={{ color: STATUS_TEXT[status] }}>
      {sign}
      {z.toFixed(1)}σ
    </span>
  )
}
