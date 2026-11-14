import { useEffect, useState } from 'react'
import { Icon, type IconName } from '../components/kit/Icon'
import { Panel } from '../components/kit/Panel'
import { Counter } from '../components/kit/Readout'
import { StatusDot } from '../components/StatusDot'
import { btnPrimary, btnSecondary } from '../components/ui'
import { listMeasurements } from '../db/repo'
import { formatDelay } from '../lib/environments'
import { buildPacket, packetFilename, type Packet } from '../lib/packet'
import { useApp } from '../state/AppContext'

type Rung = { n: string; title: string; when: string; icon: IconName }

// Generic wording only. No clinical thresholds, no numbers: when in doubt, go up a rung.
const RUNGS: Rung[] = [
  {
    n: '01',
    title: 'Self-care',
    when: 'A reading moved a little and you already know what would help: rest, water, the scheduled exercise session, or simply retaking a reading the app could not trust.',
    icon: 'check',
  },
  {
    n: '02',
    title: 'Crewmate check',
    when: 'You want a second pair of eyes. Ask a crewmate to look at the same reading, or run the mirror check alongside you so you can compare.',
    icon: 'eye',
  },
  {
    n: '03',
    title: 'Crew medical officer',
    when: 'The change has stayed for more than a day or two, more than one indicator moved together, or you feel worse than the numbers suggest. The medical officer has the training and the onboard kit.',
    icon: 'heart',
  },
  {
    n: '04',
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
      <span className="label shrink-0">Ship</span>
      <div
        className="relative h-px flex-1"
        style={{ background: 'repeating-linear-gradient(to right, var(--color-rule-strong) 0 6px, transparent 6px 12px)' }}
      >
        <span
          className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full transition-[left] duration-1000 ease-linear"
          style={{
            left: `${pct}%`,
            background: live ? 'var(--color-accent)' : 'var(--color-rule-strong)',
            boxShadow: live ? '0 0 12px var(--color-accent)' : 'none',
          }}
        />
      </div>
      <span className="label shrink-0">Ground</span>
    </div>
  )
}

