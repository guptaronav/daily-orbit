import { useEffect, useState } from 'react'
import { Icon, type IconName } from '../components/kit/Icon'
import { StatusDot } from '../components/StatusDot'
import { listMeasurements } from '../db/repo'
import { formatDelay } from '../lib/environments'
import { buildPacket, packetFilename, type Packet } from '../lib/packet'
import { useApp } from '../state/AppContext'

type Rung = { n: string; tag: string; title: string; when: string; icon: IconName }

// Generic wording only. No clinical thresholds, no numbers: when in doubt, go up a rung.
const RUNGS: Rung[] = [
  {
    n: '01',
    tag: 'You',
    title: 'Self-care',
    when: 'A reading moved a little and you already know what would help: rest, water, the scheduled exercise session, or simply retaking a reading the app could not trust.',
    icon: 'check',
  },
  {
    n: '02',
    tag: 'A crewmate',
    title: 'Crewmate check',
    when: 'You want a second pair of eyes. Ask a crewmate to look at the same reading, or run the mirror check alongside you so you can compare.',
    icon: 'eye',
  },
  {
    n: '03',
    tag: 'Onboard',
    title: 'Crew medical officer',
    when: 'The change has stayed for more than a day or two, more than one indicator moved together, or you feel worse than the numbers suggest. The medical officer has the training and the onboard kit.',
    icon: 'heart',
  },
  {
    n: '04',
    tag: 'Ground',
    title: 'Flight surgeon',
    when: 'The crew wants ground input. Send the change summary below, then keep going with onboard care while it crosses the gap: the answer cannot arrive sooner than the comm delay allows.',
    icon: 'send',
  },
]

const pad = (n: number) => String(n).padStart(2, '0')
const mmss = (sec: number) => `${pad(Math.floor(sec / 60))}:${pad(sec % 60)}`

