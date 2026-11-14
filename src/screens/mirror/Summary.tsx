import { useEffect, useState } from 'react'
import { StatusDot } from '../../components/StatusDot'
import { btnPrimary, btnSecondary } from '../../components/ui'
import type { GameEventKind, Indicator, Measurement } from '../../contract/types'
import { listMeasurements } from '../../db/repo'
import { BASELINE_MIN_SAMPLES } from '../../lib/baseline'
import { readIndicator } from '../../lib/bodyStatus'
import { MAX_FACE_LOST, MAX_LUMA, MAX_MOTION, MIN_LUMA, MIN_PROMINENCE } from '../../lib/signal/constants'
import type { CaptureDiagnostics, CaptureTrace } from '../../lib/signal/analyze'
import { getContent } from '../../lib/content'
import { formatValue } from '../../lib/format'
import { retakeAdvice } from '../../lib/retake'
import { EVENT_LABEL, POINTS, pointsFor } from '../../lib/scoring'

type Props = {
  crewId: string
  sessionId: string
  /** Effort events this check-in earned. */
  earned: GameEventKind[]
  diagnostics?: CaptureDiagnostics | null
  trace?: CaptureTrace | null
  onRetake: () => void
  onDone: () => void
}

// Shown in this order; only indicators that were actually measured this session appear.
const ORDER: Indicator[] = ['heartRate', 'blinkRate', 'eyelidClosure', 'sleepHours', 'sleepQuality', 'mood', 'stress', 'appetite', 'digestiveComfort', 'amslerDistortion', 'nearAcuity', 'symptomReport']

export function Summary({ crewId, sessionId, earned, diagnostics, trace, onRetake, onDone }: Props) {
  const [all, setAll] = useState<Measurement[] | null>(null)
  const [copied, setCopied] = useState<'idle' | 'ok' | 'failed'>('idle')

  async function copyCapture() {
    try {
      await navigator.clipboard.writeText(JSON.stringify({ diagnostics, trace }))
      setCopied('ok')
    } catch {
      setCopied('failed')
    }
  }

  useEffect(() => {
    let cancelled = false
    void listMeasurements(crewId).then((rows) => !cancelled && setAll(rows))
    return () => {
      cancelled = true
    }
  }, [crewId])

  if (all === null) return <p className="text-muted">Loading results…</p>

  const mine = ORDER.flatMap((indicator) => {
    const m = all.find((x) => x.sessionId === sessionId && x.indicator === indicator)
    return m ? [{ indicator, m }] : []
  })
  const anyFailed = mine.some(({ m }) => !m.quality.passed)

  return (
    <section aria-labelledby="summary-heading" className="space-y-5">
      <h2 id="summary-heading" className="text-xl font-semibold tracking-tight">
        Check-in complete
      </h2>
      <ul className="divide-y divide-rule border-y border-rule">
        {mine.map(({ indicator, m }) => {
          const label = getContent(indicator).label
          if (!m.quality.passed) {
            // A weak-signal heart rate keeps its best guess, shown as an estimate: gray, never colored, never baselined.
            const estimate = indicator === 'heartRate' && m.quality.reason === 'lowSignal' && typeof m.value === 'number' && m.value > 0 ? m.value : null
            return (
              <li key={indicator} className="py-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span>
                    <span className="font-medium">{label}</span>
                    {estimate !== null && <span className="ml-3">about <strong>{estimate} bpm</strong></span>}
                  </span>
                  <StatusDot status="gray" label={estimate !== null ? 'Estimate only, low confidence' : "Couldn't get a clean reading"} />
                </div>
                {estimate !== null && (
                  <p className="mt-1 text-sm">
                    This is our best guess, not a clean reading, so it is not colored and not used for your baseline. Estimates like this are usually close; check against another device if it matters.
                  </p>
                )}
                <p className="mt-1 text-sm text-muted">{retakeAdvice(m.quality.reason, indicator)}</p>
              </li>
            )
          }
          const reading = readIndicator(indicator, all)
          // With too little history there is nothing honest to compare against yet.
          const building = reading.status === 'gray' && reading.baseline === null && typeof m.value === 'number'
          const label2 = building ? `Building your baseline (${reading.priorCount} of ${BASELINE_MIN_SAMPLES} earlier readings)` : undefined
          return (
            <li key={indicator} className="flex flex-wrap items-baseline justify-between gap-2 py-3">
              <span>
                <span className="font-medium">{label}</span>
                <span className="ml-3 text-muted">{formatValue(m)}</span>
              </span>
              <StatusDot status={reading.status} label={label2} />
            </li>
          )
        })}
      </ul>
      <p className="max-w-xl text-sm text-muted">Colors compare each reading with your own baseline. A reading we could not trust is never colored.</p>
      <section aria-labelledby="credit-heading" className="max-w-xl border-l-4 border-accent bg-panel p-4">
        <h3 id="credit-heading" className="text-sm font-semibold">
          Credit earned: {pointsFor(earned.map((kind) => ({ kind })))} points
        </h3>
        <ul className="mt-2 text-sm">
          {earned.map((kind) => (
            <li key={kind} className="flex justify-between gap-4">
              <span>{EVENT_LABEL[kind]}</span>
              <span className="font-medium">+{POINTS[kind]}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-muted">Points come from what you did, not from your readings. A hard day earns exactly what an easy one does.</p>
      </section>
      {diagnostics && (
        <details className="max-w-xl border border-rule bg-panel p-3 text-sm">
          <summary className="cursor-pointer font-medium">Measurement details</summary>
          <dl className="mt-3 grid grid-cols-[1fr_auto] gap-x-6 gap-y-1">
            <dt className="text-muted">Footage analyzed</dt>
            <dd>{diagnostics.seconds.toFixed(1)} s, {diagnostics.frames} frames at {diagnostics.fps.toFixed(1)} fps</dd>
            <dt className="text-muted">Head movement (limit {MAX_MOTION})</dt>
            <dd>{Number.isFinite(diagnostics.motion) ? diagnostics.motion.toFixed(3) : 'no face'}</dd>
            <dt className="text-muted">Face brightness (need {MIN_LUMA} to {MAX_LUMA})</dt>
            <dd>{diagnostics.meanLuma.toFixed(0)}</dd>
            <dt className="text-muted">Time face was lost (limit {Math.round(MAX_FACE_LOST * 100)}%)</dt>
            <dd>{Math.round(diagnostics.faceLostFraction * 100)}%</dd>
            <dt className="text-muted">Pulse signal strength (need {MIN_PROMINENCE})</dt>
            <dd>{diagnostics.prominence.toFixed(2)}</dd>
            <dt className="text-muted">Best-guess heart rate</dt>
            <dd>{diagnostics.candidateBpm === null ? 'none' : `${diagnostics.candidateBpm} bpm`}</dd>
          </dl>
          {trace && (
            <div className="mt-3 border-t border-rule pt-3">
              <button onClick={() => void copyCapture()} className="text-accent underline underline-offset-4 hover:text-ink">
                Copy capture data
              </button>
              <span role="status" className="ml-3 text-xs text-muted">
                {copied === 'ok' ? 'Copied.' : copied === 'failed' ? 'Could not copy.' : 'Numbers only (average face color per frame). No video or images.'}
              </span>
            </div>
          )}
        </details>
      )}
      <div className="flex flex-wrap gap-3">
        <button onClick={onDone} className={btnPrimary}>
          See body map
        </button>
        {anyFailed && (
          <button onClick={onRetake} className={btnSecondary}>
            Retake
          </button>
        )}
      </div>
    </section>
  )
}
