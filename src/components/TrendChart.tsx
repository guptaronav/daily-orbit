import { CartesianGrid, Line, LineChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Baseline } from '../lib/baseline'
import type { Measurement } from '../contract/types'

const day = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

/** Passed numeric readings only; the shaded band is the crew member's own baseline (mean ± 1 SD). */
export function TrendChart({ history, baseline, unit }: { history: Measurement[]; baseline: Baseline | null; unit: string }) {
  const data = history.flatMap((m) => (m.quality.passed && typeof m.value === 'number' ? [{ day: day(m.timestamp), value: m.value }] : []))
  if (data.length < 2) return <p className="text-sm text-muted">Not enough readings to chart yet.</p>

  return (
    <div role="img" aria-label={`Trend chart, ${data.length} readings in ${unit}`} className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="var(--color-rule)" strokeDasharray="2 4" vertical={false} />
          <XAxis dataKey="day" tick={{ fontSize: 11 }} interval="preserveStartEnd" minTickGap={32} />
          <YAxis tick={{ fontSize: 11 }} width={36} domain={['auto', 'auto']} />
          {baseline && <ReferenceArea y1={baseline.mean - baseline.sd} y2={baseline.mean + baseline.sd} fill="var(--color-accent)" fillOpacity={0.1} />}
          {baseline && <ReferenceLine y={baseline.mean} stroke="var(--color-accent)" strokeDasharray="4 3" />}
          <Tooltip formatter={(v) => [`${v} ${unit}`, 'Value']} />
          <Line type="linear" dataKey="value" stroke="var(--color-ink)" strokeWidth={1.75} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