export function Escalation() {
  const { crewId, currentCrew, dataVersion, delaySec, environment } = useApp()
  const [built, setBuilt] = useState<{ packet: Packet; now: Date } | null>(null)
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

  return (
    <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6">
      <div className="border-b border-rule pb-5">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Who to tell, and when</h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">
          Four rungs, lowest first. Climb one when the step below has not settled it. No rung is triggered by a number: this app compares
          you with your own baseline and tells you what moved, and the decision stays with the crew.
        </p>
      </div>

      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        {/* ---- The ladder ---------------------------------------------------- */}
        <ol className="relative">
          <span aria-hidden className="absolute bottom-10 left-[19px] top-6 w-px" style={{ background: 'var(--color-rule)' }} />
          {RUNGS.map((rung, i) => (
            <li key={rung.n} className="animate-rise relative flex gap-5 pb-5" style={{ animationDelay: `${i * 80}ms` }}>
              <span
                aria-hidden
                className="relative z-10 grid h-10 w-10 shrink-0 place-items-center border bg-panel"
                style={{
                  borderColor: i === RUNGS.length - 1 ? 'var(--color-accent)' : 'var(--color-rule-strong)',
                  color: i === RUNGS.length - 1 ? 'var(--color-accent)' : 'var(--color-muted)',
                }}
              >
                <Icon name={rung.icon} size={16} />
              </span>
              <div className="card flex-1 p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="text-base font-semibold tracking-tight">{rung.title}</h2>
                  <span className="label" style={{ color: 'var(--color-accent)' }}>
                    rung {rung.n}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted">{rung.when}</p>
              </div>
            </li>
          ))}
        </ol>

        {/* ---- The transmission console --------------------------------------- */}
        <Panel
          label="Rung 04 · ground packet"
          aside={<span className="ticker">{environment.label}</span>}
          delay={200}
          ariaLabelledby="packet-heading"
        >
          <div className="p-5">
            <h2 id="packet-heading" className="text-xl font-semibold tracking-tight">
              What would be sent to the flight surgeon
            </h2>

            <dl className="mt-4 grid grid-cols-2 gap-5 sm:grid-cols-3">
              <div>
                <dt className="label">Packet size</dt>
                <dd className="value mt-1" style={{ fontSize: '1.75rem' }}>
                  {packet ? <Counter value={packet.bytes} /> : '—'}
                  <span className="value-unit"> bytes</span>
                </dd>
              </div>
              <div>
                <dt className="label">One-way delay</dt>
                <dd className="value mt-1" style={{ fontSize: '1.75rem' }}>
                  {formatDelay(delaySec)}
                </dd>
              </div>
              <div>
                <dt className="label">Changes</dt>
                <dd className="value mt-1" style={{ fontSize: '1.75rem' }}>
                  {packet ? <Counter value={packet.changed.length} /> : '—'}
                  <span className="value-unit"> indicators</span>
                </dd>
              </div>
            </dl>

            {packet === null ? (
              <p className="mt-5 text-sm text-muted">Loading readings…</p>
            ) : (
              <>
                <p className="mt-5 text-sm leading-relaxed text-muted">
                  Only what changed is sent: {currentCrew?.name ?? 'this crew member'} has{' '}
                  <span className="font-medium text-ink">{packet.changed.length}</span> indicator(s) outside their own baseline. Readings
                  that failed the quality check are never included.
                </p>

                {packet.changed.length > 0 && (
                  <ul className="mt-4 divide-y divide-rule border-y border-rule">
                    {packet.changed.map((c) => (
                      <li key={c.indicator} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-2.5 text-sm">
                        <span className="font-medium">{c.label}</span>
                        <span className="mono text-sm text-muted">
                          {c.from} &rarr; <span className="font-semibold text-ink">{c.to}</span> {c.unit} ({c.deltaPct > 0 ? '+' : ''}
                          {c.deltaPct}%) &middot; {c.sinceDays === 0 ? 'since today' : `${c.sinceDays}d`}
                        </span>
                        <StatusDot status={c.status} short />
                      </li>
                    ))}
                  </ul>
                )}

                <details className="mt-4">
                  <summary className="btn-quiet">Show the exact JSON</summary>
                  <pre className="mono mt-2 max-h-72 overflow-auto border border-rule bg-paper p-3 text-sm leading-relaxed">
                    {packet.json}
                  </pre>
                </details>
              </>
            )}
          </div>

          {packet && (
            <div className="border-t border-rule p-5">
              <SignalPath progress={progress} live={remaining !== null} />

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button className={btnPrimary} onClick={send} disabled={remaining !== null}>
                  <Icon name="send" size={15} />
                  Transmit (simulated)
                </button>
                <button className={btnSecondary} onClick={() => built && download(built.packet, crewId, built.now)}>
                  <Icon name="download" size={15} />
                  Download JSON
                </button>
                {remaining !== null && (
                  <button className={btnSecondary} onClick={cancel}>
                    Reset
                  </button>
                )}
              </div>

              <div aria-live="polite" className="mt-4 min-h-[5rem]">
                {remaining === null ? (
                  <p className="text-sm text-muted">
                    Nothing leaves this browser: the transmit button simulates the {environment.label} link and starts the one-way clock.
                  </p>
                ) : remaining > 0 ? (
                  <div>
                    <p className="label">Arrives in</p>
                    <p className="value mt-1" style={{ fontSize: '2.5rem', color: 'var(--color-accent)' }}>
                      {mmss(remaining)}
                    </p>
                    <div className="meter mt-3">
                      <span style={{ width: `${progress * 100}%` }} />
                    </div>
                    <p className="mono mt-2 text-sm text-muted">
                      Ground receives it around {transmission?.arrivalText}. A reply cannot come back in less than another{' '}
                      {formatDelay(delaySec)}.
                    </p>
                  </div>
                ) : (
                  <div className="animate-rise flex items-start gap-3">
                    <Icon name="check" size={20} className="mt-0.5" />
                    <p className="text-sm">
                      <span className="font-semibold" style={{ color: 'var(--color-ok-ink)' }}>
                        Delivered to the ground.
                      </span>
                      <br />
                      <span className="text-muted">Earliest possible reply: another {formatDelay(delaySec)} from now.</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </Panel>
      </div>
    </main>
  )
}
