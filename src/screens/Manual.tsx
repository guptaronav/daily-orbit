import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Slider } from '../components/kit/Controls'
import { Icon, type IconName } from '../components/kit/Icon'
import { useCrewGame } from '../components/kit/useCrewGame'
import { CoinIcon } from '../components/kit/Wallet'
import type { GameEvent, Measurement } from '../contract/types'
import { addEvent, addMeasurement, listMeasurements } from '../db/repo'
import { readAll } from '../lib/bodyStatus'
import { getContent } from '../lib/content'
import { ENTRY_FORMS, validateEntry, type EntryField, type EntryForm, type EntryKind, type EntryValue } from '../lib/manualEntry'
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

/** Only where the guard range is narrow enough for dragging to land somewhere useful. */
const WITH_SLIDER = new Set(['sleepHours', 'exerciseMinutes', 'temperature'])

const GOLD = '#f6c445'
const ON_GOLD = '#3b2a00'

const regionFor = (indicator: EntryValue['indicator']): string =>
  REGIONS.find((r) => r.indicators.includes(indicator))?.label ?? 'body map'

const summarize = (values: EntryValue[]): string =>
  values.map((v) => `${getContent(v.indicator).label} ${v.value} ${v.unit}`).join(' · ')

export type LogEntry = { at: string; text: string; region: string; points: number }

const round = (n: number, step: number): number => {
  const places = (String(step).split('.')[1] ?? '').length
  return Number(n.toFixed(places))
}

/** The prototype's field: a 56px-tall rounded well with the value at 28px between two steppers. */
function FieldWell({
  field,
  value,
  onChange,
  invalid,
  describedBy,
}: {
  field: EntryField
  value: string
  onChange: (next: string) => void
  invalid: boolean
  describedBy?: string
}) {
  const current = value.trim() === '' ? null : Number(value)
  const valid = current !== null && Number.isFinite(current)
  const nudge = (dir: 1 | -1) => {
    if (!valid) return onChange(String(field.min))
    onChange(String(round(Math.min(field.max, Math.max(field.min, current + dir * field.step)), field.step)))
  }

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={`f-${field.name}`} style={{ fontSize: 13.5, fontWeight: 600 }}>
          {field.label}
        </label>
        <span className="text-[13px] text-muted">{field.unit}</span>
      </div>

      <div
        className="mt-2 flex items-stretch overflow-hidden"
        style={{
          borderRadius: 16,
          background: 'var(--color-panel-2)',
          boxShadow: invalid ? '0 0 0 2px var(--color-act)' : undefined,
        }}
      >
        <button
          type="button"
          onClick={() => nudge(-1)}
          disabled={valid && current <= field.min}
          aria-label={`Decrease ${field.label.toLowerCase()}`}
          className="grid w-14 place-items-center disabled:opacity-30"
          style={{ minHeight: 56, fontSize: 22, fontWeight: 600 }}
        >
          &minus;
        </button>
        <input
          id={`f-${field.name}`}
          name={field.name}
          type="number"
          inputMode="decimal"
          step={field.step}
          value={value}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          onChange={(e) => onChange(e.target.value)}
          className="min-w-0 flex-1 border-0 bg-transparent text-center outline-none"
          style={{ fontSize: 28, fontWeight: 750, letterSpacing: '-0.02em', padding: 4, appearance: 'textfield' }}
        />
        <button
          type="button"
          onClick={() => nudge(1)}
          disabled={valid && current >= field.max}
          aria-label={`Increase ${field.label.toLowerCase()}`}
          className="grid w-14 place-items-center disabled:opacity-30"
          style={{ minHeight: 56, fontSize: 22, fontWeight: 600 }}
        >
          +
        </button>
      </div>

      {WITH_SLIDER.has(field.name) && (
        <div className="mt-1">
          <Slider
            value={value}
            onChange={onChange}
            step={field.step}
            min={field.min}
            max={field.max}
            label={`${field.label} slider`}
            minLabel={`${field.min} ${field.unit}`}
            maxLabel={`${field.max} ${field.unit}`}
          />
        </div>
      )}
    </div>
  )
}

