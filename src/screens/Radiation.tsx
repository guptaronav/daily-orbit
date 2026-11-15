import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
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
import * as D from '../proto/data'
import { openEscalation } from '../proto/EscalationAdvice'
import { openSection } from '../proto/Sections'

const REPLAYS = loadReplays()
const SOURCES = replaySources()
const PLAY_INTERVAL_MS = 400

const eventDate = (r: Replay) => new Date(r.onset).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
const utc = (ms: number) => new Date(ms).toISOString().slice(0, 16).replace('T', ' ') + ' UTC'
const relative = (hours: number) => (hours === 0 ? 'Event onset' : hours < 0 ? `${-hours} h before onset` : `${hours} h after onset`)
const mSv = (v: number) => `${v.toFixed(2)} mSv`
const sig = (v: number) => Number(v.toPrecision(3)).toString()

/*
 * Radiation replay (Evode): a real NASA solar particle event, hour by hour, on a simulated vehicle.
 * The replay logic and the NASA data handling are unchanged; this file draws it in the site's style
 * and ties it in: the career budget (as on Body's five hazards), a shelter alert that can tell the
 * crew medical officer, Ask Orbit for questions, and the replayed doses saved as readings on Body.
 */
const card = { borderRadius: 26, background: 'var(--panel)', border: '1px solid var(--rule)', padding: 20, display: 'grid', alignContent: 'start' } as const
const kicker = { margin: 0, fontSize: 12, fontWeight: 750, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--muted)' } as const
const ghost = (off: boolean) => ({ minHeight: 44, padding: '0 14px', borderRadius: 13, border: '1.5px solid var(--rule-strong)', background: 'var(--panel)', color: off ? 'var(--muted)' : 'var(--ink)', fontWeight: 700, cursor: off ? 'not-allowed' : 'pointer', opacity: off ? 0.55 : 1 }) as const
const link = { border: 0, background: 'transparent', padding: 0, color: 'var(--accent)', textDecoration: 'underline', cursor: 'pointer', font: 'inherit', fontWeight: 650 } as const

