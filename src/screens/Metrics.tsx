import { useMemo, useState } from 'react'
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

const SimChip = ({ small = false }: { small?: boolean }) => (
  <span
    className="inline-flex w-fit items-center self-start px-2.5 py-1"
    style={{
      borderRadius: 999,
      background: 'var(--color-watch-wash)',
      color: 'var(--color-watch-ink)',
      fontSize: small ? 11.5 : 12.5,
      fontWeight: 600,
      letterSpacing: small ? '.05em' : '.06em',
      textTransform: 'uppercase',
    }}
  >
    Simulation
  </span>
)

/** The prototype's bar: a dashed track with a solid fill, and the number above it at 30px. */
function Bar({ label, value, max, unit, strong = false }: { label: string; value: number; max: number; unit: string; strong?: boolean }) {
  const pct = max <= 0 ? 0 : Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <span className="text-[12.5px] text-muted">{label}</span>
        <span className="flex items-baseline gap-1.5">
          <span style={{ fontSize: 30, fontWeight: 600, lineHeight: 1, letterSpacing: '-0.02em' }}>
            <Counter value={value} decimals={value % 1 === 0 ? 0 : 1} />
          </span>
          <span className="text-sm text-muted">{unit}</span>
        </span>
      </div>
      <div
        className="mt-2 overflow-hidden"
        style={{
          height: 10,
          borderRadius: 999,
          background:
            'repeating-linear-gradient(to right, color-mix(in srgb, var(--color-rule) 80%, transparent) 0 2px, transparent 2px 8px)',
        }}
      >
        <span
          className="block h-full"
          style={{
            width: `${pct}%`,
            borderRadius: 999,
            background: strong ? 'var(--color-ink)' : 'var(--color-rule-strong)',
            transition: 'width 700ms cubic-bezier(.22,1,.36,1)',
          }}
        />
      </div>
    </div>
  )
}