function EntryCard({ form, onLogged }: { form: EntryForm; onLogged: (entry: LogEntry) => void }) {
  const { crewId, refresh } = useApp()
  const [raw, setRaw] = useState<Record<string, string>>({})
  const [problem, setProblem] = useState<{ field: string; error: string } | null>(null)
  const [saved, setSaved] = useState<{ text: string; note: string } | null>(null)
  const [coinFx, setCoinFx] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [hot, setHot] = useState(false)

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
      setCoinFx(reward)
      setTimeout(() => setCoinFx(null), 1500)
    }

    const text = summarize(result.values)
    setBusy(false)
    setSaved({ text, note: `The ${region.toLowerCase()} region now uses this reading.` })
    setRaw({})
    onLogged({ at: new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), text, region, points: reward })
    refresh()
  }

  const errorId = `${form.kind}-error`
  const filled = form.fields.every((f) => (raw[f.name] ?? '').trim() !== '')

  return (
    <form
      onSubmit={(e) => void onSubmit(e)}
      onMouseEnter={() => setHot(true)}
      onMouseLeave={() => setHot(false)}
      onFocusCapture={() => setHot(true)}
      onBlurCapture={(e) => !e.currentTarget.contains(e.relatedTarget) && setHot(false)}
      aria-label={form.title}
      className="relative flex flex-col border border-rule bg-panel"
      style={{ borderRadius: 26 }}
    >
      {coinFx !== null && (
        <span
          aria-hidden
          className="animate-floatup absolute left-1/2 top-2 z-10 inline-flex items-center gap-1.5 px-3 py-1.5"
          style={{ borderRadius: 999, background: GOLD, color: ON_GOLD, fontSize: 15, fontWeight: 800 }}
        >
          <CoinIcon size={14} />+{coinFx}
        </span>
      )}

      <header className="flex items-center gap-3.5 px-[18px] pt-[18px]">
        <span
          aria-hidden
          className="grid h-12 w-12 shrink-0 place-items-center transition-colors"
          style={{
            borderRadius: 16,
            background: hot ? '#14181f' : 'var(--color-panel-2)',
            color: hot ? '#f3f1ea' : 'var(--color-ink)',
          }}
        >
          <Icon name={ICON[form.kind]} size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="m-0" style={{ fontSize: 20, fontWeight: 750, letterSpacing: '-0.02em' }}>
            {form.title}
          </h2>
          <p className="m-0 text-[13px] text-muted">Feeds {region.toLowerCase()}</p>
        </div>
        {reward > 0 && (
          <span
            className="inline-flex shrink-0 items-center gap-1 px-2.5 py-1"
            style={{ borderRadius: 999, background: GOLD, color: ON_GOLD, fontSize: 12.5, fontWeight: 750 }}
          >
            <CoinIcon size={12} />+{reward}
          </span>
        )}
      </header>

      <div className="flex flex-1 flex-col gap-4 px-[18px] pb-[18px] pt-4">
        <p className="m-0 text-sm leading-[1.5] text-muted">{form.hint}</p>

        {form.fields.map((f) => (
          <FieldWell
            key={f.name}
            field={f}
            value={raw[f.name] ?? ''}
            onChange={(next) => set(f.name, next)}
            invalid={problem?.field === f.name}
            describedBy={problem?.field === f.name ? errorId : undefined}
          />
        ))}

        <p id={errorId} role="alert" className="m-0 min-h-[1.25rem] text-sm leading-snug" style={{ color: 'var(--color-act-ink)' }}>
          {problem?.error ?? ''}
        </p>

        <button type="submit" className="btn btn-primary mt-auto w-full" disabled={busy || !filled}>
          {busy ? 'Saving…' : `Log ${form.title.toLowerCase()}`}
        </button>

        <div aria-live="polite" className="min-h-[2.25rem]">
          {saved && (
            <p className="animate-rise m-0 p-3 text-sm leading-relaxed" style={{ borderRadius: 14, background: 'var(--color-ok-wash)', color: 'var(--color-ok-ink)' }}>
              <span className="font-bold">Logged {saved.text}.</span> {saved.note}
            </p>
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

  const quests = useMemo(() => {
    if (measurements === null || !game.ready) return []
    return dailyPlan({ crewId, readings: readAll(measurements), events: game.events, measurements, now: new Date() })
  }, [measurements, game.events, game.ready, crewId])

  const questsDone = quests.filter((q) => q.done).length
  const sessionCoins = log.reduce((sum, l) => sum + l.points, 0)

  return (
    <main
      className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 pb-[72px] pt-7"
      style={{ paddingLeft: 'clamp(16px, 3vw, 32px)', paddingRight: 'clamp(16px, 3vw, 32px)' }}
    >
      <div className="flex flex-wrap items-stretch gap-5">
        <div className="flex flex-col justify-center gap-3.5 py-2" style={{ flex: '2 1 520px' }}>
          <p className="m-0 text-sm text-muted">Log · {currentCrew?.name}</p>
          <h1 className="m-0" style={{ fontSize: 'clamp(40px, 6vw, 76px)', lineHeight: 0.92, fontWeight: 750, letterSpacing: '-0.05em' }}>
            Log what the
            <br />
            camera can&rsquo;t see.
          </h1>
          <p className="m-0 text-ink-soft" style={{ fontSize: 16, lineHeight: 1.55 }}>
            Cuff, thermometer, glucose meter, mass device, or the clock. Each reading feeds the same baseline as the mirror check. Field
            limits only catch typos; they are not health limits, and a reading earns the same coins whatever it says.
          </p>
        </div>

        <section aria-labelledby="quests" style={{ flex: '1 1 340px', padding: 22, borderRadius: 28, background: '#14181f', color: '#f3f1ea' }}>
          <div className="flex items-center gap-3.5">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full" style={{ background: 'rgb(243 241 234 / 0.1)' }}>
              <span style={{ fontSize: 16, fontWeight: 800 }}>
                {questsDone}/{Math.max(3, quests.length)}
              </span>
            </span>
            <div>
              <p id="quests" className="m-0" style={{ fontSize: 19, fontWeight: 750, letterSpacing: '-0.02em' }}>
                Today&rsquo;s quests
              </p>
              <p className="m-0 opacity-70" style={{ fontSize: 13.5 }}>
                {sessionCoins} coins earned on this visit
              </p>
            </div>
          </div>

          <ul className="m-0 mt-3.5 flex list-none flex-col gap-1.5 p-0">
            {quests.map((q) => (
              <li
                key={q.id}
                className="flex items-center gap-2.5 px-3 py-2.5 transition-colors"
                style={{ borderRadius: 14, background: q.done ? 'rgb(47 125 79 / 0.28)' : 'rgb(243 241 234 / 0.06)' }}
              >
                <span
                  aria-hidden
                  className="grid h-6 w-6 shrink-0 place-items-center rounded-full transition-colors"
                  style={{ background: q.done ? '#2fd39b' : 'rgb(243 241 234 / 0.16)', color: '#0b0f16' }}
                >
                  {q.done && <Icon name="check" size={13} />}
                </span>
                <span className="flex-1" style={{ fontSize: 14, fontWeight: 600 }}>
                  {q.title}
                </span>
                <span style={{ fontSize: 13.5, fontWeight: 750, color: GOLD }}>+{q.points}</span>
              </li>
            ))}
            {quests.length === 0 && <li className="px-3 py-2.5 text-sm opacity-70">Loading today&rsquo;s quests…</li>}
          </ul>
        </section>
      </div>

      <div className="flex flex-wrap gap-6">
        <div
          className="grid"
          style={{ flex: '999 1 640px', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: 18 }}
        >
          {ENTRY_FORMS.map((form) => (
            <EntryCard key={form.kind} form={form} onLogged={(entry) => setLog((l) => [...l, entry])} />
          ))}
        </div>

        <aside className="border border-rule bg-panel p-5" style={{ flex: '1 1 280px', borderRadius: 26, alignSelf: 'flex-start' }}>
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="m-0" style={{ fontSize: 19, fontWeight: 750, letterSpacing: '-0.02em' }}>
              This session
            </h2>
            <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em' }}>{log.length}</span>
          </div>

          {log.length === 0 ? (
            <div className="mt-4 px-4 py-6 text-center" style={{ borderRadius: 18, background: 'var(--color-panel-2)' }}>
              <p className="m-0 font-semibold">Nothing logged yet</p>
              <p className="m-0 mt-1.5 text-sm leading-relaxed text-muted">Readings you save on this visit stack up here, newest first.</p>
            </div>
          ) : (
            <ul className="m-0 mt-4 flex list-none flex-col gap-2 p-0">
              {[...log].reverse().map((entry, i) => (
                <li key={i} className="animate-rise flex items-start gap-3 p-3" style={{ borderRadius: 16, background: 'var(--color-panel-2)' }}>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{entry.text}</span>
                    <span className="block text-sm text-muted">
                      {entry.at} · {entry.region}
                    </span>
                  </span>
                  {entry.points > 0 && (
                    <span
                      className="inline-flex shrink-0 items-center gap-1 px-2 py-0.5"
                      style={{ borderRadius: 999, background: GOLD, color: ON_GOLD, fontSize: 12.5, fontWeight: 750 }}
                    >
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
