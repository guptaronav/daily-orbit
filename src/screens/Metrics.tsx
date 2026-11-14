import { useMemo, useState } from 'react'
import { Stepper } from '../components/kit/Controls'
import { Counter } from '../components/kit/Readout'
import {
  asPercent,
  crewMinutesPerDay,
  REPORTING_DEFAULTS,
  reportingCompleteness,
  TIME_DEFAULTS,
  type ReportingAssumptions,
  type TimeAssumptions,
} from '../lib/sim/metrics'

type Field<T> = { key: keyof T & string; label: string; unit: string; step: number; min: number; max: number }

const TIME_FIELDS: Field<TimeAssumptions>[] = [
  { key: 'mirrorCheckMin', label: 'One mirror check', unit: 'min', step: 0.5, min: 0, max: 30 },
  { key: 'perIndicatorMin', label: 'Logging one indicator by hand', unit: 'min', step: 0.5, min: 0, max: 10 },
  { key: 'indicatorCount', label: 'Indicators the check covers', unit: '', step: 1, min: 0, max: 20 },
  { key: 'setupMin', label: 'Setup for a separate session', unit: 'min', step: 0.5, min: 0, max: 15 },
  { key: 'crewSize', label: 'Crew size', unit: 'people', step: 1, min: 1, max: 12 },
  { key: 'missionDays', label: 'Mission length', unit: 'days', step: 10, min: 1, max: 1200 },
]

const REPORTING_FIELDS: Field<ReportingAssumptions>[] = [
  { key: 'days', label: 'Window', unit: 'days', step: 1, min: 0, max: 365 },
  { key: 'crewSize', label: 'Crew size', unit: 'people', step: 1, min: 0, max: 12 },
  { key: 'complianceProb', label: 'Chance of doing the check', unit: '', step: 0.05, min: 0, max: 1 },
  { key: 'badDayProb', label: 'Chance a day is worth reporting', unit: '', step: 0.05, min: 0, max: 1 },
  { key: 'underReportProb', label: 'Chance of hiding a bad day', unit: '', step: 0.05, min: 0, max: 1 },
  { key: 'seed', label: 'Random seed', unit: '', step: 1, min: 0, max: 9999 },
]

const SimBadge = () => (
  <span className="pill" style={{ background: 'var(--color-watch-wash)', color: 'var(--color-watch-ink)' }}>
    Simulation
  </span>
)

function Assumptions<T extends Record<string, number>>({
  fields,
  values,
  onChange,
  onReset,
}: {
  fields: Field<T>[]
  values: T
  onChange: (next: T) => void
  onReset: () => void
}) {
  return (
    <div className="border-t border-rule p-6">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-lg font-bold tracking-tight">Assumptions &mdash; change them</h3>
        <button className="btn-quiet" onClick={onReset}>
          Reset
        </button>
      </div>

      <div className="mt-4 grid gap-x-8 gap-y-5 lg:grid-cols-2">
        {fields.map((f) => (
          <label key={f.key} className="block">
            <span className="flex items-baseline justify-between gap-3">
              <span className="font-semibold">
                {f.label} {f.unit && <span className="font-normal text-muted">({f.unit})</span>}
              </span>
            </span>
            <div className="mt-2">
              <Stepper
                name={f.key}
                value={String(values[f.key])}
                onChange={(next) => {
                  const n = Number(next)
                  if (next.trim() !== '' && Number.isFinite(n)) onChange({ ...values, [f.key]: n })
                }}
                step={f.step}
                min={f.min}
                max={f.max}
                unitLabel={f.label.toLowerCase()}
              />
            </div>
          </label>
        ))}
      </div>
    </div>
  )
}

/** A labelled comparison bar. Width is relative to the larger of the two numbers being compared. */
function CompareBar({ label, value, max, unit, strong = false }: { label: string; value: number; max: number; unit: string; strong?: boolean }) {
  const pct = max <= 0 ? 0 : Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-semibold">{label}</span>
        <span className="value" style={{ fontSize: '1.75rem' }}>
          <Counter value={value} decimals={value % 1 === 0 ? 0 : 1} />
          <span className="value-unit"> {unit}</span>
        </span>
      </div>
      <div className="meter mt-2" style={{ height: 12 }}>
        <span style={{ width: `${pct}%`, background: strong ? 'var(--color-ink)' : 'var(--color-rule-strong)' }} />
      </div>
    </div>
  )
}

