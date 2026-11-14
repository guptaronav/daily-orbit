import { useEffect, useState } from 'react'
import { StatusDot } from '../components/StatusDot'
import { btnPrimary, btnSecondary, h1, page } from '../components/ui'
import { listMeasurements } from '../db/repo'
import { formatDelay } from '../lib/environments'
import { buildPacket, packetFilename, type Packet } from '../lib/packet'
import { useApp } from '../state/AppContext'

type Rung = { n: string; title: string; when: string }

// Generic wording only. No clinical thresholds, no numbers: when in doubt, go up a rung.
const RUNGS: Rung[] = [
  {
    n: '01',
    title: 'Self-care',
    when: 'A reading moved a little and you already know what would help: rest, water, the scheduled exercise session, or simply retaking a reading the app could not trust.',
  },
  {
    n: '02',
    title: 'Crewmate check',
    when: 'You want a second pair of eyes. Ask a crewmate to look at the same reading, or run the mirror check alongside you so you can compare.',
  },
  {
    n: '03',
    title: 'Crew medical officer',
    when: 'The change has stayed for more than a day or two, more than one indicator moved together, or you feel worse than the numbers suggest. The medical officer has the training and the onboard kit.',
  },
  {
    n: '04',
    title: 'Flight surgeon',
    when: 'The crew wants ground input. Send the change summary below, then keep going with onboard care while it crosses the gap: the answer cannot arrive sooner than the comm delay allows.',
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

  return (
    <main className={page}>
      <p className="label">Escalation</p>
      <h1 className={`${h1} mt-1`}>Who to tell, and when</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
        Four rungs, lowest first. Climb one when the step below has not settled it. No rung is triggered by a number: this app compares you
        with your own baseline and tells you what moved, and the decision stays with the crew.
      </p>

      <ol className="mt-8 divide-y divide-rule border-y border-rule">
        {RUNGS.map((rung) => (
          <li key={rung.n} className="grid gap-x-6 gap-y-2 py-5 sm:grid-cols-[auto_12rem_1fr]">
            <span className="label" style={{ color: 'var(--color-accent)' }}>
              {rung.n}
            </span>
            <h2 className="text-base font-semibold tracking-tight">{rung.title}</h2>
            <p className="text-sm leading-relaxed text-muted">{rung.when}</p>
          </li>
        ))}
      </ol>

      <section aria-labelledby="packet-heading" className="card mt-10 p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-rule pb-4">
          <div>
            <p className="label">Rung 04 &middot; ground packet</p>
            <h2 id="packet-heading" className="mt-1 text-lg font-semibold tracking-tight">
              What would be sent to the flight surgeon
            </h2>
          </div>
          <dl className="flex flex-wrap gap-x-8 gap-y-2">
            <div>
              <dt className="label">Size</dt>
              <dd className="value" style={{ fontSize: '1.5rem' }}>
                {packet ? packet.bytes : '—'}
                <span className="value-unit"> bytes</span>
              </dd>
            </div>
            <div>
              <dt className="label">One-way delay</dt>
              <dd className="value" style={{ fontSize: '1.5rem' }}>
                {formatDelay(delaySec)}
              </dd>
            </div>
          </dl>
        </div>

        {packet === null ? (
          <p className="mt-4 text-sm text-muted">Loading readings…</p>
        ) : (
          <>
            <p className="mt-4 text-sm text-muted">
              Only what changed is sent: {currentCrew?.name ?? 'this crew member'} has{' '}
              <span className="font-medium text-ink">{packet.changed.length}</span> indicator(s) outside their own baseline. Readings that
              failed the quality check are never included.
            </p>

            {packet.changed.length > 0 && (
              <ul className="mt-4 divide-y divide-rule border-y border-rule">
                {packet.changed.map((c) => (
                  <li key={c.indicator} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-2.5 text-sm">
                    <span className="font-medium">{c.label}</span>
                    <span className="text-muted">
                      {c.from} to <span className="font-medium text-ink">{c.to}</span> {c.unit} ({c.deltaPct > 0 ? '+' : ''}
                      {c.deltaPct}%), {c.sinceDays === 0 ? 'since today' : `for ${c.sinceDays} day(s)`}
                    </span>
                    <StatusDot status={c.status} />
                  </li>
                ))}
              </ul>
            )}

            <details className="mt-4">
              <summary className="cursor-pointer py-2 text-sm text-accent underline underline-offset-4">Show the exact JSON</summary>
              <pre className="mt-2 max-h-72 overflow-auto border border-rule bg-paper p-3 text-xs leading-relaxed">{packet.json}</pre>
            </details>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button className={btnPrimary} onClick={send} disabled={remaining !== null}>
                Send to flight surgeon (simulated)
              </button>
              <button className={btnSecondary} onClick={() => built && download(built.packet, crewId, built.now)}>
                Download JSON
              </button>
              {remaining !== null && (
                <button className={btnSecondary} onClick={cancel}>
                  Reset
                </button>
              )}
            </div>

            <div aria-live="polite" className="mt-4 min-h-[3.5rem]">
              {remaining === null ? (
                <p className="text-sm text-muted">
                  Nothing leaves this browser: the send button simulates the {environment.label} link and starts the one-way clock.
                </p>
              ) : remaining > 0 ? (
                <p className="text-sm">
                  <span className="label">Arrives in</span>{' '}
                  <span role="timer" className="value" style={{ fontSize: '1.75rem' }}>
                    {mmss(remaining)}
                  </span>
                  <br />
                  <span className="text-muted">
                    Ground receives it around {transmission?.arrivalText}. A reply cannot come back in less than another{' '}
                    {formatDelay(delaySec)}.
                  </span>
                </p>
              ) : (
                <p className="text-sm">
                  <span className="font-medium" style={{ color: 'var(--color-ok-ink)' }}>
                    Delivered to the ground.
                  </span>{' '}
                  <span className="text-muted">Earliest possible reply: another {formatDelay(delaySec)} from now.</span>
                </p>
              )}
            </div>
          </>
        )}
      </section>
    </main>
  )
}
