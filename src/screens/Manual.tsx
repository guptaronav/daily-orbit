import { useState, type FormEvent } from 'react'
import { btnPrimary, h1, page } from '../components/ui'
import type { GameEvent, Measurement } from '../contract/types'
import { addEvent, addMeasurement } from '../db/repo'
import { getContent } from '../lib/content'
import { ENTRY_FORMS, validateEntry, type EntryForm, type EntryValue } from '../lib/manualEntry'
import { REGIONS } from '../lib/regions'
import { useApp } from '../state/AppContext'

const regionLabelFor = (value: EntryValue): string =>
  REGIONS.find((r) => r.indicators.includes(value.indicator))?.label ?? 'body map'

const summarize = (values: EntryValue[]): string =>
  values.map((v) => `${getContent(v.indicator).label} ${v.value} ${v.unit}`).join(' · ')

type Saved = { text: string; region: string }

function EntryCard({ form }: { form: EntryForm }) {
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
    if (form.kind === 'exerciseMinutes') {
      const event: GameEvent = { id: crypto.randomUUID(), crewId, timestamp, kind: 'exerciseComplete' }
      await addEvent(event)
    }

    setBusy(false)
    setSaved({ text: summarize(result.values), region: regionLabelFor(result.values[0]) })
    setRaw({})
    refresh()
  }

  const errorId = `${form.kind}-error`

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="card flex flex-col p-5" aria-labelledby={`${form.kind}-title`}>
      <h2 id={`${form.kind}-title`} className="text-base font-semibold tracking-tight">
        {form.title}
      </h2>
      <p className="mt-1 text-sm text-muted">{form.hint}</p>

      <div className="mt-4 flex flex-wrap gap-4">
        {form.fields.map((f) => {
          const invalid = problem?.field === f.name
          return (
            <label key={f.name} className="min-w-[8rem] flex-1">
              <span className="label">
                {f.label} <span className="normal-case tracking-normal">({f.unit})</span>
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

      <div className="mt-auto flex items-center gap-4 pt-2">
        <button type="submit" className={btnPrimary} disabled={busy}>
          {busy ? 'Saving…' : 'Save'}
        </button>
      </div>

      <p aria-live="polite" className="mt-3 min-h-[2.5rem] text-sm">
        {saved && (
          <>
            <span className="font-medium" style={{ color: 'var(--color-ok-ink)' }}>
              Saved.
            </span>{' '}
            <span>{saved.text}</span>
            <br />
            <span className="text-muted">The {saved.region.toLowerCase()} region of the body map now uses this reading.</span>
          </>
        )}
      </p>
    </form>
  )
}

export function Manual() {
  const { currentCrew } = useApp()

  return (
    <main className={page}>
      <p className="label">Manual entry</p>
      <h1 className={`${h1} mt-1`}>Log a reading the camera cannot take</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
        Anything measured with a cuff, a thermometer, a glucose meter or a clock goes here. Entries are saved to{' '}
        <span className="font-medium text-ink">{currentCrew?.name ?? 'the selected crew member'}</span> and feed the same baseline and body
        map as the mirror check. The ranges on these fields only catch typing mistakes — they are not clinical limits, and nothing here is
        scored on how good or bad the number is.
      </p>

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {ENTRY_FORMS.map((form) => (
          <EntryCard key={form.kind} form={form} />
        ))}
      </div>
    </main>
  )
}
