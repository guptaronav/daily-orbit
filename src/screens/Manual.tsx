import { useState, type FormEvent } from 'react'
import { BorderBeam, Button, EmptyState, Slider, Stepper } from '../components/kit/Controls'
import { Icon, type IconName } from '../components/kit/Icon'
import { Panel } from '../components/kit/Panel'
import { Counter } from '../components/kit/Readout'
import type { GameEvent, Measurement } from '../contract/types'
import { addEvent, addMeasurement } from '../db/repo'
import { getContent } from '../lib/content'
import { ENTRY_FORMS, validateEntry, type EntryForm, type EntryKind, type EntryValue } from '../lib/manualEntry'
import { REGIONS } from '../lib/regions'
import { POINTS } from '../lib/scoring'
import { useApp } from '../state/AppContext'

const ICON: Record<EntryKind, IconName> = {
  bloodPressure: 'heart',
  temperature: 'body',
  bloodSugar: 'gut',
  sleepHours: 'head',
  exerciseMinutes: 'bone',
  bodyMass: 'gut',
  bowelMovements: 'gut',
}

/**
 * Which fields get a drag track as well as a stepper. Only where the guard range is narrow
 * enough for dragging to land somewhere useful; the wide ones (blood sugar 10-900) would just
 * be a toy, and the stepper is the honest control there.
 */
const WITH_SLIDER = new Set(['sleepHours', 'exerciseMinutes', 'temperature', 'bowelMovements'])

const regionLabelFor = (value: EntryValue): string => REGIONS.find((r) => r.indicators.includes(value.indicator))?.label ?? 'body map'

const summarize = (values: EntryValue[]): string =>
  values.map((v) => `${getContent(v.indicator).label} ${v.value} ${v.unit}`).join(' · ')

export type LogEntry = { at: string; text: string; region: string; points: number }

type Saved = { text: string; region: string; points: number }

