import { useEffect, useMemo, useRef, useState } from 'react'
import { btnPrimary, btnSecondary, linkBtn } from '../components/ui'
import { addMeasurements, removeMeasurements } from '../db/repo'
import {
  MISSION_DAYS_BEFORE_REPLAY,
  buildLedger,
  donkiEventCount,
  loadReplays,
  replayMeasurementId,
  replayMeasurements,
  replaySources,
  shelterPromptAt,
  startingDoseMSv,
  stepDoseRates,
  type Replay,
} from '../lib/radiation'
import { useApp } from '../state/AppContext'

const REPLAYS = loadReplays()
const SOURCES = replaySources()
const PLAY_INTERVAL_MS = 400

const eventDate = (r: Replay) => new Date(r.onset).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
const utc = (ms: number) => new Date(ms).toISOString().slice(0, 16).replace('T', ' ') + ' UTC'
const relative = (hours: number) => (hours === 0 ? 'Event onset' : hours < 0 ? `${-hours} h before onset` : `${hours} h after onset`)
const mSv = (v: number) => `${v.toFixed(2)} mSv`
const sig = (v: number) => Number(v.toPrecision(3)).toString()

export function Radiation() {
  const { crewId, currentCrew, go, refresh } = useApp()
  const [replayId, setReplayId] = useState(REPLAYS[0]?.id ?? '')
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [started, setStarted] = useState(false)
  const [shelterStep, setShelterStep] = useState<number | null>(null)
  // The remapped time of the last replay step. Fixed when a replay starts so steps keep stable timestamps.
  const [endMs, setEndMs] = useState(() => Date.now())

  const replay = REPLAYS.find((r) => r.id === replayId) ?? REPLAYS[0]
  const total = replay ? replay.doseRateMGyPerH.length : 0
  const ledger = useMemo(() => (replay ? buildLedger(replay, total) : []), [replay, total])
  const rates = useMemo(() => (replay ? stepDoseRates(replay) : []), [replay])
  const onsetStep = replay ? shelterPromptAt(replay) : 0

  const restart = (nextReplayId = replayId) => {
    setReplayId(nextReplayId)
    setStep(0)
    setPlaying(false)
    setShelterStep(null)
    setEndMs(Date.now())
  }

  // A different crew member gets a fresh replay.
  const [seenCrew, setSeenCrew] = useState(crewId)
  if (seenCrew !== crewId) {
    setSeenCrew(crewId)
    setStep(0)
    setPlaying(false)
    setStarted(false)
    setShelterStep(null)
  }

  useEffect(() => {
    if (!playing) return
    const timer = setInterval(() => setStep((s) => Math.min(s + 1, total - 1)), PLAY_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [playing, total])

  if (playing && step >= total - 1) setPlaying(false)

  // Keep the stored radiationDose records in step with the timeline, one write at a time.
  const queue = useRef<Promise<void>>(Promise.resolve())
  const written = useRef<{ key: string; step: number }>({ key: '', step: -1 })
  useEffect(() => {
    if (!started || !replay) return
    const key = `${crewId}|${replay.id}|${endMs}`
    queue.current = queue.current.then(async () => {
      if (written.current.key !== key) {
        await removeMeasurements(Array.from({ length: total }, (_, i) => replayMeasurementId(crewId, i)))
        written.current = { key, step: -1 }
      }
      const done = written.current.step
      if (step > done) await addMeasurements(replayMeasurements({ replay, ledger, crewId, fromStep: done + 1, toStep: step, endMs }))
      else if (step < done) await removeMeasurements(Array.from({ length: done - step }, (_, i) => replayMeasurementId(crewId, step + 1 + i)))
      written.current = { key, step }
      refresh()
    })
  }, [started, replay, ledger, total, crewId, step, endMs, refresh])

  if (!replay) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-8">
        <h1 className="text-2xl font-semibold tracking-tight">Radiation replay</h1>
        <p className="mt-3 text-sm text-muted">No replay data is bundled. Run node scripts/fetch-donki.ts and rebuild.</p>
      </main>
    )
  }

  const move = (next: number) => {
    setStarted(true)
    setStep(Math.max(0, Math.min(next, total - 1)))
  }
  const startMs = Date.parse(replay.start)
  const stepMs = replay.stepMinutes * 60_000
  const start = startingDoseMSv(replay)
  const now = ledger[step] ?? start
  const atOnset = onsetStep > 0 ? ledger[onsetStep - 1] : start
  const eventActive = step >= onsetStep
  const flux = replay.protonFluxPfu[step]
  const measured = replay.doseRateMGyPerH[step] !== null

  return (
    <main className="mx-auto w-full max-w-5xl space-y-8 px-4 py-8 sm:px-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Radiation replay</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted">
          A replay of a real, historical solar particle event on a <strong className="text-ink">simulated vehicle</strong>. The event and the dose rates are NASA measurements. The
          dose ledger is a <strong className="text-ink">simulation, not dosimetry</strong>: nobody on this crew received this dose.
        </p>
      </header>

      <section aria-labelledby="event-heading">
        <h2 id="event-heading" className="text-sm font-semibold uppercase tracking-[0.14em] text-muted">
          Historical event
        </h2>
        <div className="mt-3 flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1 text-sm text-muted">
            Event to replay
            <select
              className="rounded-sm border border-rule bg-panel px-2 py-2 text-sm text-ink"
              value={replay.id}
              onChange={(e) => {
                setStarted(false)
                restart(e.target.value)
              }}
            >
              {REPLAYS.map((r) => (
                <option key={r.id} value={r.id}>
                  {eventDate(r)}
                </option>
              ))}
            </select>
          </label>
          <p className="text-sm text-muted">
            DONKI record <span className="text-ink">{replay.id}</span>, first near-Earth report {utc(Date.parse(replay.onset))}.
          </p>
        </div>
        <p className="mt-2 text-sm text-muted">
          Reported by: {replay.instruments.join('; ')}. One of {donkiEventCount()} solar particle events in NASA DONKI ({SOURCES.events.range.join(' to ')}).
        </p>
      </section>

      <section aria-labelledby="timeline-heading" className="border-y border-rule py-5">
        <h2 id="timeline-heading" className="text-sm font-semibold uppercase tracking-[0.14em] text-muted">
          Timeline
        </h2>
        <p className="mt-3 text-lg font-medium" aria-live="polite">
          {relative(step - onsetStep)} <span className="text-sm font-normal text-muted">({utc(startMs + step * stepMs)})</span>
        </p>
        <input
          type="range"
          min={0}
          max={total - 1}
          value={step}
          onChange={(e) => {
            setPlaying(false)
            move(Number(e.target.value))
          }}
          aria-label="Replay position in hours"
          aria-valuetext={`${relative(step - onsetStep)}, hour ${step + 1} of ${total}`}
          className="mt-3 w-full accent-[var(--color-accent)]"
        />
        <div className="mt-3 flex flex-wrap gap-3">
          <button
            className={btnPrimary}
            onClick={() => {
              if (!playing && step >= total - 1) restart()
              setStarted(true)
              setPlaying((p) => !p)
            }}
          >
            {playing ? 'Pause' : step >= total - 1 ? 'Replay again' : 'Play'}
          </button>
          <button className={btnSecondary} disabled={step === 0} onClick={() => (setPlaying(false), move(step - 1))}>
            Back 1 h
          </button>
          <button className={btnSecondary} disabled={step >= total - 1} onClick={() => (setPlaying(false), move(step + 1))}>
            Forward 1 h
          </button>
          <button className={btnSecondary} disabled={step === onsetStep} onClick={() => (setPlaying(false), move(onsetStep))}>
            Jump to onset
          </button>
          <button className={btnSecondary} disabled={step === 0 && !started} onClick={() => restart()}>
            Restart
          </button>
        </div>
      </section>

      {eventActive && (
        <section role="alert" aria-labelledby="shelter-heading" className="border-2 border-act bg-panel p-5">
          <h2 id="shelter-heading" className="text-lg font-semibold tracking-tight">
            Act: solar particle event in progress. Move to the shelter area now.
          </h2>
          <p className="mt-2 text-sm">
            Radiation levels outside the shelter are rising. Stop what you are doing, tell your crewmates, and stay in the shelter until the event is declared over.
          </p>
          {shelterStep === null || shelterStep > step ? (
            <button className={`${btnPrimary} mt-4`} onClick={() => setShelterStep(step)}>
              We are in the shelter
            </button>
          ) : (
            <p className="mt-4 text-sm font-medium">
              Shelter reached {shelterStep === onsetStep ? 'in the first hour of the event' : `${shelterStep - onsetStep} h after the prompt`}. This ledger does not model the
              shelter's shielding.
            </p>
          )}
        </section>
      )}

      <section aria-labelledby="ledger-heading">
        <h2 id="ledger-heading" className="text-sm font-semibold uppercase tracking-[0.14em] text-muted">
          Dose ledger for {currentCrew?.name ?? 'this crew member'} <span className="text-ink">(simulation)</span>
        </h2>
        <div className="mt-4 grid gap-8 md:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="text-5xl font-semibold tracking-tight">{now.toFixed(2)}</p>
            <p className="text-sm text-muted">mSv, simulated cumulative dose</p>
            <dl className="mt-5 divide-y divide-rule border-y border-rule text-sm">
              <LedgerRow label={`On the ledger before the replay (${MISSION_DAYS_BEFORE_REPLAY} mission days at the quiet rate)`} value={mSv(start)} />
              <LedgerRow label="Added in the replay before the event" value={mSv(Math.min(now, atOnset) - start)} />
              <LedgerRow label="Added since the event began" value={mSv(Math.max(now - atOnset, 0))} />
              <LedgerRow label={`Dose rate this hour${measured ? '' : ' (no measurement, last rate held)'}`} value={`${sig(rates[step])} mGy/h`} />
              <LedgerRow label="Proton flux near Earth this hour, above 10 MeV" value={typeof flux === 'number' ? `${sig(flux)} pfu` : 'No measurement'} />
            </dl>
            <button className={`${linkBtn} mt-4`} onClick={() => go('bodymap')}>
              See Whole body on the body map
            </button>
          </div>
          <LedgerChart ledger={ledger} start={start} step={step} onsetStep={onsetStep} />
        </div>
      </section>

      {eventActive && (
        <section aria-labelledby="followup-heading">
          <h2 id="followup-heading" className="text-sm font-semibold uppercase tracking-[0.14em] text-muted">
            Follow-up
          </h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">
            <li>
              Report how you feel now, even if you feel fine. An early report is the comparison point for later ones.{' '}
              <button className={linkBtn} onClick={() => go('mirror')}>
                Start a check-in (includes the symptom report)
              </button>
            </li>
            <li>Check in again later in the event and after it ends, so any change shows against your own earlier answers.</li>
            <li>Symptoms to watch for after a radiation event: [CONTENT TODO] (needs a NASA source before we list any).</li>
          </ol>
        </section>
      )}

      <section aria-labelledby="assumptions-heading" className="border-t border-rule pt-5">
        <h2 id="assumptions-heading" className="text-sm font-semibold uppercase tracking-[0.14em] text-muted">
          How the simulated dose is calculated
        </h2>
        <p className="mt-3 text-sm">
          Dose = starting dose + sum, for each replay hour, of (measured dose rate in mGy/h x 1 hour x 1 mSv per mGy).
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">
          <li>
            Dose rate: {SOURCES.doseRate.name}. It was measured in lunar orbit and is applied unchanged to the simulated vehicle, whatever environment is selected. A real vehicle's
            shielding would change it.
          </li>
          <li>1 mGy is counted as 1 mSv. No radiation quality factor is applied, so this is not a dose equivalent.</li>
          <li>
            Starting dose: the quiet dose rate measured in the 24 hours before the event ({sig(replay.quietRateMGyPerH)} mGy/h) for {MISSION_DAYS_BEFORE_REPLAY} assumed mission
            days.
          </li>
          <li>An hour with no measurement repeats the last measured rate. Taking shelter does not change the ledger.</li>
          <li>Proton flux: {SOURCES.protonFlux.name}. Shown for context only; it is not used in the dose.</li>
          <li>Replay hours are stored with times ending now, so the body map and trend chart treat the replay as the latest readings.</li>
        </ul>
        <p className="mt-3 text-sm text-muted">
          Event record:{' '}
          <a className={`${linkBtn} max-w-full whitespace-normal break-all text-left`} href={replay.link} target="_blank" rel="noreferrer">
            {replay.link}
          </a>
        </p>
      </section>
    </main>
  )
}

function LedgerRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="text-muted">{label}</dt>
      <dd className="whitespace-nowrap font-medium">{value}</dd>
    </div>
  )
}

/** Cumulative simulated dose over the whole replay window; the dark line is the part replayed so far. */
function LedgerChart({ ledger, start, step, onsetStep }: { ledger: number[]; start: number; step: number; onsetStep: number }) {
  const W = 600
  const H = 220
  const PAD = { left: 48, right: 12, top: 12, bottom: 28 }
  const max = ledger.at(-1) ?? start
  const span = Math.max(max - start, 1e-9)
  const x = (i: number) => PAD.left + (i / Math.max(ledger.length - 1, 1)) * (W - PAD.left - PAD.right)
  const y = (v: number) => H - PAD.bottom - ((v - start) / span) * (H - PAD.top - PAD.bottom)
  const points = (upTo: number) =>
    ledger
      .slice(0, upTo + 1)
      .map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`)
      .join(' ')

  return (
    <figure>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Simulated cumulative dose over the replay: ${start.toFixed(2)} mSv at the start, ${max.toFixed(2)} mSv at the end, ${(ledger[step] ?? start).toFixed(2)} mSv at the current hour.`}
        className="h-auto w-full"
      >
        <line x1={PAD.left} x2={W - PAD.right} y1={y(start)} y2={y(start)} stroke="var(--color-rule)" />
        <line x1={PAD.left} x2={W - PAD.right} y1={y(max)} y2={y(max)} stroke="var(--color-rule)" strokeDasharray="2 4" />
        <text x={PAD.left - 6} y={y(start) + 4} textAnchor="end" fontSize="11" fill="var(--color-muted)">
          {start.toFixed(1)}
        </text>
        <text x={PAD.left - 6} y={y(max) + 4} textAnchor="end" fontSize="11" fill="var(--color-muted)">
          {max.toFixed(1)}
        </text>
        <line x1={x(onsetStep)} x2={x(onsetStep)} y1={PAD.top} y2={H - PAD.bottom} stroke="var(--color-ink)" strokeDasharray="4 3" />
        <text x={x(onsetStep) + 5} y={PAD.top + 10} fontSize="11" fill="var(--color-ink)">
          Event onset
        </text>
        <polyline points={points(ledger.length - 1)} fill="none" stroke="var(--color-rule)" strokeWidth="1.5" />
        <polyline points={points(step)} fill="none" stroke="var(--color-ink)" strokeWidth="2.25" />
        <circle cx={x(step)} cy={y(ledger[step] ?? start)} r="4.5" fill="var(--color-accent)" />
        <text x={PAD.left} y={H - 8} fontSize="11" fill="var(--color-muted)">
          24 h before
        </text>
        <text x={W - PAD.right} y={H - 8} textAnchor="end" fontSize="11" fill="var(--color-muted)">
          {ledger.length - onsetStep - 1} h after
        </text>
      </svg>
      <figcaption className="mt-1 text-xs text-muted">Simulated cumulative dose in mSv. The gray line is the rest of the event, not yet replayed.</figcaption>
    </figure>
  )
}
