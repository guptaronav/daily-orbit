import { useEffect, useRef, useState } from 'react'
import * as D from './data'

/*
 * A one-minute reaction-time check, a short take on the psychomotor vigilance test (PVT) that
 * spaceflight research uses for alertness. A target appears after a random wait; tap it (or press
 * Space) as fast as you can. The median of the valid taps is saved as a reactionTime reading and
 * judged against the person's own baseline like every other indicator. Pressing before the target
 * shows counts as a false start, never as a reaction.
 */

export const TEST_SECONDS = 60
/** Random wait before each target, in seconds. Shorter than the standard PVT's so a minute holds enough trials. */
export const WAIT_MIN_S = 2
export const WAIT_MAX_S = 6
/**
 * The standard 10-minute PVT counts a response of 500 ms or more as a lapse (the 3-minute PVT-B uses
 * 355 ms). This one-minute version is shorter than any validated one, so the count is shown for
 * context only; the reading itself is judged against the person's own baseline.
 */
export const LAPSE_MS = 500
export const PVT_SOURCE = 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3197786'
const MIN_VALID = 5

type Phase = 'idle' | 'waiting' | 'target' | 'done'
type Result = { median: number; trials: number; lapses: number; falseStarts: number; saved: boolean; points: number }

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

export function ReactionTest() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [left, setLeft] = useState(TEST_SECONDS)
  const [last, setLast] = useState<{ ms: number | null; early: boolean; k: number } | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const rts = useRef<number[]>([])
  const early = useRef(0)
  const shownAt = useRef(0)
  const endAt = useRef(0)
  const timer = useRef<number | undefined>(undefined)
  const tick = useRef<number | undefined>(undefined)
  const box = useRef<HTMLButtonElement>(null)

  const clear = () => {
    window.clearTimeout(timer.current)
    window.clearInterval(tick.current)
  }
  useEffect(() => clear, [])

  const finish = () => {
    clear()
    const valid = rts.current
    const id: string = D.getState().crew.id
    if (valid.length < MIN_VALID) {
      setResult({ median: valid.length ? Math.round(median(valid)) : 0, trials: valid.length, lapses: valid.filter((x) => x >= LAPSE_MS).length, falseStarts: early.current, saved: false, points: 0 })
    } else {
      const med = Math.round(median(valid))
      const points = D.logReading(id, 'reactionTime', [{ indicator: 'reactionTime', value: med, unit: 'ms', label: 'Reaction time' }])
      setResult({ median: med, trials: valid.length, lapses: valid.filter((x) => x >= LAPSE_MS).length, falseStarts: early.current, saved: true, points })
    }
    setPhase('done')
  }

  const armNext = () => {
    if (performance.now() >= endAt.current) return finish()
    setPhase('waiting')
    const wait = (WAIT_MIN_S + Math.random() * (WAIT_MAX_S - WAIT_MIN_S)) * 1000
    timer.current = window.setTimeout(() => {
      if (performance.now() >= endAt.current) return finish()
      shownAt.current = performance.now()
      setPhase('target')
    }, wait)
  }

  const start = () => {
    rts.current = []
    early.current = 0
    setResult(null)
    setLast(null)
    endAt.current = performance.now() + TEST_SECONDS * 1000
    setLeft(TEST_SECONDS)
    tick.current = window.setInterval(() => {
      const remaining = endAt.current - performance.now()
      setLeft(Math.max(0, Math.ceil(remaining / 1000)))
      // Time is up even if a target is still waiting for a tap: an unanswered target is not a reaction.
      if (remaining <= -1500) finish()
    }, 250)
    armNext()
    window.setTimeout(() => box.current?.focus(), 0)
  }

  const respond = () => {
    if (phase === 'target') {
      const ms = Math.round(performance.now() - shownAt.current)
      rts.current.push(ms)
      setLast((l) => ({ ms, early: false, k: (l?.k ?? 0) + 1 }))
      armNext()
    } else if (phase === 'waiting') {
      early.current += 1
      window.clearTimeout(timer.current)
      setLast((l) => ({ ms: null, early: true, k: (l?.k ?? 0) + 1 }))
      armNext()
    }
  }

  const running = phase === 'waiting' || phase === 'target'

  return (
    <section aria-labelledby="rt-heading" style={{ borderRadius: 28, background: 'var(--panel)', border: '1px solid var(--rule)', padding: 'clamp(18px, 2.4vw, 28px)', display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'stretch' }}>
      <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h2 id="rt-heading" style={{ margin: 0, fontSize: 'clamp(24px, 2.6vw, 32px)', fontWeight: 750, letterSpacing: '-0.035em' }}>
          Alertness check
        </h2>
        <p style={{ margin: 0, fontSize: 15, color: 'var(--muted)', lineHeight: 1.5 }}>
          One minute. When the circle turns gold, tap it or press Space as fast as you can. Pressing early counts as a false start. A one-minute take on the reaction-time test ISS astronauts have used for alertness. It is shorter than the validated versions, so it is only compared with your own past results.
        </p>
        {result && (
          <div role="status" style={{ marginTop: 6, padding: 14, borderRadius: 16, background: result.saved ? 'var(--panel-2)' : 'rgba(179,38,30,.08)', display: 'grid', gap: 6 }}>
            {result.saved ? (
              <>
                <p style={{ margin: 0, display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: 36, fontWeight: 750, letterSpacing: '-0.04em' }}>{result.median}</span>
                  <span style={{ color: 'var(--muted)' }}>ms median</span>
                  {result.points > 0 && <span style={{ marginLeft: 'auto', fontWeight: 800, color: '#a8740a', animation: 'fw-coin 1100ms ease-out forwards' }}>+{result.points}</span>}
                </p>
                <p style={{ margin: 0, fontSize: 13.5, color: 'var(--muted)' }}>
                  {result.trials} taps · {result.lapses} slow ({LAPSE_MS} ms or more, the standard test's lapse) · {result.falseStarts} false start{result.falseStarts === 1 ? '' : 's'}. Saved to your head region.
                </p>
              </>
            ) : (
              <p style={{ margin: 0, fontSize: 14 }}>Only {result.trials} valid taps, not enough to judge ({MIN_VALID} needed). Nothing was saved. Try again when you can give it the full minute.</p>
            )}
          </div>
        )}
        <button type="button" onClick={start} disabled={running} className="fw-press" style={{ marginTop: 'auto', alignSelf: 'flex-start', minHeight: 50, padding: '0 22px', borderRadius: 14, border: 0, background: running ? 'var(--paper-deep)' : '#14181f', color: running ? 'var(--muted)' : '#f3f1ea', boxShadow: running ? 'none' : '0 5px 0 #000', fontSize: 15.5, fontWeight: 750, cursor: running ? 'default' : 'pointer' }}>
          {running ? `${left} s left` : result ? 'Run it again' : 'Start the minute'}
        </button>
      </div>

      <button
        ref={box}
        type="button"
        aria-label={phase === 'target' ? 'Tap now' : running ? 'Wait for the gold circle' : 'Reaction area. Start the minute first.'}
        onPointerDown={(e) => {
          e.preventDefault()
          respond()
        }}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault()
            respond()
          }
        }}
        style={{ flex: '1 1 280px', minHeight: 220, borderRadius: 24, border: '2px solid var(--rule)', background: phase === 'target' ? '#14181f' : 'var(--panel-2)', display: 'grid', placeItems: 'center', cursor: running ? 'pointer' : 'default', position: 'relative', overflow: 'hidden', touchAction: 'manipulation', transition: 'background-color 80ms linear' }}
      >
        <span aria-hidden="true" style={{ width: 96, height: 96, borderRadius: 99, background: phase === 'target' ? '#f6c445' : 'transparent', border: phase === 'target' ? 0 : '3px dashed var(--rule-strong)', boxShadow: phase === 'target' ? '0 0 0 14px rgba(246,196,69,.25)' : 'none', transform: phase === 'target' ? 'scale(1)' : 'scale(.85)', transition: 'transform 60ms ease' }} />
        <span style={{ position: 'absolute', bottom: 14, left: 0, right: 0, textAlign: 'center', fontSize: 14, fontWeight: 650, color: phase === 'target' ? '#f3f1ea' : 'var(--muted)' }}>
          {phase === 'idle' && 'Press Start, then watch here'}
          {phase === 'waiting' && (last?.early ? 'Too early. Wait for gold.' : last?.ms != null ? `${last.ms} ms. Wait for the next one…` : 'Wait for gold…')}
          {phase === 'target' && 'Now!'}
          {phase === 'done' && 'Done'}
        </span>
      </button>
    </section>
  )
}