function EntryCard({ form, onLogged, delay }: { form: EntryForm; onLogged: (entry: LogEntry) => void; delay: number }) {
  const { crewId, refresh } = useApp()
  const [raw, setRaw] = useState<Record<string, string>>({})
  const [problem, setProblem] = useState<{ field: string; error: string } | null>(null)
  const [saved, setSaved] = useState<Saved | null>(null)
  const [busy, setBusy] = useState(false)
  const [active, setActive] = useState(false)

  const set = (name: string, next: string) => {
    setRaw((r) => ({ ...r, [name]: next }))
    if (problem?.field === name) setProblem(null)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const result = validateEntry(form.kind, raw)
    if (!result.ok) {
      setProblem({ field: result.field, error: result.error })
      setSaved(null)
      return
    }
    setProblem(null)
    setBusy(true)

    const timestamp = new Date().toISOString()
    const measurements: Measurement[] = result.values.map((v) => ({
      id: crypto.randomUUID(),
      crewId,
      timestamp,
      indicator: v.indicator,
      value: v.value,
      unit: v.unit,
      // A number a person typed in is taken at face value: there is no signal to score.
      quality: { score: 1, passed: true },
      source: 'manual',
    }))
    for (const m of measurements) await addMeasurement(m)

    // Effort, not value: logging exercise earns the same points whatever the number says.
    let points = 0
    if (form.kind === 'exerciseMinutes') {
      await addEvent({ id: crypto.randomUUID(), crewId, timestamp, kind: 'exerciseComplete' } satisfies GameEvent)
      points = POINTS.exerciseComplete
    }

    const text = summarize(result.values)
    const region = regionLabelFor(result.values[0])
    setBusy(false)
    setSaved({ text, region, points })
    setRaw({})
    onLogged({ at: new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), text, region, points })
    refresh()
  }

  const errorId = `${form.kind}-error`
  const filled = form.fields.every((f) => (raw[f.name] ?? '').trim() !== '')

  return (
    <form
      onSubmit={(e) => void onSubmit(e)}
      onFocusCapture={() => setActive(true)}
      onBlurCapture={(e) => !e.currentTarget.contains(e.relatedTarget) && setActive(false)}
      aria-label={form.title}
      className={`card animate-rise relative flex h-full flex-col ${active ? 'border-accent' : ''}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <BorderBeam active={active} />

      <header className="flex items-center gap-3 border-b border-rule p-4">
        <span
          aria-hidden
          className="grid h-10 w-10 shrink-0 place-items-center border transition-colors"
          style={{
            borderColor: active ? 'var(--color-accent)' : 'var(--color-rule-strong)',
            color: active ? 'var(--color-accent)' : 'var(--color-muted)',
            background: 'color-mix(in srgb, currentColor 9%, transparent)',
          }}
        >
          <Icon name={ICON[form.kind]} size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold tracking-tight">{form.title}</h2>
          <p className="mono truncate text-sm text-muted">
            {regionLabelFor({ indicator: form.fields[0].indicator, value: 0, unit: '' })} region
          </p>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-5 p-4">
        <p className="text-sm leading-relaxed text-muted">{form.hint}</p>

        {form.fields.map((f) => {
          const invalid = problem?.field === f.name
          return (
            <div key={f.name}>
              <div className="flex items-baseline justify-between gap-3">
                <label className="label" htmlFor={`${form.kind}-${f.name}`}>
                  {f.label}
                </label>
                <span className="mono text-sm text-muted">{f.unit}</span>
              </div>
              <div className="mt-2">
                <Stepper
                  name={f.name}
                  value={raw[f.name] ?? ''}
                  onChange={(next) => set(f.name, next)}
                  step={f.step}
                  min={f.min}
                  max={f.max}
                  invalid={invalid}
                  describedBy={invalid ? errorId : undefined}
                  unitLabel={f.label.toLowerCase()}
                />
              </div>
              {WITH_SLIDER.has(f.name) && (
                <div className="mt-1.5">
                  <Slider
                    value={raw[f.name] ?? ''}
                    onChange={(next) => set(f.name, next)}
                    step={f.step}
                    min={f.min}
                    max={f.max}
                    label={`${f.label} slider`}
                    minLabel={`${f.min} ${f.unit}`}
                    maxLabel={`${f.max} ${f.unit}`}
                  />
                </div>
              )}
            </div>
          )
        })}

        {/* Errors sit with the form, next to the field that is marked invalid. */}
        <p id={errorId} role="alert" className="min-h-[1.25rem] text-sm leading-snug" style={{ color: 'var(--color-act-ink)' }}>
          {problem?.error ?? ''}
        </p>

        <div className="mt-auto">
          <Button type="submit" disabled={busy || !filled} className="w-full">
            <Icon name="plus" size={15} />
            {busy ? 'Saving…' : `Log ${form.title.toLowerCase()}`}
          </Button>
        </div>

        <div aria-live="polite" className="min-h-[2.75rem]">
          {saved && (
            <div
              className="animate-rise flex items-start gap-2.5 border-l-2 pl-3"
              style={{ borderColor: 'var(--color-ok)' }}
            >
              <Icon name="check" size={15} className="mt-0.5" />
              <p className="text-sm leading-relaxed">
                <span className="label" style={{ color: 'var(--color-ok-ink)' }}>
                  Logged
                </span>{' '}
                <span className="mono">{saved.text}</span>
                {saved.points > 0 && (
                  <span className="pill ml-2" style={{ color: 'var(--color-accent)' }}>
                    +{saved.points} effort
                  </span>
                )}
                <br />
                <span className="text-muted">The {saved.region.toLowerCase()} region now uses this reading.</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </form>
  )
}

export function Manual() {
  const { currentCrew, go } = useApp()
  const [log, setLog] = useState<LogEntry[]>([])

  const points = log.reduce((sum, l) => sum + l.points, 0)
  const regions = new Set(log.map((l) => l.region)).size

  return (
    <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6">
      {/* ---- Header with a stats rail -------------------------------------- */}
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5 border-b border-rule pb-5">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Log a reading the camera cannot take</h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">
            Anything measured with a cuff, a thermometer, a glucose meter or a clock goes here. Entries are saved to{' '}
            <span className="font-medium text-ink">{currentCrew?.name ?? 'the selected crew member'}</span> and feed the same baseline and
            body map as the mirror check. Drag for a rough number, type for the exact one. The limits on these fields only catch typing
            mistakes &mdash; they are not clinical limits, and nothing here is scored on how good or bad the number is.
          </p>
        </div>

        <dl className="flex gap-x-10 gap-y-3">
          <div>
            <dt className="label">Logged now</dt>
            <dd className="value mt-1" style={{ fontSize: '2rem' }}>
              <Counter value={log.length} />
            </dd>
          </div>
          <div>
            <dt className="label">Regions touched</dt>
            <dd className="value mt-1" style={{ fontSize: '2rem' }}>
              <Counter value={regions} />
            </dd>
          </div>
          <div>
            <dt className="label">Effort points</dt>
            <dd className="value mt-1" style={{ fontSize: '2rem', color: points > 0 ? 'var(--color-accent)' : undefined }}>
              <Counter value={points} />
            </dd>
          </div>
        </dl>
      </div>

      {/* ---- Forms and the session log --------------------------------------- */}
      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {ENTRY_FORMS.map((form, i) => (
            <EntryCard key={form.kind} form={form} delay={i * 70} onLogged={(entry) => setLog((l) => [...l, entry])} />
          ))}
        </div>

        <Panel
          label="This session"
          aside={<span className="ticker">{log.length} entr{log.length === 1 ? 'y' : 'ies'}</span>}
          delay={360}
          className="self-start xl:sticky xl:top-32"
        >
          {log.length === 0 ? (
            <EmptyState
              icon="clock"
              title="Nothing logged yet"
              body="Readings you save on this visit appear here, newest first, with the region each one feeds."
            />
          ) : (
            <ul className="divide-y divide-rule">
              {[...log].reverse().map((entry, i) => (
                <li key={i} className="animate-rise flex items-start gap-3 px-4 py-3">
                  <span className="mono mt-0.5 shrink-0 text-sm text-muted">{entry.at}</span>
                  <span className="min-w-0 flex-1">
                    <span className="mono block truncate text-sm">{entry.text}</span>
                    <span className="mono text-sm text-muted">{entry.region}</span>
                  </span>
                  {entry.points > 0 && (
                    <span className="pill shrink-0" style={{ color: 'var(--color-accent)' }}>
                      +{entry.points}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}

          <div className="border-t border-rule p-4">
            <Button variant="outline" onClick={() => go('bodymap')} className="w-full">
              Open the console
              <Icon name="arrowRight" size={13} />
            </Button>
          </div>
        </Panel>
      </div>
    </main>
  )
}