export function Metrics() {
  const [time, setTime] = useState<TimeAssumptions>(TIME_DEFAULTS)
  const [reporting, setReporting] = useState<ReportingAssumptions>(REPORTING_DEFAULTS)

  const t = useMemo(() => crewMinutesPerDay(time), [time])
  const r = useMemo(() => reportingCompleteness(reporting), [reporting])
  const timeMax = Math.max(t.mirrorMinPerCrewDay, t.manualMinPerCrewDay, 1)

  return (
    <main className="mx-auto w-full max-w-[1440px] px-4 pb-10 pt-8 sm:px-8">
      <SimBadge />
      <h1 className="display mt-3 text-4xl sm:text-5xl">Two numbers we cannot measure yet, modelled openly</h1>
      <p className="mt-4 max-w-3xl text-lg leading-relaxed text-ink-soft">
        Neither figure below is an observation. Both come from simple models whose every input is on this page and editable, so you can see
        exactly which assumption is doing the work. Nothing here comes from NASA data, and nothing here is a claim about real crews.
      </p>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section aria-labelledby="time-heading" className="card">
          <div className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="label">Crew minutes per day</p>
              <SimBadge />
            </div>
            <h2 id="time-heading" className="mt-2 text-2xl font-bold tracking-tight">
              One check against logging everything separately
            </h2>
            <p className="mt-2 leading-relaxed text-muted">
              Linear on purpose: a more elaborate model would only bury the assumptions it rests on.
            </p>

            <div className="mt-6 space-y-5">
              <CompareBar label="Separate logging" value={t.manualMinPerCrewDay} max={timeMax} unit="min/day" />
              <CompareBar label="One mirror check" value={t.mirrorMinPerCrewDay} max={timeMax} unit="min/day" strong />
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-5 border-t border-rule pt-5">
              <div>
                <dt className="label">Difference</dt>
                <dd className="value mt-1" style={{ fontSize: '2rem' }}>
                  <Counter value={t.savedMinPerCrewDay} decimals={1} />
                  <span className="value-unit"> min/day</span>
                </dd>
              </div>
              <div>
                <dt className="label">Over the mission</dt>
                <dd className="value mt-1" style={{ fontSize: '2rem' }}>
                  <Counter value={t.savedHoursPerMission} decimals={1} />
                  <span className="value-unit"> crew hours</span>
                </dd>
                <p className="mt-1 text-sm text-muted">
                  {time.crewSize} crew &times; {time.missionDays} days · {t.savedHoursPerMission >= 0 ? 'given back' : 'spent extra'}
                </p>
              </div>
            </dl>
          </div>

          <Assumptions fields={TIME_FIELDS} values={time} onChange={setTime} onReset={() => setTime(TIME_DEFAULTS)} />
        </section>

        <section aria-labelledby="reporting-heading" className="card">
          <div className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="label">Reporting completeness</p>
              <SimBadge />
            </div>
            <h2 id="reporting-heading" className="mt-2 text-2xl font-bold tracking-tight">
              Rewarding effort against rewarding healthy values
            </h2>
            <p className="mt-2 leading-relaxed text-muted">
              What share of person-days gets reported under each scoring scheme over the window.
            </p>

            <div className="mt-6 space-y-5">
              <CompareBar label="Reward effort" value={asPercent(r.effort)} max={100} unit="%" strong />
              <CompareBar label="Reward values" value={asPercent(r.value)} max={100} unit="%" />
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-5 border-t border-rule pt-5">
              <div>
                <dt className="label">Bad days hidden</dt>
                <dd className="value mt-1" style={{ fontSize: '2rem', color: r.hiddenBadDays > 0 ? 'var(--color-watch-ink)' : undefined }}>
                  <Counter value={r.hiddenBadDays} />
                  <span className="value-unit"> of {r.opportunities}</span>
                </dd>
              </div>
              <div>
                <dt className="label">Person-days modelled</dt>
                <dd className="value mt-1" style={{ fontSize: '2rem' }}>
                  <Counter value={r.opportunities} />
                </dd>
              </div>
            </dl>

            <div className="mt-6 rounded-2xl p-4" style={{ background: 'var(--color-accent-wash)' }}>
              <p className="font-bold">The model, in one sentence</p>
              <p className="mt-1.5 leading-relaxed">
                On each person-day someone either does the check or does not; if they do, and it is a bad day, and the score rewards healthy
                values, they may skip reporting it. Rewarding effort removes that last step, so it can only ever report more, never less.
              </p>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
                Both schemes are run from the same random draws, so with a hiding chance of zero the two are identical rather than merely
                close. Deterministic for a given seed. The claim that people under-report when bad values are punished is an assumption we
                made, not a result we found.
              </p>
            </div>
          </div>

          <Assumptions fields={REPORTING_FIELDS} values={reporting} onChange={setReporting} onReset={() => setReporting(REPORTING_DEFAULTS)} />
        </section>
      </div>

      <p className="mt-8 max-w-3xl leading-relaxed text-muted">
        The same assumptions are written down in NOTES.md so they end up on the limitations slide rather than being quietly forgotten.
      </p>
    </main>
  )
}
