import { useState, type FormEvent } from 'react'
import { Icon, type IconName } from '../components/kit/Icon'
import { Panel } from '../components/kit/Panel'
import { btnPrimary } from '../components/ui'
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
}

const regionLabelFor = (value: EntryValue): string => REGIONS.find((r) => r.indicators.includes(value.indicator))?.label ?? 'body map'

const summarize = (values: EntryValue[]): string =>
  values.map((v) => `${getContent(v.indicator).label} ${v.value} ${v.unit}`).join(' · ')

type Saved = { text: string; region: string; points: number }

function EntryCard({ form, onLogged, delay }: { form: EntryForm; onLogged: (entry: string) => void; delay: number }) {
  const { crewId, refresh } = useApp()
  const [raw, setRaw] = useState<Record<string, string>>({})
  const [problem, setProblem] = useState<{ field: string; error: string } | null>(null)
  const [saved, setSaved] = useState<Saved | null>(null)
  const [busy, setBusy] = useState(false)

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
      const event: GameEvent = { id: crypto.randomUUID(), crewId, timestamp, kind: 'exerciseComplete' }
      await addEvent(event)
      points = POINTS.exerciseComplete
    }

    const text = summarize(result.values)
    setBusy(false)
    setSaved({ text, region: regionLabelFor(result.values[0]), points })
    setRaw({})
    onLogged(text)
    refresh()
  }

  const errorId = `${form.kind}-error`

  return (
    <Panel
      label={form.title}
      aside={<Icon name={ICON[form.kind]} size={16} className="text-muted" />}
      delay={delay}
      className="h-full"
      as="div"
    >
      <form onSubmit={(e) => void onSubmit(e)} className="flex h-full flex-col p-5" aria-label={form.title}>
        <p className="text-sm leading-relaxed text-muted">{form.hint}</p>

        <div className="mt-4 flex flex-wrap gap-4">
          {form.fields.map((f) => {
            const invalid = problem?.field === f.name
            return (
              <label key={f.name} className="min-w-[7.5rem] flex-1">
                <span className="label">
                  {f.label} <span className="normal-case">({f.unit})</span>
                </span>
                <input
                  className="field mt-1.5"
                  type="number"
                  inputMode="decimal"
                  step={f.step}
                  name={f.name}
                  value={raw[f.name] ?? ''}
                  aria-invalid={invalid}
                  aria-describedby={invalid ? errorId : undefined}
                  onChange={(e) => {
                    setRaw((r) => ({ ...r, [f.name]: e.target.value }))
                    if (invalid) setProblem(null)
                  }}
                />
              </label>
            )
          })}
        </div>

        {/* Errors sit with the form, next to the field that is marked invalid. */}
        <p id={errorId} role="alert" className="mt-2 min-h-[1.25rem] text-sm" style={{ color: 'var(--color-act-ink)' }}>
          {problem?.error ?? ''}
        </p>

        <div className="mt-auto pt-2">
          <button type="submit" className={btnPrimary} disabled={busy}>
            <Icon name="plus" size={15} />
            {busy ? 'Saving…' : 'Log it'}
          </button>
        </div>

        <div aria-live="polite" className="mt-3 min-h-[3rem] text-sm">
          {saved && (
            <div className="animate-rise border-l-2 pl-3" style={{ borderColor: 'var(--color-ok)' }}>
              <p className="flex flex-wrap items-center gap-2">
                <span className="label" style={{ color: 'var(--color-ok-ink)' }}>
                  Logged
                </span>
                <span className="mono text-xs">{saved.text}</span>
                {saved.points > 0 && (
                  <span className="pill" style={{ color: 'var(--color-accent)' }}>
                    +{saved.points} effort pts
                  </span>
                )}
              </p>
              <p className="mt-1 text-xs text-muted">The {saved.region.toLowerCase()} region of the body map now uses this reading.</p>
            </div>
          )}
        </div>
      </form>
    </Panel>
  )
}

export function Manual() {
  const { currentCrew, go } = useApp()
  const [log, setLog] = useState<string[]>([])

  return (
    <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 border-b border-rule pb-5">
        <div>
          <p className="label label-mark">Manual entry</p>
          <h1 className="mt-1.5 text-3xl font-semibold tracking-tight sm:text-4xl">Log a reading the camera cannot take</h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">
            Anything measured with a cuff, a thermometer, a glucose meter or a clock goes here. Entries are saved to{' '}
            <span className="font-medium text-ink">{currentCrew?.name ?? 'the selected crew member'}</span> and feed the same baseline and
            body map as the mirror check. The ranges on these fields only catch typing mistakes &mdash; they are not clinical limits, and
            nothing here is scored on how good or bad the number is.
          </p>
        </div>

        <Panel label="This session" brackets={false} className="min-w-[13rem]">
          <div className="p-4">
            <p className="value" style={{ fontSize: '2rem' }}>
              {log.length}
              <span className="value-unit"> logged</span>
            </p>
            {log.length === 0 ? (
              <p className="mt-2 text-xs text-muted">Nothing logged yet on this visit.</p>
            ) : (
              <ul className="mono mt-2 space-y-1 text-[0.625rem] uppercase tracking-wider text-muted">
                {log.slice(-3).reverse().map((entry, i) => (
                  <li key={i} className="truncate">
                    {entry}
                  </li>
                ))}
              </ul>
            )}
            <button onClick={() => go('bodymap')} className="btn-quiet mt-2">
              Open the console
              <Icon name="arrowRight" size={13} />
            </button>
          </div>
        </Panel>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {ENTRY_FORMS.map((form, i) => (
          <EntryCard key={form.kind} form={form} delay={i * 70} onLogged={(entry) => setLog((l) => [...l, entry])} />
        ))}
      </div>
    </main>
  )
}
