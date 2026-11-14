import { useMemo, useState } from 'react'
import { h1, linkBtn, page } from '../components/ui'
import {
  asPercent,
  crewMinutesPerDay,
  REPORTING_DEFAULTS,
  reportingCompleteness,
  TIME_DEFAULTS,
  type ReportingAssumptions,
  type TimeAssumptions,
} from '../lib/sim/metrics'

type NumberField<T> = { key: keyof T & string; label: string; unit: string; step: number; min: number; max: number }

const TIME_FIELDS: NumberField<TimeAssumptions>[] = [
  { key: 'mirrorCheckMin', label: 'One mirror check', unit: 'min', step: 0.5, min: 0, max: 120 },
  { key: 'perIndicatorMin', label: 'Logging one indicator by hand', unit: 'min', step: 0.5, min: 0, max: 60 },
  { key: 'indicatorCount', label: 'Indicators the check covers', unit: '', step: 1, min: 0, max: 30 },
  { key: 'setupMin', label: 'Setup for a separate logging session', unit: 'min', step: 0.5, min: 0, max: 60 },
  { key: 'crewSize', label: 'Crew size', unit: 'people', step: 1, min: 1, max: 12 },
  { key: 'missionDays', label: 'Mission length', unit: 'days', step: 10, min: 1, max: 1200 },
]

const REPORTING_FIELDS: NumberField<ReportingAssumptions>[] = [
  { key: 'days', label: 'Window', unit: 'days', step: 1, min: 0, max: 365 },
  { key: 'crewSize', label: 'Crew size', unit: 'people', step: 1, min: 0, max: 12 },
  { key: 'complianceProb', label: 'Chance of doing the check on a given day', unit: '0–1', step: 0.05, min: 0, max: 1 },
  { key: 'badDayProb', label: 'Chance a day has something worth reporting', unit: '0–1', step: 0.05, min: 0, max: 1 },
  { key: 'underReportProb', label: 'Chance of hiding a bad day when values are scored', unit: '0–1', step: 0.05, min: 0, max: 1 },
  { key: 'seed', label: 'Random seed', unit: '', step: 1, min: 0, max: 9999 },
]

function Assumptions<T extends Record<string, number>>({
  fields,
  values,
  onChange,
  onReset,
}: {
  fields: NumberField<T>[]
  values: T
  onChange: (next: T) => void
  onReset: () => void
}) {
  return (
    <div className="mt-5 border-t border-rule pt-4">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="label">Assumptions &mdash; change them</h3>
        <button className={linkBtn} onClick={onReset}>
          Reset
        </button>
      </div>
      <div className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {fields.map((f) => (
          <label key={f.key} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted">
              {f.label} {f.unit && <span className="text-xs">({f.unit})</span>}
            </span>
            <input
              className="field h-10 w-24 shrink-0 py-0 text-right"
              type="number"
              step={f.step}
              min={f.min}
              max={f.max}
              value={values[f.key]}
              onChange={(e) => {
                const n = Number(e.target.value)
                if (Number.isFinite(n)) onChange({ ...values, [f.key]: n })
              }}
            />
          </label>
        ))}
      </div>
    </div>
  )
}

function Stat({ label, value, unit, strong = false }: { label: string; value: string | number; unit?: string; strong?: boolean }) {
  return (
    <div>
      <p className="label">{label}</p>
      <p className="value mt-1" style={strong ? { color: 'var(--color-accent)' } : undefined}>
        {value}
        {unit && <span className="value-unit"> {unit}</span>}
      </p>
    </div>
  )
}

const SimBadge = () => (
  <span className="label border border-rule-strong px-2 py-1" style={{ color: 'var(--color-act-ink)' }}>
    Simulation
  </span>
)

export function Metrics() {
  const [time, setTime] = useState<TimeAssumptions>(TIME_DEFAULTS)
  const [reporting, setReporting] = useState<ReportingAssumptions>(REPORTING_DEFAULTS)

  const timeResult = useMemo(() => crewMinutesPerDay(time), [time])
  const reportingResult = useMemo(() => reportingCompleteness(reporting), [reporting])

  return (
    <main className={page}>
      <p className="label">Metrics</p>
      <h1 className={`${h1} mt-1`}>Two numbers we cannot measure yet, modelled openly</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
        Neither figure below is an observation. Both come from simple models whose every input is on this page and editable, so you can see
        exactly which assumption is doing the work. Nothing here comes from NASA data, and nothing here is a claim about real crews.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="time-heading" className="card p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h2 id="time-heading" className="text-lg font-semibold tracking-tight">
              Crew minutes per day
            </h2>
            <SimBadge />
          </div>
          <p className="mt-2 text-sm text-muted">
            One mirror check against logging each indicator separately. Linear on purpose: a more elaborate model would only bury the
            assumptions.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-5 sm:grid-cols-3">
            <Stat label="Mirror check" value={timeResult.mirrorMinPerCrewDay} unit="min/day" />
            <Stat label="Separate logging" value={timeResult.manualMinPerCrewDay} unit="min/day" />
            <Stat label="Difference" value={timeResult.savedMinPerCrewDay} unit="min/day" strong />
          </div>
          <p className="mt-4 text-sm">
            Over {time.missionDays} days with {time.crewSize} crew, that is{' '}
            <span className="font-semibold">{timeResult.savedHoursPerMission} crew hours</span>{' '}
            {timeResult.savedHoursPerMission >= 0 ? 'given back' : 'spent extra'}.
          </p>

          <Assumptions fields={TIME_FIELDS} values={time} onChange={setTime} onReset={() => setTime(TIME_DEFAULTS)} />
        </section>

        <section aria-labelledby="reporting-heading" className="card p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h2 id="reporting-heading" className="text-lg font-semibold tracking-tight">
              Reporting completeness
            </h2>
            <SimBadge />
          </div>
          <p className="mt-2 text-sm text-muted">
            What share of person-days gets reported when the score rewards healthy <em>values</em>, against rewarding the <em>effort</em> of
            checking in at all.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-5 sm:grid-cols-3">
            <Stat label="Reward effort" value={asPercent(reportingResult.effort)} unit="%" strong />
            <Stat label="Reward values" value={asPercent(reportingResult.value)} unit="%" />
            <Stat label="Bad days hidden" value={reportingResult.hiddenBadDays} unit={`of ${reportingResult.opportunities}`} />
          </div>

          <div className="mt-4 border-l-[3px] border-accent bg-accent-wash px-3 py-2.5 text-sm">
            <p className="label">The model, in one sentence</p>
            <p className="mt-1">
              On each person-day someone either does the check or does not; if they do, and it is a bad day, and the score rewards healthy
              values, they may skip reporting it. Rewarding effort removes that last step, so it can only ever report more, never less.
            </p>
            <p className="mt-2 text-muted">
              Both schemes are run from the same random draws, so with a hiding chance of zero the two are identical rather than merely
              close. Deterministic for a given seed.
            </p>
          </div>

          <Assumptions
            fields={REPORTING_FIELDS}
            values={reporting}
            onChange={setReporting}
            onReset={() => setReporting(REPORTING_DEFAULTS)}
          />
        </section>
      </div>

      <p className="mt-8 max-w-2xl text-xs text-muted">
        The same assumptions are written down in NOTES.md so they end up on the limitations slide rather than being quietly forgotten.
      </p>
    </main>
  )
}
