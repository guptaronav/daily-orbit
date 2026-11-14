import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Icon, type IconName } from '../components/kit/Icon'
import { Slider, Stepper } from '../components/kit/Controls'
import { useCrewGame } from '../components/kit/useCrewGame'
import { CoinIcon } from '../components/kit/Wallet'
import type { GameEvent, Measurement } from '../contract/types'
import { addEvent, addMeasurement, listMeasurements } from '../db/repo'
import { readAll } from '../lib/bodyStatus'
import { getContent } from '../lib/content'
import { ENTRY_FORMS, validateEntry, type EntryForm, type EntryKind, type EntryValue } from '../lib/manualEntry'
import { dailyPlan } from '../lib/plan'
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

/**
 * Which fields get a drag track as well as a stepper. Only where the guard range is narrow enough
 * for dragging to land somewhere useful; the wide ones (blood sugar 10-900) would just be a toy.
 */
const WITH_SLIDER = new Set(['sleepHours', 'exerciseMinutes', 'temperature'])

const regionFor = (indicator: EntryValue['indicator']): string =>
  REGIONS.find((r) => r.indicators.includes(indicator))?.label ?? 'body map'

const summarize = (values: EntryValue[]): string =>
  values.map((v) => `${getContent(v.indicator).label} ${v.value} ${v.unit}`).join(' · ')

export type LogEntry = { at: string; text: string; region: string; points: number }

type Saved = { text: string; note: string; points: number }

