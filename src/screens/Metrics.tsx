import { useMemo, useState } from 'react'
import { Icon } from '../components/kit/Icon'
import { Panel } from '../components/kit/Panel'
import { Counter } from '../components/kit/Readout'
import { linkBtn } from '../components/ui'
import {
  asPercent,
  crewMinutesPerDay,
  REPORTING_DEFAULTS,
  reportingCompleteness,
  TIME_DEFAULTS,
  type ReportingAssumptions,
  type TimeAssumptions,
} from '../lib/sim/metrics'

type Field<T> = { key: keyof T & string; label: string; unit: string; step: number; min: number; max: number; slider?: boolean }

const TIME_FIELDS: Field<TimeAssumptions>[] = [
  { key: 'mirrorCheckMin', label: 'One mirror check', unit: 'min', step: 0.5, min: 0, max: 30, slider: true },
  { key: 'perIndicatorMin', label: 'Logging one indicator by hand', unit: 'min', step: 0.5, min: 0, max: 10, slider: true },
  { key: 'indicatorCount', label: 'Indicators the check covers', unit: '', step: 1, min: 0, max: 20, slider: true },
  { key: 'setupMin', label: 'Setup for a separate logging session', unit: 'min', step: 0.5, min: 0, max: 15, slider: true },
  { key: 'crewSize', label: 'Crew size', unit: 'people', step: 1, min: 1, max: 12 },
  { key: 'missionDays', label: 'Mission length', unit: 'days', step: 10, min: 1, max: 1200 },
]

const REPORTING_FIELDS: Field<ReportingAssumptions>[] = [
  { key: 'days', label: 'Window', unit: 'days', step: 1, min: 0, max: 365 },
  { key: 'crewSize', label: 'Crew size', unit: 'people', step: 1, min: 0, max: 12 },
  { key: 'complianceProb', label: 'Chance of doing the check on a given day', unit: '', step: 0.05, min: 0, max: 1, slider: true },
  { key: 'badDayProb', label: 'Chance a day has something worth reporting', unit: '', step: 0.05, min: 0, max: 1, slider: true },
  { key: 'underReportProb', label: 'Chance of hiding a bad day when values are scored', unit: '', step: 0.05, min: 0, max: 1, slider: true },
  { key: 'seed', label: 'Random seed', unit: '', step: 1, min: 0, max: 9999 },
]

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
    <div className="border-t border-rule p-5">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="label">Assumptions &mdash; change them</h3>
        <button className={linkBtn} onClick={onReset}>
          Reset
        </button>
      </div>

      <div className="mt-4 grid gap-x-8 gap-y-4 lg:grid-cols-2">
        {fields.map((f) => {
          const set = (n: number) => Number.isFinite(n) && onChange({ ...values, [f.key]: n })
          return (
            <label key={f.key} className="block">
              <span className="flex items-baseline justify-between gap-3">
                <span className="label">
                  {f.label} {f.unit && <span className="normal-case">({f.unit})</span>}
                </span>
                <span className="mono text-sm font-semibold" style={{ color: 'var(--color-accent)' }}>
                  {values[f.key]}
                </span>
              </span>
              {f.slider ? (
                <input
                  className="mt-2 h-11 w-full accent-accent"
                  type="range"
                  step={f.step}
                  min={f.min}
                  max={f.max}
                  value={values[f.key]}
                  onChange={(e) => set(Number(e.target.value))}
                />
              ) : (
                <input
                  className="field mt-2 h-10 py-0"
                  type="number"
                  step={f.step}
                  min={f.min}
                  max={f.max}
                  value={values[f.key]}
                  onChange={(e) => set(Number(e.target.value))}
                />
              )}
            </label>
          )
        })}
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
        <span className="label">{label}</span>
        <span className="value" style={{ fontSize: '1.5rem', color: strong ? 'var(--color-accent)' : undefined }}>
          <Counter value={value} decimals={value % 1 === 0 ? 0 : 1} />
          <span className="value-unit"> {unit}</span>
        </span>
      </div>
      <div className="meter mt-2">
        <span style={{ width: `${pct}%`, background: strong ? 'var(--color-accent)' : 'var(--color-rule-strong)' }} />
      </div>
    </div>
  )
}

const SimBadge = () => (
  <span className="pill" style={{ color: 'var(--color-watch-ink)' }}>
    <Icon name="alert" size={12} />
    Simulation
  </span>
)