export function Radiation({ embedded = false }: { embedded?: boolean } = {}) {
  const { crewId, currentCrew, go, refresh } = useApp()
  const [replayId, setReplayId] = useState(REPLAYS[0]?.id ?? '')
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [started, setStarted] = useState(false)
  const [shelterStep, setShelterStep] = useState<number | null>(null)
  const [shelterCoins, setShelterCoins] = useState(0)
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
      <main style={{ width: '100%', maxWidth: 1320, margin: '0 auto', padding: '28px clamp(16px, 3vw, 32px) 72px', boxSizing: 'border-box' }}>
        <h1 style={{ margin: 0, fontSize: 'clamp(36px, 5vw, 60px)', fontWeight: 750, letterSpacing: '-0.05em' }}>Radiation replay</h1>
        <p style={{ margin: '12px 0 0', color: 'var(--muted)' }}>No replay data is bundled. Run node scripts/fetch-donki.ts and rebuild.</p>
      </main>
    )
  }

  // End the replay and take its readings off Body, so a demo storm does not linger in the data.
  const clearReplay = () => {
    setPlaying(false)
    setStarted(false)
    queue.current = queue.current.then(async () => {
      await removeMeasurements(Array.from({ length: total }, (_, i) => replayMeasurementId(crewId, i)))
      written.current = { key: '', step: -1 }
      refresh()
    })
    restart()
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
  const budget = D.radiationBudget(crewId) as { used: number; limit: number; daysLeft: number; status: string; rate: number }
  const name = currentCrew?.name ?? 'this crew member'
  // What the storm itself added, in terms people can weigh: days of the quiet background rate, and
  // the share of NASA's 600 mSv career limit.
  const added = Math.max(now - atOnset, 0)
  const quietPerDay = Math.max(replay.quietRateMGyPerH, 0) * 24
  const daysEquivalent = quietPerDay > 0 ? added / quietPerDay : 0
  const shareOfLimit = (added / budget.limit) * 100
  const pct = Math.min(100, (budget.used / budget.limit) * 100)

  return (
    <Wrap embedded={embedded}>
      {/* Hero: what this is, and where this crew member stands on the career limit */}
      <section style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'stretch', animation: 'lg-rise 520ms cubic-bezier(.22,1,.36,1) both' }}>
        <div style={{ flex: '2 1 520px', display: 'grid', gap: 14, alignContent: 'end' }}>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)' }}>Radiation · {name}</p>
          {embedded ? (
            <h2 id="radiation-replay-heading" style={{ margin: 0, fontSize: 'clamp(28px, 3.6vw, 44px)', lineHeight: 1, fontWeight: 750, letterSpacing: '-0.04em' }}>Ride out a real solar storm.</h2>
          ) : (
            <h1 style={{ margin: 0, fontSize: 'clamp(38px, 5.4vw, 68px)', lineHeight: 0.95, fontWeight: 750, letterSpacing: '-0.05em' }}>Ride out a real solar storm.</h1>
          )}
          <p style={{ margin: 0, maxWidth: '62ch', fontSize: 16, lineHeight: 1.55, color: 'var(--ink-soft)' }}>
            Replay a historical solar particle event on a <strong>simulated vehicle</strong>. The event and the dose rates are NASA measurements; the dose ledger is a{' '}
            <strong>simulation, not dosimetry</strong>, so nobody on this crew received this dose.
          </p>
        </div>
        {!embedded && <aside aria-label="Career radiation budget" style={{ flex: '1 1 300px', padding: 22, borderRadius: 28, background: '#14181f', color: '#f3f1ea', display: 'grid', gap: 12, alignContent: 'start' }}>
          <p style={{ ...kicker, color: '#f6c445' }}>Career budget</p>
          <p style={{ margin: 0, display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 40, fontWeight: 750, letterSpacing: '-0.04em' }}>{Math.round(budget.used)}</span>
            <span style={{ color: 'rgba(243,241,234,.7)' }}>of {budget.limit} mSv</span>
          </p>
          <div role="progressbar" aria-label="Career dose against NASA's limit" aria-valuemin={0} aria-valuemax={budget.limit} aria-valuenow={Math.round(budget.used)} style={{ height: 8, borderRadius: 99, background: 'rgba(243,241,234,.14)', overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: budget.status === 'red' ? 'var(--act)' : budget.status === 'yellow' ? '#f6c445' : '#7ef0c5' }} />
          </div>
          <span style={{ fontSize: 13.5, color: 'rgba(243,241,234,.78)' }}>About {Math.round(budget.daysLeft)} days left at the current rate. NASA's career limit is 600 mSv.</span>
          <button type="button" onClick={() => openSection('body', 'hazards')} style={{ justifySelf: 'start', minHeight: 36, padding: '0 12px', borderRadius: 10, border: '1.5px solid rgba(243,241,234,.4)', background: 'transparent', color: '#f3f1ea', fontWeight: 700, cursor: 'pointer' }}>
            See the five hazards
          </button>
        </aside>}
      </section>

      {/* The event and the timeline */}
      <section aria-labelledby="event-heading" style={{ ...card, gap: 14 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: '10px 18px' }}>
          <label style={{ display: 'grid', gap: 4, fontSize: 13, fontWeight: 650, color: 'var(--muted)' }}>
            <span id="event-heading">Event to replay</span>
            <select
              value={replay.id}
              onChange={(e) => {
                setStarted(false)
                restart(e.target.value)
              }}
              style={{ minHeight: 42, padding: '0 12px', borderRadius: 12, border: '1.5px solid var(--rule-strong)', background: 'var(--panel)', color: 'var(--ink)', font: 'inherit', fontSize: 15 }}
            >
              {REPLAYS.map((r) => (
                <option key={r.id} value={r.id}>
                  {eventDate(r)}
                </option>
              ))}
            </select>
          </label>
          <p style={{ margin: 0, flex: '1 1 320px', fontSize: 13.5, color: 'var(--muted)' }}>
            NASA DONKI record <strong style={{ color: 'var(--ink)' }}>{replay.id}</strong>, first near-Earth report {utc(Date.parse(replay.onset))}. Reported by {replay.instruments.join('; ')}. One of {donkiEventCount()} solar particle events in DONKI ({SOURCES.events.range.join(' to ')}).
          </p>
        </div>

        <div style={{ display: 'grid', gap: 8, padding: 16, borderRadius: 18, background: 'var(--panel-2)' }}>
          <p aria-live="polite" style={{ margin: 0, display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 8 }}>
            <strong style={{ fontSize: 22, letterSpacing: '-0.02em', color: eventActive ? 'var(--act-ink)' : 'var(--ink)' }}>{relative(step - onsetStep)}</strong>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>{utc(startMs + step * stepMs)}</span>
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
            style={{ width: '100%', accentColor: eventActive ? 'var(--act)' : 'var(--accent)' }}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <button
              type="button"
              className="fw-press"
              onClick={() => {
                if (!playing && step >= total - 1) restart()
                setStarted(true)
                setPlaying((p) => !p)
              }}
              style={{ minHeight: 44, padding: '0 20px', borderRadius: 13, border: 0, background: '#14181f', color: '#f3f1ea', boxShadow: '0 4px 0 #000', fontWeight: 800, cursor: 'pointer' }}
            >
              {playing ? 'Pause' : step >= total - 1 ? 'Replay again' : 'Play'}
            </button>
            <button type="button" disabled={step === 0} onClick={() => (setPlaying(false), move(step - 1))} style={ghost(step === 0)}>
              Back 1 h
            </button>
            <button type="button" disabled={step >= total - 1} onClick={() => (setPlaying(false), move(step + 1))} style={ghost(step >= total - 1)}>
              Forward 1 h
            </button>
            <button type="button" disabled={step === onsetStep} onClick={() => (setPlaying(false), move(onsetStep))} style={ghost(step === onsetStep)}>
              Jump to onset
            </button>
            <button type="button" disabled={step === 0 && !started} onClick={() => restart()} style={ghost(step === 0 && !started)}>
              Restart
            </button>
            {started && (
              <button type="button" onClick={clearReplay} style={{ ...ghost(false), border: 0, background: 'transparent', color: 'var(--accent)', textDecoration: 'underline' }}>
                End and clear its readings from Body
              </button>
            )}
          </div>
        </div>
      </section>

      {eventActive && (
        <section role="alert" aria-labelledby="shelter-heading" style={{ display: 'grid', gap: 10, padding: '18px 20px', borderRadius: 24, background: 'rgba(179,38,30,.08)', border: '2px solid var(--act)' }}>
          <h2 id="shelter-heading" style={{ margin: 0, fontSize: 20, fontWeight: 750, letterSpacing: '-0.02em', color: 'var(--act-ink)' }}>
            Act: solar particle event in progress. Move to the shelter area now.
          </h2>
          <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.5 }}>Radiation levels outside the shelter are rising. Stop what you are doing, tell your crewmates, and stay in the shelter until the event is declared over.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            {shelterStep === null || shelterStep > step ? (
              <button type="button" className="fw-press" onClick={() => {
                  setShelterStep(step)
                  setShelterCoins(D.recordShelter(crewId) as number)
                }} style={{ minHeight: 44, padding: '0 18px', borderRadius: 13, border: 0, background: 'var(--act)', color: 'var(--paper)', boxShadow: '0 4px 0 #6e1712', fontWeight: 800, cursor: 'pointer' }}>
                We are in the shelter
              </button>
            ) : (
              <strong style={{ fontSize: 14.5 }}>
                Shelter reached {shelterStep === onsetStep ? 'in the first hour of the event' : `${shelterStep - onsetStep} h after the prompt`}. The ledger does not model the shelter's shielding.
                {shelterCoins > 0 && <span style={{ marginLeft: 8, color: '#a8740a' }}>+{shelterCoins} coins for a care step</span>}
              </strong>
            )}
            <button type="button" onClick={() => openEscalation({ title: 'Solar particle event: crew sheltering', detail: `Replay of DONKI ${replay.id}; simulated dose ${now.toFixed(2)} mSv so far.`, status: 'red' })} style={ghost(false)}>
              Tell the crew medical officer
            </button>
          </div>
        </section>
      )}

      {/* The dose ledger */}
      <section aria-labelledby="ledger-heading" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 16, alignItems: 'start' }}>
        <div style={{ ...card, gap: 10 }}>
          <p id="ledger-heading" style={kicker}>
            Dose ledger · {name} (simulation)
          </p>
          <p style={{ margin: 0, display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 48, fontWeight: 750, letterSpacing: '-0.04em' }}>{now.toFixed(2)}</span>
            <span style={{ color: 'var(--muted)' }}>mSv, simulated cumulative dose</span>
          </p>
          <dl style={{ margin: 0, display: 'grid' }}>
            <LedgerRow label={`Before the replay (${MISSION_DAYS_BEFORE_REPLAY} mission days at the quiet rate)`} value={mSv(start)} />
            <LedgerRow label="Added in the replay before the event" value={mSv(Math.min(now, atOnset) - start)} />
            <LedgerRow label="Added since the event began" value={mSv(Math.max(now - atOnset, 0))} />
            <LedgerRow label={`Dose rate this hour${measured ? '' : ' (no measurement, last rate held)'}`} value={`${sig(rates[step])} mGy/h`} />
            <LedgerRow label="Proton flux near Earth this hour, above 10 MeV" value={typeof flux === 'number' ? `${sig(flux)} pfu` : 'No measurement'} />
          </dl>
          {added > 0 && (
            <div style={{ padding: '10px 12px', borderRadius: 14, background: 'rgba(179,38,30,.07)', border: '1px solid rgba(179,38,30,.3)', fontSize: 14, lineHeight: 1.5 }}>
              <strong>This storm has added {added.toFixed(2)} mSv</strong>: as much as about {daysEquivalent < 10 ? daysEquivalent.toFixed(1) : Math.round(daysEquivalent)} days of the quiet background before it, and {shareOfLimit < 1 ? shareOfLimit.toFixed(2) : shareOfLimit.toFixed(1)}% of NASA's 600 mSv career limit.
            </div>
          )}
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>
            Each replayed hour is saved as a radiation dose reading, so it shows on{' '}
            <button type="button" onClick={() => openSection('body', 'readings')} style={link}>
              Body
            </button>{' '}
            and counts toward the career budget above.
          </span>
        </div>
        <div style={{ ...card }}>
          <p style={kicker}>Cumulative dose over the event</p>
          <LedgerChart ledger={ledger} start={start} step={step} onsetStep={onsetStep} />
        </div>
      </section>

      {eventActive && (
        <section aria-labelledby="followup-heading" style={{ ...card, gap: 10 }}>
          <p id="followup-heading" style={kicker}>
            Follow-up
          </p>
          <ol style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 8, fontSize: 14.5, lineHeight: 1.5 }}>
            <li>
              Report how you feel now, even if you feel fine: an early report is the comparison point for later ones.{' '}
              <button type="button" onClick={() => go('mirror')} style={link}>
                Start a check-in
              </button>
            </li>
            <li>Check in again later in the event and after it ends, so any change shows against your own earlier answers.</li>
            <li>
              Questions about radiation and your health:{' '}
              <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('orbit:ask', { detail: 'Why does radiation matter?' }))} style={link}>
                ask Orbit
              </button>
              , which answers only from the app's NASA sources.
            </li>
          </ol>
        </section>
      )}

      <details style={{ ...card, display: 'block' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: 15 }}>How the simulated dose is calculated</summary>
        <div style={{ display: 'grid', gap: 10, marginTop: 12, fontSize: 14, lineHeight: 1.55 }}>
          <p style={{ margin: 0 }}>Dose = starting dose + sum, for each replay hour, of (measured dose rate in mGy/h × 1 hour × 1 mSv per mGy).</p>
          <ul style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 4, color: 'var(--ink-soft)' }}>
            <li>Dose rate: {SOURCES.doseRate.name}. Measured in lunar orbit and applied unchanged to the simulated vehicle, whatever environment is selected. A real vehicle's shielding would change it.</li>
            <li>1 mGy is counted as 1 mSv. No radiation quality factor is applied, so this is not a dose equivalent.</li>
            <li>
              Starting dose: the quiet dose rate measured in the 24 hours before the event ({sig(replay.quietRateMGyPerH)} mGy/h) for {MISSION_DAYS_BEFORE_REPLAY} assumed mission days.
            </li>
            <li>An hour with no measurement repeats the last measured rate. Taking shelter does not change the ledger.</li>
            <li>Proton flux: {SOURCES.protonFlux.name}. Shown for context only; it is not used in the dose.</li>
            <li>Replay hours are stored with times ending now, so the body map and trend chart treat the replay as the latest readings.</li>
          </ul>
          <p style={{ margin: 0, color: 'var(--muted)' }}>
            Event record:{' '}
            <a href={replay.link} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', wordBreak: 'break-all' }}>
              {replay.link}
            </a>
          </p>
        </div>
      </details>
    </Wrap>
  )
}

function LedgerRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, padding: '8px 0', borderTop: '1px solid var(--rule)', fontSize: 14 }}>
      <dt style={{ color: 'var(--muted)' }}>{label}</dt>
      <dd style={{ margin: 0, whiteSpace: 'nowrap', fontWeight: 700 }}>{value}</dd>
    </div>
  )
}

/** Cumulative simulated dose over the whole replay window; the dark line is the part replayed so far. */
function LedgerChart({ ledger, start, step, onsetStep }: { ledger: number[]; start: number; step: number; onsetStep: number }) {
  const W = 600
  const H = 240
  const PAD = { left: 48, right: 12, top: 16, bottom: 28 }
  const max = ledger.at(-1) ?? start
  const span = Math.max(max - start, 1e-9)
  const x = (i: number) => PAD.left + (i / Math.max(ledger.length - 1, 1)) * (W - PAD.left - PAD.right)
  const y = (v: number) => H - PAD.bottom - ((v - start) / span) * (H - PAD.top - PAD.bottom)
  const points = (upTo: number) =>
    ledger
      .slice(0, upTo + 1)
      .map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`)
      .join(' ')
  const area = `${x(0).toFixed(1)},${y(start).toFixed(1)} ${points(step)} ${x(step).toFixed(1)},${y(start).toFixed(1)}`

  return (
    <figure style={{ margin: 0 }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Simulated cumulative dose over the replay: ${start.toFixed(2)} mSv at the start, ${max.toFixed(2)} mSv at the end, ${(ledger[step] ?? start).toFixed(2)} mSv at the current hour.`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        <line x1={PAD.left} x2={W - PAD.right} y1={y(start)} y2={y(start)} stroke="var(--rule)" />
        <line x1={PAD.left} x2={W - PAD.right} y1={y(max)} y2={y(max)} stroke="var(--rule)" strokeDasharray="2 4" />
        <text x={PAD.left - 6} y={y(start) + 4} textAnchor="end" fontSize="11" fill="var(--muted)">
          {start.toFixed(1)}
        </text>
        <text x={PAD.left - 6} y={y(max) + 4} textAnchor="end" fontSize="11" fill="var(--muted)">
          {max.toFixed(1)}
        </text>
        <rect x={x(onsetStep)} y={PAD.top} width={W - PAD.right - x(onsetStep)} height={H - PAD.top - PAD.bottom} fill="var(--act)" opacity="0.06" />
        <line x1={x(onsetStep)} x2={x(onsetStep)} y1={PAD.top} y2={H - PAD.bottom} stroke="var(--act)" strokeDasharray="4 3" />
        <text x={x(onsetStep) + 6} y={PAD.top + 12} fontSize="11.5" fontWeight="700" fill="var(--act-ink)">
          Event onset
        </text>
        <polygon points={area} fill="var(--accent)" opacity="0.1" />
        <polyline points={points(ledger.length - 1)} fill="none" stroke="var(--rule-strong)" strokeWidth="1.5" strokeDasharray="3 3" />
        <polyline points={points(step)} fill="none" stroke="var(--ink)" strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx={x(step)} cy={y(ledger[step] ?? start)} r="6" fill="#f6c445" stroke="var(--ink)" strokeWidth="1.5" />
        <text x={PAD.left} y={H - 8} fontSize="11" fill="var(--muted)">
          24 h before
        </text>
        <text x={W - PAD.right} y={H - 8} textAnchor="end" fontSize="11" fill="var(--muted)">
          {ledger.length - onsetStep - 1} h after
        </text>
      </svg>
      <figcaption style={{ marginTop: 4, fontSize: 12.5, color: 'var(--muted)' }}>Simulated cumulative dose in mSv. The dashed line is the rest of the event, not yet replayed.</figcaption>
    </figure>
  )
}

/** A page of its own, or (embedded) a section of Body's Five hazards tab. */
function Wrap({ embedded, children }: { embedded: boolean; children: ReactNode }) {
  if (embedded)
    return (
      <section id="radiation-replay" aria-labelledby="radiation-replay-heading" style={{ display: 'grid', gap: 20, scrollMarginTop: 170, paddingTop: 8 }}>
        {children}
      </section>
    )
  return <main style={{ width: '100%', maxWidth: 1320, margin: '0 auto', padding: '28px clamp(16px, 3vw, 32px) 72px', boxSizing: 'border-box', display: 'grid', gap: 20 }}>{children}</main>
}
