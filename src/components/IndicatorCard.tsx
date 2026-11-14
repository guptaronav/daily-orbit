import { getThreshold } from '../config/thresholds'
import type { IndicatorReading } from '../lib/bodyStatus'
import { getContent, isTodo } from '../lib/content'
import { formatValue } from '../lib/format'
import { StatusDot } from './StatusDot'
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

export function IndicatorCard({ reading }: { reading: IndicatorReading }) {
  const content = getContent(reading.indicator)
  const threshold = getThreshold(reading.indicator)
  const { latest } = reading

  return (
    <article className="border border-rule bg-panel p-5" aria-labelledby={`card-${content.id}`}>
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 id={`card-${content.id}`} className="text-lg font-semibold tracking-tight">
          {content.label}
        </h3>
        <StatusDot status={reading.status} />
      </header>

      <div className="mt-3 grid gap-x-8 gap-y-1 text-sm sm:grid-cols-2">
        <p>
          <span className="text-muted">Latest </span>
          <span className="text-2xl font-semibold">{latest ? formatValue(latest) : 'No good reading'}</span>
        </p>
        {latest && (
          <p className="text-muted">
            Quality {Math.round(latest.quality.score * 100)}% · {latest.source} · {new Date(latest.timestamp).toLocaleDateString()}
          </p>
        )}
        {reading.baseline && (
          <p className="text-muted">
            Your baseline {reading.baseline.mean.toFixed(1)} ± {reading.baseline.sd.toFixed(1)} {content.unit}
          </p>
        )}
        {reading.failedCount > 0 && <p className="text-muted">{reading.failedCount} reading(s) failed quality and are excluded.</p>}
        <p className="text-muted">Clinical threshold: {threshold.value === null ? 'threshold not set' : `${threshold.value} ${threshold.unit}`}</p>
      </div>

      <div className="mt-4">
        <TrendChart history={reading.history} baseline={reading.baseline} unit={content.unit} />
      </div>

      <dl className="mt-5 space-y-3 text-sm">
        {QUESTIONS.map(([key, question]) => (
          <div key={key}>
            <dt className="font-medium">{question}</dt>
            <dd className="mt-0.5 text-ink/80">
              <Text value={content[key]} />
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-5 border-l-4 border-accent pl-3 text-sm">
        <span className="font-medium">Recommended action: </span>
        <Text value={content.recommendedAction} />
      </p>

      <p className="mt-4 text-xs text-muted">
        NASA Standard Measures: {content.standardMeasure} · HRP risk: <Text value={content.hrpRisk} />
      </p>
    </article>
  )
}