export function Metrics() {
  const [time, setTime] = useState<TimeAssumptions>(TIME_DEFAULTS)
  const [reporting, setReporting] = useState<ReportingAssumptions>(REPORTING_DEFAULTS)

  const t = useMemo(() => crewMinutesPerDay(time), [time])
  const r = useMemo(() => reportingCompleteness(reporting), [reporting])

  const timeMax = Math.max(t.mirrorMinPerCrewDay, t.manualMinPerCrewDay, 1)

  return (
    <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6">
      <div className="border-b border-rule pb-5">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Two numbers we cannot measure yet, modelled openly</h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">
          Neither figure below is an observation. Both come from simple models whose every input is on this page and editable, so you can
          see exactly which assumption is doing the work. Nothing here comes from NASA data, and nothing here is a claim about real crews.
        </p>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <Panel label="Crew minutes per day" aside={<SimBadge />} delay={0} ariaLabelledby="time-heading">
          <div className="p-5">
            <h2 id="time-heading" className="text-xl font-semibold tracking-tight">
              One check against logging everything separately
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Linear on purpose: a more elaborate model would only bury the assumptions it rests on.
            </p>

            <div className="mt-6 space-y-5">
              <CompareBar label="Separate logging" value={t.manualMinPerCrewDay} max={timeMax} unit="min/day" />
              <CompareBar label="One mirror check" value={t.mirrorMinPerCrewDay} max={timeMax} unit="min/day" strong />
            </div>

            <div className="mt-6 grid grid-cols-2 gap-5 border-t border-rule pt-5">
              <div>
                <p className="label">Difference</p>
                <p className="value mt-1" style={{ fontSize: '2rem', color: 'var(--color-accent)' }}>
                  <Counter value={t.savedMinPerCrewDay} decimals={1} />
                  <span className="value-unit"> min/day</span>
                </p>
              </div>
              <div>
                <p className="label">Over the mission</p>
                <p className="value mt-1" style={{ fontSize: '2rem' }}>
                  <Counter value={t.savedHoursPerMission} decimals={1} />
                  <span className="value-unit"> crew hours</span>
                </p>
                <p className="mt-1 text-sm text-muted">
                  {time.crewSize} crew &times; {time.missionDays} days &middot;{' '}
                  {t.savedHoursPerMission >= 0 ? 'given back' : 'spent extra'}
                </p>
              </div>
            </div>
          </div>

          <Assumptions fields={TIME_FIELDS} values={time} onChange={setTime} onReset={() => setTime(TIME_DEFAULTS)} />
        </Panel>

        <Panel label="Reporting completeness" aside={<SimBadge />} delay={90} ariaLabelledby="reporting-heading">
          <div className="p-5">
            <h2 id="reporting-heading" className="text-xl font-semibold tracking-tight">
              Rewarding effort against rewarding healthy values
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              What share of person-days gets reported under each scoring scheme over the window.
            </p>

            <div className="mt-6 space-y-5">
              <CompareBar label="Reward effort" value={asPercent(r.effort)} max={100} unit="%" strong />
              <CompareBar label="Reward values" value={asPercent(r.value)} max={100} unit="%" />
            </div>

            <div className="mt-6 grid grid-cols-2 gap-5 border-t border-rule pt-5">
              <div>
                <p className="label">Bad days hidden</p>
                <p
                  className="value mt-1"
                  style={{ fontSize: '2rem', color: r.hiddenBadDays > 0 ? 'var(--color-watch-ink)' : undefined }}
                >
                  <Counter value={r.hiddenBadDays} />
                  <span className="value-unit"> of {r.opportunities}</span>
                </p>
              </div>
              <div>
                <p className="label">Person-days modelled</p>
                <p className="value mt-1" style={{ fontSize: '2rem' }}>
                  <Counter value={r.opportunities} />
                </p>
              </div>
            </div>

            <div className="mt-6 border-l-2 border-accent bg-accent-wash px-4 py-3 text-sm">
              <p className="label">The model, in one sentence</p>
              <p className="mt-1.5 leading-relaxed">
                On each person-day someone either does the check or does not; if they do, and it is a bad day, and the score rewards
                healthy values, they may skip reporting it. Rewarding effort removes that last step, so it can only ever report more,
                never less.
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Both schemes are run from the same random draws, so with a hiding chance of zero the two are identical rather than merely
                close. Deterministic for a given seed. The claim that people under-report when bad values are punished is an assumption we
                made, not a result we found.
              </p>
            </div>
          </div>

          <Assumptions
            fields={REPORTING_FIELDS}
            values={reporting}
            onChange={setReporting}
            onReset={() => setReporting(REPORTING_DEFAULTS)}
          />
        </Panel>
      </div>

      <p className="mt-8 max-w-3xl text-sm leading-relaxed text-muted">
        The same assumptions are written down in NOTES.md so they end up on the limitations slide rather than being quietly forgotten.
      </p>
    </main>
  )
}