function download(packet: Packet, crewId: string, now: Date) {
  const blob = new Blob([packet.json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = packetFilename(crewId, now)
  a.click()
  URL.revokeObjectURL(url)
}

type Transmission = { remaining: number; delaySec: number; arrivalText: string }

/**
 * Counts one simulated transmission down from the one-way delay. A transmission started under a
 * different delay is discarded during render, so changing environment mid-countdown cannot leave
 * a stale clock on screen.
 */
function useTransmission(delaySec: number) {
  const [sent, setSent] = useState<Transmission | null>(null)
  const active = sent && sent.delaySec === delaySec ? sent : null

  useEffect(() => {
    if (active === null || active.remaining <= 0) return
    const timer = setInterval(() => setSent((s) => (s === null ? null : { ...s, remaining: Math.max(0, s.remaining - 1) })), 1000)
    return () => clearInterval(timer)
  }, [active])

  const send = () => {
    const seconds = Math.round(delaySec)
    setSent({ remaining: seconds, delaySec, arrivalText: new Date(Date.now() + seconds * 1000).toLocaleTimeString() })
  }

  return { transmission: active, send, cancel: () => setSent(null) }
}

/**
 * Ship, gap, ground. The pulse sits at however far the packet has travelled, derived from the
 * countdown rather than animated on its own, so the picture can never disagree with the clock.
 */
function SignalPath({ progress, live }: { progress: number; live: boolean }) {
  const pct = Math.min(100, Math.max(0, progress * 100))
  return (
    <div className="flex items-center gap-3" aria-hidden>
      <span className="text-sm font-semibold">Ship</span>
      <div className="relative h-1.5 flex-1 rounded-full" style={{ background: 'var(--color-paper-deep)' }}>
        <span
          className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition-[left] duration-1000 ease-linear"
          style={{
            left: `${pct}%`,
            background: live ? 'var(--color-ink)' : 'var(--color-panel)',
            borderColor: live ? 'var(--color-ink)' : 'var(--color-rule-strong)',
          }}
        />
      </div>
      <span className="text-sm font-semibold">Ground</span>
    </div>
  )
}

export function Escalation() {
  const { crewId, currentCrew, dataVersion, delaySec, environment } = useApp()
  const [built, setBuilt] = useState<{ packet: Packet; now: Date } | null>(null)
  const [rung, setRung] = useState(3)
  const { transmission, send, cancel } = useTransmission(delaySec)
  const remaining = transmission?.remaining ?? null

  // Built in the effect, not in render: one timestamp per data load, shared by the packet and its filename.
  useEffect(() => {
    let cancelled = false
    void listMeasurements(crewId).then((measurements) => {
      if (cancelled) return
      const now = new Date()
      setBuilt({ packet: buildPacket({ crewId, measurements, now }), now })
    })
    return () => {
      cancelled = true
    }
  }, [crewId, dataVersion])

  const packet = built?.packet ?? null
  const total = transmission?.delaySec ?? 0
  const progress = transmission && total > 0 ? (total - transmission.remaining) / total : 0
  const current = RUNGS[rung]

  const stats = [
    { k: 'Packet size', v: packet ? String(packet.bytes) : '—', u: 'bytes' },
    { k: 'One-way delay', v: formatDelay(delaySec), u: '' },
    { k: 'Changes', v: packet ? String(packet.changed.length) : '—', u: 'indicators' },
  ]

  return (
    <main className="mx-auto w-full max-w-[1440px] px-4 pb-10 pt-8 sm:px-8">
      <p className="label">Escalation ladder · {currentCrew?.name}</p>
      <h1 className="display mt-2 text-4xl sm:text-5xl">Who to tell, and when</h1>
      <p className="mt-4 max-w-3xl text-lg leading-relaxed text-ink-soft">
        Four rungs, lowest first. Climb one when the step below has not settled it. No rung is triggered by a number: this app compares you
        with your own baseline and tells you what moved, and the decision stays with the crew.
      </p>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        {/* ---- The ladder ---------------------------------------------------- */}
        <section aria-label="The escalation ladder" className="card p-5">
          <p className="label">The ladder · climb only when the step below has not settled it</p>

          <ol className="mt-4 space-y-2">
            {RUNGS.map((r, i) => {
              const active = i === rung
              return (
                <li key={r.n}>
                  <button
                    onClick={() => setRung(i)}
                    aria-pressed={active}
                    className="card card-action flex w-full items-center gap-4 p-4"
                    style={active ? undefined : { background: 'var(--color-panel-2)' }}
                  >
                    <span
                      aria-hidden
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl"
                      style={
                        active
                          ? { background: 'var(--color-ink)', color: 'var(--color-paper)' }
                          : { background: 'var(--color-paper-deep)', color: 'var(--color-muted)' }
                      }
                    >
                      <Icon name={r.icon} size={19} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-muted">{r.tag}</span>
                      <span className="block text-lg font-bold tracking-tight">{r.title}</span>
                    </span>
                    <span className="label shrink-0 font-semibold">Rung {r.n}</span>
                  </button>
                </li>
              )
            })}
          </ol>
        </section>

        {/* ---- The selected rung, in detail ------------------------------------ */}
        <section aria-live="polite" className="card self-start p-6">
          <p className="label">Rung {current.n} · when to use it</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">{current.title}</h2>
          <p className="mt-3 text-lg leading-relaxed text-ink-soft">{current.when}</p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button className="btn btn-secondary" onClick={() => setRung((r) => Math.max(0, r - 1))} disabled={rung === 0}>
              Step down
            </button>
            <button className="btn btn-primary" onClick={() => setRung((r) => Math.min(RUNGS.length - 1, r + 1))} disabled={rung === RUNGS.length - 1}>
              Climb a rung
              <Icon name="arrowRight" size={15} />
            </button>
          </div>
        </section>
      </div>

      {/* ---- The transmission console --------------------------------------- */}
      <section aria-labelledby="packet-heading" className="card mt-6 p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <p className="label">Rung 04 · ground packet</p>
          <p className="label">{environment.label}</p>
        </div>
        <h2 id="packet-heading" className="mt-2 text-2xl font-bold tracking-tight">
          What would be sent to the flight surgeon
        </h2>

        <dl className="mt-5 grid grid-cols-2 gap-5 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.k}>
              <dt className="label">{s.k}</dt>
              <dd className="value mt-1" style={{ fontSize: '2rem' }}>
                {s.v}
                {s.u && <span className="value-unit"> {s.u}</span>}
              </dd>
            </div>
          ))}
        </dl>

        {packet === null ? (
          <p className="mt-5 text-muted">Loading readings…</p>
        ) : (
          <>
            <p className="mt-5 max-w-3xl leading-relaxed text-muted">
              Only what changed is sent: {currentCrew?.name ?? 'this crew member'} has{' '}
              <span className="font-semibold text-ink">{packet.changed.length}</span> indicator(s) outside their own baseline. Readings that
              failed the quality check are never included.
            </p>

            {packet.changed.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {packet.changed.map((c) => (
                  <li
                    key={c.indicator}
                    className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 rounded-2xl p-3.5"
                    style={{ background: 'var(--color-panel-2)' }}
                  >
                    <span className="font-semibold">{c.label}</span>
                    <span className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.9375rem] text-muted">
                      <span>
                        {c.from} &rarr; <span className="font-bold text-ink">{c.to}</span> {c.unit}
                      </span>
                      <span>
                        {c.deltaPct > 0 ? '+' : ''}
                        {c.deltaPct}%
                      </span>
                      <span>{c.sinceDays === 0 ? 'since today' : `${c.sinceDays} days`}</span>
                      <StatusDot status={c.status} short />
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-4 rounded-2xl p-5" style={{ background: 'var(--color-ok-wash)' }}>
                <p className="font-semibold" style={{ color: 'var(--color-ok-ink)' }}>
                  Nothing to send.
                </p>
                <p className="mt-1 leading-relaxed" style={{ color: 'var(--color-ok-ink)' }}>
                  No indicator with good data is outside this person&rsquo;s own baseline, so the packet carries no changes.
                </p>
              </div>
            )}

            <details className="mt-4">
              <summary className="btn-quiet">Show the exact JSON</summary>
              <pre
                className="mono mt-2 max-h-72 overflow-auto rounded-2xl p-4 text-sm leading-relaxed"
                style={{ background: 'var(--color-panel-2)' }}
              >
                {packet.json}
              </pre>
            </details>

            <div className="mt-6 rounded-2xl p-5" style={{ background: 'var(--color-panel-2)' }}>
              <SignalPath progress={progress} live={remaining !== null} />

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button className="btn btn-primary" onClick={send} disabled={remaining !== null}>
                  <Icon name="send" size={16} />
                  Transmit (simulated)
                </button>
                <button className="btn btn-secondary" onClick={() => built && download(built.packet, crewId, built.now)}>
                  <Icon name="download" size={16} />
                  Download JSON
                </button>
                {remaining !== null && (
                  <button className="btn btn-ghost" onClick={cancel}>
                    Reset
                  </button>
                )}
              </div>

              <div aria-live="polite" className="mt-4 min-h-[5rem]">
                {remaining === null ? (
                  <p className="text-muted">
                    Nothing leaves this browser: the transmit button simulates the {environment.label} link and starts the one-way clock.
                  </p>
                ) : remaining > 0 ? (
                  <div>
                    <p className="label">Arrives in</p>
                    <p className="value mt-1" style={{ fontSize: '2.75rem' }}>
                      {mmss(remaining)}
                    </p>
                    <div className="meter mt-3">
                      <span style={{ width: `${progress * 100}%`, background: 'var(--color-ink)' }} />
                    </div>
                    <p className="mt-2 text-[0.9375rem] text-muted">
                      Ground receives it around {transmission?.arrivalText}. A reply cannot come back in less than another{' '}
                      {formatDelay(delaySec)}.
                    </p>
                  </div>
                ) : (
                  <div className="animate-rise flex items-start gap-3">
                    <Icon name="check" size={20} className="mt-1" />
                    <p>
                      <span className="font-bold" style={{ color: 'var(--color-ok-ink)' }}>
                        Delivered to the ground.
                      </span>
                      <br />
                      <span className="text-muted">Earliest possible reply: another {formatDelay(delaySec)} from now.</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  )
}
