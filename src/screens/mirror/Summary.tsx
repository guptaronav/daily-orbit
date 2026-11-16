import { useEffect, useState } from 'react'
import { StatusDot } from '../../components/StatusDot'
import { FocusPlan } from '../../proto/FocusPlan'
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
  /** Events that were logged but earn nothing new today (already counted once). */
  alreadyCounted: GameEventKind[]
  diagnostics?: CaptureDiagnostics | null
  trace?: CaptureTrace | null
  onRetake: () => void
  onDone: () => void
  onToday?: () => void
}

// Shown in this order; only indicators that were actually measured this session appear.
const ORDER: Indicator[] = ['heartRate', 'blinkRate', 'eyelidClosure', 'sleepHours', 'sleepQuality', 'mood', 'stress', 'appetite', 'digestiveComfort', 'amslerDistortion', 'nearAcuity', 'symptomReport']

export function Summary({ crewId, sessionId, earned, alreadyCounted, diagnostics, trace, onRetake, onDone, onToday }: Props) {
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

  if (all === null) return <p className="mc-status">Loading results…</p>

  const mine = ORDER.flatMap((indicator) => {
    const m = all.find((x) => x.sessionId === sessionId && x.indicator === indicator)
    return m ? [{ indicator, m }] : []
  })
  const anyFailed = mine.some(({ m }) => !m.quality.passed)

  const passed = mine.filter(({ m }) => m.quality.passed)
  const statuses = passed.map(({ indicator }) => readIndicator(indicator, all).status)
  const away = statuses.filter((x) => x === 'yellow' || x === 'red').length
  const demo = mine.some(({ m }) => m.source === 'simulated')
  const verdict = away > 0 ? `${away} reading${away === 1 ? '' : 's'} away from your usual` : passed.length ? 'Everything with enough history is within your usual' : 'Saved'

  return (
    <section aria-labelledby="summary-heading" className="mc-stack">
      <div className="mc-stack-sm">
        <p className="mc-kicker">Step 4 · Result</p>
        <h2 id="summary-heading" className="mc-h2">
          Check-in complete. {verdict}.
        </h2>
        {demo && <p className="mc-note">Demo run: the camera readings are this crew member's usual values, filled in so the whole check takes a minute. They are saved as simulated, never as a real measurement.</p>}
      </div>

      <ul className="mc-tiles">
        {mine.map(({ indicator, m }) => {
          const label = getContent(indicator).label
          if (!m.quality.passed) {
            // A weak-signal heart rate keeps its best guess, shown as an estimate: gray, never colored, never baselined.
            const estimate = indicator === 'heartRate' && m.quality.reason === 'lowSignal' && typeof m.value === 'number' && m.value > 0 ? m.value : null
            return (
              <li key={indicator} className="mc-tile" style={{ borderLeftColor: 'var(--rule-strong)' }}>
                <span className="mc-tile-k">{label}</span>
                <strong className="mc-tile-v">{estimate !== null ? `about ${estimate} bpm` : 'No clean reading'}</strong>
                <StatusDot status="gray" label={estimate !== null ? 'Estimate only' : "Couldn't get a clean reading"} />
                <span className="mc-tile-note">{retakeAdvice(m.quality.reason, indicator)}</span>
              </li>
            )
          }
          const reading = readIndicator(indicator, all)
          // With too little history there is nothing honest to compare against yet.
          const building = reading.status === 'gray' && reading.baseline === null && typeof m.value === 'number'
          const label2 = building ? `Building your baseline (${reading.priorCount} of ${BASELINE_MIN_SAMPLES})` : undefined
          const tone = reading.status === 'red' ? 'var(--act)' : reading.status === 'yellow' ? 'var(--watch)' : reading.status === 'green' ? 'var(--ok)' : 'var(--rule-strong)'
          return (
            <li key={indicator} className="mc-tile" style={{ borderLeftColor: tone }}>
              <span className="mc-tile-k">{label}</span>
              <strong className="mc-tile-v">{formatValue(m)}</strong>
              <StatusDot status={reading.status} label={label2} />
            </li>
          )
        })}
      </ul>
      <p className="mc-kicker" style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 600 }}>Colors compare each reading with your own baseline. A reading we could not trust is never colored.</p>

      <FocusPlan compact />

      <div className="mc-credit">
        <strong>+{pointsFor(earned.map((kind) => ({ kind })))} coins</strong>
        <span>
          {earned.map((kind) => `${EVENT_LABEL[kind]} +${POINTS[kind]}`).join(' · ') || 'Nothing new today'}
          {alreadyCounted.length > 0 ? ` · already counted today: ${alreadyCounted.map((k) => EVENT_LABEL[k].toLowerCase()).join(', ')}` : ''}
        </span>
        <span className="mc-wait">Coins pay for doing the check, never for the numbers.</span>
      </div>

      {anyFailed && (
        <p className="mc-note">
          <strong>Gray isn't a failure.</strong> The light, the angle or a movement got in the way, so we didn't guess. A retake earns +{POINTS.retakeAfterQualityFail} coins.
        </p>
      )}
      <div className="mc-row">
        <button onClick={onToday ?? onDone} className="mc-btn">
          Back to Today
        </button>
        <button onClick={onDone} className="mc-btn2">
          See body map
        </button>
        {anyFailed && (
          <button onClick={onRetake} className="mc-gold">
            Retake (+{POINTS.retakeAfterQualityFail} coins)
          </button>
        )}
      </div>

      {diagnostics && !demo && (
        <details className="mc-note">
          <summary style={{ cursor: 'pointer', fontWeight: 650 }}>Measurement details</summary>
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
              <button onClick={() => void copyCapture()} className="mc-link">
                Copy capture data
              </button>
              <span role="status" className="ml-3 text-sm text-muted">
                {copied === 'ok' ? 'Copied.' : copied === 'failed' ? 'Could not copy.' : 'Numbers only (average face color per frame). No video or images.'}
              </span>
            </div>
          )}
        </details>
      )}
    </section>
  )
}
