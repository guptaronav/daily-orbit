import type { Key } from 'react'
import { CartesianGrid, Line, LineChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Measurement, Status } from '../contract/types'
import type { Baseline } from '../lib/baseline'
import { STATUS_COLOR } from './StatusDot'

type DotProps = { cx?: number; cy?: number; index?: number; key?: Key | null }

const day = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

type Row = { day: string; value: number | null }

type Props = {
  history: Measurement[]
  baseline: Baseline | null
  unit: string
  /** Status of the latest reading; colors the final marker only. */
  status?: Status
  height?: number
}

/** Flight-manual tooltip: paper, hairline border, no shadow, no rounded corners. */
function TipBox({ active, payload, label, unit }: { active?: boolean; payload?: { value?: number | null }[]; label?: string; unit: string }) {
  const value = payload?.[0]?.value
  if (!active || value == null) return null
  return (
    <div className="border border-ink bg-panel px-3 py-2 text-sm">
      <div className="label" style={{ letterSpacing: '0.1em' }}>
        {label}
      </div>
      <div className="mt-0.5 text-base font-semibold">
        {value} <span className="font-normal text-muted">{unit}</span>
      </div>
    </div>
  )
}

/**
 * One indicator over time. The shaded band is this person's own baseline (mean ± 1 SD) and the
 * dotted lines are ± 2 SD, so "drifting out of my own normal" is visible without reading numbers.
 * Readings that failed quality break the line instead of being joined across: we never draw a
 * segment through data we did not trust. Straight segments only, no smoothing.
 */
export function TrendChart({ history, baseline, unit, status = 'gray', height = 280 }: Props) {
  // Only the latest reading gets a marker, colored by its status; the rest of the line stays bare.
  const renderDot = (props: DotProps) =>
    props.index === lastIndex && props.cx != null && props.cy != null ? (
      <circle key={props.key ?? 'last'} cx={props.cx} cy={props.cy} r={5} fill={STATUS_COLOR[status]} stroke="var(--color-ink)" strokeWidth={1.25} />
    ) : (
      <g key={props.key ?? `d${props.index}`} />
    )

  const data: Row[] = history.map((m) => ({
    day: day(m.timestamp),
    value: m.quality.passed && typeof m.value === 'number' ? m.value : null,
  }))
  const shown = data.filter((d) => d.value !== null).length
  const gaps = data.length - shown
  if (shown < 2) return <p className="text-sm text-muted">Not enough readings to chart yet.</p>

  const lastIndex = data.reduce((last, d, i) => (d.value !== null ? i : last), -1)

  return (
    <figure className="m-0">
      <div role="img" aria-label={`Trend chart: ${shown} readings in ${unit}, oldest first.`} className="w-full" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="var(--color-rule)" strokeDasharray="1 5" vertical={false} />
            {baseline && (
              <ReferenceArea
                y1={baseline.mean - baseline.sd}
                y2={baseline.mean + baseline.sd}
                fill="var(--color-accent)"
                fillOpacity={0.08}
                stroke="none"
              />
            )}
            {baseline && <ReferenceLine y={baseline.mean} stroke="var(--color-accent)" strokeWidth={1} strokeDasharray="5 4" />}
            {baseline && <ReferenceLine y={baseline.mean + 2 * baseline.sd} stroke="var(--color-rule-strong)" strokeDasharray="2 4" />}
            {baseline && <ReferenceLine y={baseline.mean - 2 * baseline.sd} stroke="var(--color-rule-strong)" strokeDasharray="2 4" />}
            <XAxis
              dataKey="day"
              tick={{ fontSize: 12, fill: 'var(--color-muted)' }}
              tickLine={false}
              stroke="var(--color-rule-strong)"
              interval="preserveStartEnd"
              minTickGap={28}
            />
            <YAxis
              tick={{ fontSize: 12, fill: 'var(--color-muted)' }}
              tickLine={false}
              axisLine={false}
              width={52}
              domain={['auto', 'auto']}
            />
            <Tooltip content={<TipBox unit={unit} />} cursor={{ stroke: 'var(--color-rule-strong)', strokeDasharray: '2 3' }} />
            <Line
              type="linear"
              dataKey="value"
              stroke="var(--color-ink)"
              strokeWidth={2.25}
              connectNulls={false}
              isAnimationActive={false}
              dot={renderDot}
              activeDot={{ r: 4, fill: 'var(--color-ink)', stroke: 'var(--color-paper)', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted">
        <span>{unit}</span>
        {baseline && (
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className="inline-block h-2.5 w-4" style={{ background: 'var(--color-accent)', opacity: 0.16 }} />
            your baseline ± 1 SD
          </span>
        )}
        {baseline && <span>dotted: ± 2 SD</span>}
        {gaps > 0 && <span>{gaps} reading(s) not charted: quality check failed</span>}
      </figcaption>
    </figure>
  )
}
