import { Suspense, lazy } from 'react'
import { getThreshold } from '../config/thresholds'
import type { IndicatorReading } from '../lib/bodyStatus'
import { getContent, isTodo } from '../lib/content'
import { formatValue } from '../lib/format'
import { Icon } from './kit/Icon'
import { Panel } from './kit/Panel'
import { Sigma } from './kit/Readout'
import { StatusDot } from './StatusDot'
const TrendChart = lazy(() => import('./TrendChart').then((m) => ({ default: m.TrendChart })))

/** Reserves the chart's exact height while its code loads, so opening a card never makes the page jump. */
const CHART_HEIGHT = 280

const QUESTIONS = [
  ['canMeasureInSpace', 'Can it be measured in space?'],
  ['whyCheck', 'Why check it?'],
  ['hazardEffect', 'How do spaceflight hazards affect it?'],
  ['whenToEscalate', 'When does it need crew or flight-surgeon attention?'],
  ['prevention', 'What prevents a critical condition?'],
] as const

function Text({ value }: { value: string }) {
  return <span className={isTodo(value) ? 'italic text-muted' : ''}>{value}</span>
}

/** Splits "62 bpm" into hero number and quiet unit so the number can carry the card. */
function HeroValue({ text }: { text: string }) {
  const match = /^(-?[\d.]+(?:\s*\/\s*10)?)\s*(.*)$/.exec(text)
  if (!match) return <span className="value">{text}</span>
  return (
    <span className="value">
      {match[1]}
      {match[2] && <span className="value-unit"> {match[2]}</span>}
    </span>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="label">{label}</dt>
      <dd className="mono mt-1 text-sm">{children}</dd>
    </div>
  )
}

export function IndicatorCard({ reading }: { reading: IndicatorReading }) {
  const content = getContent(reading.indicator)
  const threshold = getThreshold(reading.indicator)
  const { latest, baseline } = reading

  const z =
    baseline && latest && typeof latest.value === 'number' ? (latest.value - baseline.mean) / baseline.sd : null

  return (
    <Panel
      label={content.label}
      aside={<StatusDot status={reading.status} size="md" />}
      ariaLabelledby={`card-${content.id}`}
      as="article"
      className="h-full"
    >
      <h3 id={`card-${content.id}`} className="sr-only">
        {content.label}
      </h3>

      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-rule p-5">
        <div>
          <p className="flex items-baseline gap-3">
            {latest ? <HeroValue text={formatValue(latest)} /> : <span className="value text-nodata-ink">—</span>}
            {z !== null && <Sigma z={z} status={reading.status} />}
          </p>
          {!latest && <p className="mt-1.5 text-sm text-muted">No reading has passed the quality check yet.</p>}
        </div>
        <div className="text-right">
          {baseline ? (
            <p className="mono text-sm text-muted">
              baseline {baseline.mean.toFixed(1)} ± {baseline.sd.toFixed(1)} {content.unit}
              <br />
              <span className="text-sm">n={baseline.n} prior readings</span>
            </p>
          ) : (
            latest &&
            typeof latest.value === 'number' && <p className="mono text-sm text-muted">no baseline yet (needs 5 readings)</p>
          )}
        </div>
      </div>

      {latest && (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-b border-rule p-5 sm:grid-cols-4">
          <Field label="Quality">
            <span style={{ color: latest.quality.passed ? undefined : 'var(--color-nodata-ink)' }}>
              {Math.round(latest.quality.score * 100)}%
            </span>
          </Field>
          <Field label="Source">{latest.source}</Field>
          <Field label="Taken">{new Date(latest.timestamp).toLocaleDateString()}</Field>
          <Field label="Clinical threshold">{threshold.value === null ? 'not set' : `${threshold.value} ${threshold.unit}`}</Field>
        </dl>
      )}

      {reading.failedCount > 0 && (
        <p className="mono flex items-start gap-2 border-b border-rule px-5 py-3 text-sm text-muted">
          <Icon name="alert" size={14} className="mt-px" />
          {reading.failedCount} reading(s) failed the quality check: excluded from the status and from the baseline.
        </p>
      )}

      <div className="p-5">
        <Suspense
          fallback={
            <div role="status" aria-busy="true" style={{ height: CHART_HEIGHT }} className="mono grid place-items-center border border-rule text-sm text-muted">
              Loading chart…
            </div>
          }
        >
          <TrendChart history={reading.history} baseline={reading.baseline} unit={content.unit} status={reading.status} height={CHART_HEIGHT} />
        </Suspense>
      </div>

      <dl className="grid gap-x-8 gap-y-4 border-t border-rule p-5 text-sm sm:grid-cols-2">
        {QUESTIONS.map(([key, question]) => (
          <div key={key}>
            <dt className="font-medium">{question}</dt>
            <dd className="mt-1 leading-relaxed text-ink-soft">
              <Text value={content[key]} />
            </dd>
          </div>
        ))}
      </dl>

      <div className="mx-5 mb-5 border-l-2 border-accent bg-accent-wash px-4 py-3 text-sm">
        <p className="label">Recommended action</p>
        <p className="mt-1.5">
          <Text value={content.recommendedAction} />
        </p>
      </div>

      <p className="mono border-t border-rule px-5 py-3 text-sm text-muted">
        NASA standard measures: {content.standardMeasure} &middot; HRP risk: <Text value={content.hrpRisk} />
      </p>
    </Panel>
  )
}