function EntryCard({ form, onLogged, delay }: { form: EntryForm; onLogged: (entry: LogEntry) => void; delay: number }) {
  const { crewId, refresh } = useApp()
  const [raw, setRaw] = useState<Record<string, string>>({})
  const [problem, setProblem] = useState<{ field: string; error: string } | null>(null)
  const [saved, setSaved] = useState<Saved | null>(null)
  const [busy, setBusy] = useState(false)

  // Exercise is the one entry that earns credit, because it records something you DID.
  const reward = form.kind === 'exerciseMinutes' ? POINTS.exerciseComplete : 0
  const region = regionFor(form.fields[0].indicator)

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

    if (reward > 0) {
      await addEvent({ id: crypto.randomUUID(), crewId, timestamp, kind: 'exerciseComplete' } satisfies GameEvent)
    }

    const text = summarize(result.values)
    setBusy(false)
    setSaved({ text, note: `The ${region.toLowerCase()} region now uses this reading.`, points: reward })
    setRaw({})
    onLogged({ at: new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), text, region, points: reward })
    refresh()
  }

  const errorId = `${form.kind}-error`
  const filled = form.fields.every((f) => (raw[f.name] ?? '').trim() !== '')

  return (
    <form
      onSubmit={(e) => void onSubmit(e)}
      aria-label={form.title}
      className="card animate-rise flex h-full flex-col p-5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <header className="flex items-start gap-3">
        <span
          aria-hidden
          className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl"
          style={{ background: 'var(--color-paper-deep)' }}
        >
          <Icon name={ICON[form.kind]} size={19} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold tracking-tight">{form.title}</h2>
          <p className="text-sm text-muted">Feeds {region.toLowerCase()}</p>
        </div>
        {reward > 0 && (
          <span className="pill" style={{ background: 'var(--color-ink)', color: 'var(--color-paper)' }}>
            <CoinIcon size={13} />+{reward}
          </span>
        )}
      </header>

      <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">{form.hint}</p>

      <div className="mt-5 flex flex-1 flex-col gap-5">
        {form.fields.map((f) => {
          const invalid = problem?.field === f.name
          return (
            <div key={f.name}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-semibold">{f.label}</span>
                <span className="text-sm text-muted">{f.unit}</span>
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
                <div className="mt-1">
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

        <p id={errorId} role="alert" className="min-h-[1.5rem] text-sm leading-snug" style={{ color: 'var(--color-act-ink)' }}>
          {problem?.error ?? ''}
        </p>

        <div className="mt-auto">
          <button type="submit" className="btn btn-primary w-full" disabled={busy || !filled}>
            {busy ? 'Saving…' : `Log ${form.title.toLowerCase()}`}
          </button>
        </div>

        <div aria-live="polite" className="min-h-[2.5rem]">
          {saved && (
            <div className="animate-rise rounded-2xl p-3" style={{ background: 'var(--color-ok-wash)' }}>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-ok-ink)' }}>
                <span className="font-bold">Logged {saved.text}.</span> {saved.note}
              </p>
            </div>
          )}
        </div>
      </div>
    </form>
  )
}

export function Manual() {
  const { crewId, currentCrew, go, dataVersion } = useApp()
  const [log, setLog] = useState<LogEntry[]>([])
  const [measurements, setMeasurements] = useState<Measurement[] | null>(null)
  const game = useCrewGame(crewId, dataVersion)

  useEffect(() => {
    let cancelled = false
    void listMeasurements(crewId).then((rows) => !cancelled && setMeasurements(rows))
    return () => {
      cancelled = true
    }
  }, [crewId, dataVersion])

  /** Today's quests come from the same daily plan the progress screen uses. */
  const quests = useMemo(() => {
    if (measurements === null || !game.ready) return []
    return dailyPlan({
      crewId,
      readings: readAll(measurements),
      events: game.events,
      measurements,
      now: new Date(),
    })
  }, [measurements, game.events, game.ready, crewId])

  const questsDone = quests.filter((q) => q.done).length
  const sessionCoins = log.reduce((sum, l) => sum + l.points, 0)

  return (
    <main className="mx-auto w-full max-w-[1440px] px-4 pb-10 pt-8 sm:px-8">
      <p className="label">Log · {currentCrew?.name}</p>
      <h1 className="display mt-2 text-4xl sm:text-5xl">Log what the camera can&rsquo;t see.</h1>
      <p className="mt-4 max-w-3xl text-lg leading-relaxed text-ink-soft">
        Cuff, thermometer, glucose meter, mass device, or the clock. Each reading feeds the same baseline as the mirror check. Field limits
        only catch typos; they are not health limits, and a reading earns the same coins whatever it says.
      </p>

      {quests.length > 0 && (
        <section aria-labelledby="quests" className="card mt-7 p-5">
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
            <div>
              <h2 id="quests" className="text-lg font-bold tracking-tight">
                Today&rsquo;s quests
                <span className="ml-2 font-semibold text-muted">
                  {questsDone}/{quests.length}
                </span>
              </h2>
              <p className="text-sm text-muted">Coins reward doing, never the numbers</p>
            </div>
            {sessionCoins > 0 && (
              <span className="pill" style={{ background: 'var(--color-ink)', color: 'var(--color-paper)' }}>
                <CoinIcon size={13} />
                {sessionCoins} coins earned on this visit
              </span>
            )}
          </div>

          <ul className="mt-4 flex flex-wrap gap-2">
            {quests.map((q) => (
              <li key={q.id}>
                <span
                  className="pill"
                  style={
                    q.done
                      ? { background: 'var(--color-ok-wash)', color: 'var(--color-ok-ink)' }
                      : { background: 'var(--color-paper-deep)', color: 'var(--color-ink)' }
                  }
                >
                  {q.done && <Icon name="check" size={13} />}
                  {q.title}
                  <span className="font-bold">+{q.points}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="grid gap-5 md:grid-cols-2">
          {ENTRY_FORMS.map((form, i) => (
            <EntryCard key={form.kind} form={form} delay={i * 70} onLogged={(entry) => setLog((l) => [...l, entry])} />
          ))}
        </div>

        <aside className="card self-start p-5 xl:sticky xl:top-28">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-bold tracking-tight">This session</h2>
            <span className="value" style={{ fontSize: '1.75rem' }}>
              {log.length}
            </span>
          </div>

          {log.length === 0 ? (
            <div className="mt-4 rounded-2xl px-4 py-6 text-center" style={{ background: 'var(--color-panel-2)' }}>
              <p className="font-semibold">Nothing logged yet</p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">Readings you save on this visit stack up here, newest first.</p>
            </div>
          ) : (
            <ul className="mt-4 space-y-2">
              {[...log].reverse().map((entry, i) => (
                <li key={i} className="animate-rise flex items-start gap-3 rounded-2xl p-3" style={{ background: 'var(--color-panel-2)' }}>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{entry.text}</span>
                    <span className="block text-sm text-muted">
                      {entry.at} · {entry.region}
                    </span>
                  </span>
                  {entry.points > 0 && (
                    <span className="pill shrink-0" style={{ background: 'var(--color-ink)', color: 'var(--color-paper)' }}>
                      +{entry.points}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}

          <button onClick={() => go('bodymap')} className="btn-quiet mt-4">
            See it on the body map
            <Icon name="arrowRight" size={15} />
          </button>
        </aside>
      </div>
    </main>
  )
}