const round = (n: number, step: number): number => {
  const places = (String(step).split('.')[1] ?? '').length
  return Number(n.toFixed(places))
}

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
        <h3 className="m-0" style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em' }}>
          Assumptions &mdash; change them
        </h3>
        <button className="btn-quiet" onClick={onReset}>
          Reset
        </button>
      </div>

      <div className="mt-4 grid gap-x-7 gap-y-4 lg:grid-cols-2">
        {fields.map((f) => {
          const v = values[f.key]
          const set = (n: number) => onChange({ ...values, [f.key]: round(Math.min(f.max, Math.max(f.min, n)), f.step) })
          return (
            <div key={f.key}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[13.5px] font-semibold">{f.label}</span>
                <span className="text-[13px] text-muted">{f.unit}</span>
              </div>
              <div className="mt-1.5 flex items-stretch overflow-hidden" style={{ borderRadius: 14, background: 'var(--color-panel-2)' }}>
                <button
                  type="button"
                  onClick={() => set(v - f.step)}
                  disabled={v <= f.min}
                  aria-label={`Decrease ${f.label.toLowerCase()}`}
                  className="grid w-12 place-items-center disabled:opacity-30"
                  style={{ minHeight: 48, fontSize: 20, fontWeight: 600 }}
                >
                  &minus;
                </button>
                <input
                  type="number"
                  step={f.step}
                  min={f.min}
                  max={f.max}
                  value={v}
                  aria-label={f.label}
                  onChange={(e) => {
                    const n = Number(e.target.value)
                    if (e.target.value.trim() !== '' && Number.isFinite(n)) set(n)
                  }}
                  className="min-w-0 flex-1 border-0 bg-transparent text-center outline-none"
                  style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', appearance: 'textfield' }}
                />
                <button
                  type="button"
                  onClick={() => set(v + f.step)}
                  disabled={v >= f.max}
                  aria-label={`Increase ${f.label.toLowerCase()}`}
                  className="grid w-12 place-items-center disabled:opacity-30"
                  style={{ minHeight: 48, fontSize: 20, fontWeight: 600 }}
                >
                  +
                </button>
              </div>
            </div>
          )
        })}
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
    <main
      className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 pb-[72px] pt-7"
      style={{ paddingLeft: 'clamp(16px, 3vw, 32px)', paddingRight: 'clamp(16px, 3vw, 32px)' }}
    >
      <div className="flex flex-col gap-3">
        <SimChip />
        <h1 className="m-0" style={{ fontSize: 'clamp(32px, 4.2vw, 52px)', lineHeight: 1, fontWeight: 700, letterSpacing: '-0.045em' }}>
          Two numbers we cannot measure yet, modelled openly
        </h1>
        <p className="m-0 max-w-[70ch] text-ink-soft" style={{ fontSize: 15, lineHeight: 1.65 }}>
          Neither figure below is an observation. Both come from simple models whose every input is on this page and editable, so you can
          see exactly which assumption is doing the work. Nothing here comes from NASA data, and nothing here is a claim about real crews.
        </p>
      </div>

      <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 560px), 1fr))' }}>
        <section aria-labelledby="time-heading" className="border border-rule bg-panel" style={{ borderRadius: 24 }}>
          <header className="flex items-center justify-between gap-3 border-b border-rule px-6" style={{ minHeight: 42 }}>
            <span className="text-[12.5px] text-muted">Crew minutes per day</span>
            <SimChip small />
          </header>

          <div className="p-6">
            <h2 id="time-heading" className="m-0" style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.015em' }}>
              One check against logging everything separately
            </h2>
            <p className="m-0 mt-2 text-muted" style={{ fontSize: 14.5, lineHeight: 1.6 }}>
              Linear on purpose: a more elaborate model would only bury the assumptions it rests on.
            </p>

            <div className="mt-6 flex flex-col gap-5">
              <Bar label="Separate logging" value={t.manualMinPerCrewDay} max={timeMax} unit="min/day" />
              <Bar label="One mirror check" value={t.mirrorMinPerCrewDay} max={timeMax} unit="min/day" strong />
            </div>

            <dl className="m-0 mt-6 grid gap-4 p-5" style={{ gridTemplateColumns: '1fr 1fr', borderRadius: 20, background: 'var(--color-panel-2)' }}>
              <div>
                <dt className="text-xs text-muted">Difference</dt>
                <dd className="m-0 mt-1" style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em' }}>
                  <Counter value={t.savedMinPerCrewDay} decimals={1} />
                  <span className="text-sm font-medium text-muted"> min/day</span>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Over the mission</dt>
                <dd className="m-0 mt-1" style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em' }}>
                  <Counter value={t.savedHoursPerMission} decimals={1} />
                  <span className="text-sm font-medium text-muted"> crew hours</span>
                </dd>
                <dd className="m-0 mt-1 text-[13px] text-muted">
                  {time.crewSize} crew &times; {time.missionDays} days · {t.savedHoursPerMission >= 0 ? 'given back' : 'spent extra'}
                </dd>
              </div>
            </dl>
          </div>

          <Assumptions fields={TIME_FIELDS} values={time} onChange={setTime} onReset={() => setTime(TIME_DEFAULTS)} />
        </section>

        <section aria-labelledby="reporting-heading" className="border border-rule bg-panel" style={{ borderRadius: 24 }}>
          <header className="flex items-center justify-between gap-3 border-b border-rule px-6" style={{ minHeight: 42 }}>
            <span className="text-[12.5px] text-muted">Reporting completeness</span>
            <SimChip small />
          </header>

          <div className="p-6">
            <h2 id="reporting-heading" className="m-0" style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.015em' }}>
              Rewarding effort against rewarding healthy values
            </h2>
            <p className="m-0 mt-2 text-muted" style={{ fontSize: 14.5, lineHeight: 1.6 }}>
              What share of person-days gets reported under each scoring scheme over the window.
            </p>

            <div className="mt-6 flex flex-col gap-5">
              <Bar label="Reward effort" value={asPercent(r.effort)} max={100} unit="%" strong />
              <Bar label="Reward values" value={asPercent(r.value)} max={100} unit="%" />
            </div>

            <dl className="m-0 mt-6 grid gap-4 p-5" style={{ gridTemplateColumns: '1fr 1fr', borderRadius: 20, background: 'var(--color-panel-2)' }}>
              <div>
                <dt className="text-xs text-muted">Bad days hidden</dt>
                <dd
                  className="m-0 mt-1"
                  style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em', color: r.hiddenBadDays > 0 ? 'var(--color-watch-ink)' : undefined }}
                >
                  <Counter value={r.hiddenBadDays} />
                  <span className="text-sm font-medium text-muted"> of {r.opportunities}</span>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Person-days modelled</dt>
                <dd className="m-0 mt-1" style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em' }}>
                  <Counter value={r.opportunities} />
                </dd>
              </div>
            </dl>

            <div className="mt-5 p-4" style={{ borderRadius: 20, background: 'var(--color-accent-wash)' }}>
              <p className="m-0 font-bold">The model, in one sentence</p>
              <p className="m-0 mt-1.5" style={{ fontSize: 14.5, lineHeight: 1.6 }}>
                On each person-day someone either does the check or does not; if they do, and it is a bad day, and the score rewards
                healthy values, they may skip reporting it. Rewarding effort removes that last step, so it can only ever report more, never
                less.
              </p>
              <p className="m-0 mt-2 text-muted" style={{ fontSize: 13.5, lineHeight: 1.55 }}>
                Both schemes are run from the same random draws, so with a hiding chance of zero the two are identical rather than merely
                close. Deterministic for a given seed. The claim that people under-report when bad values are punished is an assumption we
                made, not a result we found.
              </p>
            </div>
          </div>

          <Assumptions fields={REPORTING_FIELDS} values={reporting} onChange={setReporting} onReset={() => setReporting(REPORTING_DEFAULTS)} />
        </section>
      </div>

      <p className="m-0 max-w-[70ch] text-muted" style={{ fontSize: 14.5, lineHeight: 1.6 }}>
        The same assumptions are written down in NOTES.md so they end up on the limitations slide rather than being quietly forgotten.
      </p>
    </main>
  )
}
