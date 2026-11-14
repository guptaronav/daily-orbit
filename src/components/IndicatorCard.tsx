import { getThreshold } from '../config/thresholds'
import type { IndicatorReading } from '../lib/bodyStatus'
import { getContent, isTodo } from '../lib/content'
import { formatValue } from '../lib/format'
import { STATUS_TEXT, StatusDot } from './StatusDot'
import { TrendChart } from './TrendChart'

const QUESTIONS = [
  ['canMeasureInSpace', 'Can it be measured in space?'],
  ['whyCheck', 'Why check it?'],
  ['hazardEffect', 'How do spaceflight hazards affect it?'],
  ['whenToEscalate', 'When does it need crew or flight-surgeon attention?'],
  ['prevention', 'What prevents a critical condition?'],
] as const

function Text({ value }: { value: string }) {
  return <span className={isTodo(value) ? 'text-muted italic' : ''}>{value}</span>
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

export function IndicatorCard({ reading }: { reading: IndicatorReading }) {
  const content = getContent(reading.indicator)
  const threshold = getThreshold(reading.indicator)
  const { latest } = reading

  return (
    <article className="card p-5 sm:p-6" aria-labelledby={`card-${content.id}`}>
      {/* The number is the hero; the label sits above it as a quiet caption. */}
      <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 border-b border-rule pb-4">
        <div className="min-w-0">
          <h3 id={`card-${content.id}`} className="label">
            {content.label}
          </h3>
          <p className="mt-1.5">
            {latest ? <HeroValue text={formatValue(latest)} /> : <span className="value text-nodata-ink">—</span>}
          </p>
          {!latest && <p className="mt-1 text-sm text-muted">No reading has passed the quality check yet.</p>}
        </div>
        <div className="shrink-0 text-right">
          <StatusDot status={reading.status} size="md" />
          {reading.baseline && (
            <p className="mt-1.5 text-xs text-muted">
              baseline {reading.baseline.mean.toFixed(1)} ± {reading.baseline.sd.toFixed(1)} {content.unit} (n={reading.baseline.n})
            </p>
          )}
          {!reading.baseline && latest && typeof latest.value === 'number' && (
            <p className="mt-1.5 text-xs text-muted">no baseline yet (needs 5 readings)</p>
          )}
        </div>
      </header>

      {latest && (
        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
          <div>
            <dt className="label">Quality</dt>
            <dd className="mt-0.5" style={{ color: latest.quality.passed ? undefined : STATUS_TEXT.gray }}>
              {Math.round(latest.quality.score * 100)}%
            </dd>
          </div>
          <div>
            <dt className="label">Source</dt>
            <dd className="mt-0.5">{latest.source}</dd>
          </div>
          <div>
            <dt className="label">Taken</dt>
            <dd className="mt-0.5">{new Date(latest.timestamp).toLocaleDateString()}</dd>
          </div>
          <div>
            <dt className="label">Clinical threshold</dt>
            <dd className="mt-0.5">{threshold.value === null ? 'not set' : `${threshold.value} ${threshold.unit}`}</dd>
          </div>
        </dl>
      )}

      {reading.failedCount > 0 && (
        <p className="mt-3 border-l-2 border-nodata pl-3 text-xs text-muted">
          {reading.failedCount} reading(s) failed the quality check and are excluded from the status and the baseline.
        </p>
      )}

      <div className="mt-5">
        <TrendChart history={reading.history} baseline={reading.baseline} unit={content.unit} status={reading.status} />
      </div>

      <dl className="mt-6 grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
        {QUESTIONS.map(([key, question]) => (
          <div key={key}>
            <dt className="font-medium">{question}</dt>
            <dd className="mt-1 text-ink-soft">
              <Text value={content[key]} />
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-6 border-l-[3px] border-accent bg-accent-wash px-3 py-2.5 text-sm">
        <span className="label">Recommended action</span>
        <br />
        <Text value={content.recommendedAction} />
      </p>

      <p className="mt-4 text-xs text-muted">
        NASA Standard Measures: {content.standardMeasure} · HRP risk: <Text value={content.hrpRisk} />
      </p>
    </article>
  )
}
