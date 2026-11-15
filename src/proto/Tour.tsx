import { useCallback, useEffect, useState } from 'react'
import { runScenario } from './scenarios'
import * as D from './data'
import { bridge } from './store'

/*
 * The 60-second guided tour. Each stop opens a screen, scrolls to one feature, outlines it, and
 * says in a line or two why it matters. A few stops have a "Show me" button that fires a demo
 * scenario, so a judge sees the real engine react rather than a canned screenshot.
 * Start it from the landing page, the demo panel, or ?tour=1.
 */

type Stop = { screen: string; anchor: string; title: string; body: string; action?: { label: string; run: () => Promise<unknown> | void } }

const ask = (q: string) => {
  window.dispatchEvent(new CustomEvent('orbit:ask', { detail: q }))
}
const crew = () => D.getState().crew.id as string

const STOPS: Stop[] = [
  { screen: 'landing', anchor: 'h1', title: 'Daily Orbit in 60 seconds', body: 'A one-minute daily health check for astronauts. Every reading is compared with the person’s own usual, never a population average, and the app refuses to guess when a reading is unreliable.' },
  { screen: 'today', anchor: '[role=status]', title: 'Today: the console you open first', body: 'Readiness with its reasons, the body figure beating at the measured heart rate, the next block on the schedule, and today’s goals: one list that every coin, streak and level in the app comes from.' },
  {
    screen: 'bodymap',
    anchor: '[aria-labelledby="patterns-heading"]',
    title: 'Patterns, not single numbers',
    body: 'Related readings moving the wrong way together raise a pattern, tied to its NASA risk, with a care plan. Fire a fever and watch the engine react.',
    action: { label: 'Show me: a fever', run: () => runScenario('fever', crew()) },
  },
  { screen: 'bodymap', anchor: '[aria-labelledby="hazards-heading"]', title: 'NASA’s five hazards, on this mission', body: 'Each hazard is colored by the readings its NASA-sourced text links to, with what it means on the ISS, the Moon, the way to Mars or on Mars. Includes the career radiation budget and the cabin air.' },
  { screen: 'mirror', anchor: 'h1', title: 'The mirror check', body: 'About a minute of webcam for pulse and blinking, an Amsler grid and a near-vision test per eye, then how you feel. Video never leaves the device.' },
  { screen: 'manual', anchor: '[aria-labelledby="rt-heading"]', title: 'What the camera can’t see', body: 'Blood pressure, temperature, blood sugar, body mass, food and water, and a one-minute alertness test.' },
  { screen: 'schedule', anchor: 'h1', title: 'The mission day', body: 'A NASA-shaped crew day, duties only your role sees, and your own blocks. Health blocks tick themselves when you do them.' },
  { screen: 'medical', anchor: '#alerts-heading', title: 'Nothing gets lost', body: 'The fever opened an alert for the crew medical officer. It stays open until someone acknowledges it, and only clears with a note.' },
  {
    screen: 'medical',
    anchor: '#ask-orbit',
    title: 'Ask Orbit',
    body: 'Questions about symptoms get answers only from the app’s NASA sources, with links, next to the person’s own readings. Warning signs skip straight to escalation.',
    action: { label: 'Ask: “I have a headache”', run: () => ask('I have a headache') },
  },
  { screen: 'progress', anchor: '.ms-scene, h1', title: 'Coins for effort, never for values', body: 'A bad day pays the same as a good one, so nobody hides a symptom. Mission banners hide real NASA facts to discover.' },
  { screen: 'metrics', anchor: '#validation-heading', title: 'Tested on real NASA data', body: 'Replayed on a real NASA bed-rest participant: the flags catch the real weight loss and hold it at Act on 12 of 18 days, with no extra false alarms.' },
]

function waitFor(sel: string, ms = 3000): Promise<Element | null> {
  const start = performance.now()
  return new Promise((resolve) => {
    const tick = () => {
      const el = document.querySelector(sel)
      if (el || performance.now() - start > ms) return resolve(el)
      requestAnimationFrame(tick)
    }
    tick()
  })
}

export function Tour() {
  const [i, setI] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<Record<number, boolean>>({})

  const start = useCallback(() => {
    setDone({})
    setI(0)
  }, [])
  useEffect(() => {
    const on = () => start()
    window.addEventListener('tour:start', on)
    if (new URLSearchParams(location.search).get('tour') === '1') start()
    return () => window.removeEventListener('tour:start', on)
  }, [start])

  useEffect(() => {
    if (i === null) return
    const stop = STOPS[i]
    let el: Element | null = null
    let cancelled = false
    bridge.go?.(stop.screen as never)
    if (stop.anchor === '#ask-orbit') window.dispatchEvent(new Event('orbit:open'))
    // Give the new screen a moment to replace the old one, so we never outline a heading that is about to vanish.
    void new Promise((r) => setTimeout(r, 350)).then(() => waitFor(stop.anchor)).then((found) => {
      if (cancelled || !found) return
      el = found
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add('tour-focus')
    })
    return () => {
      cancelled = true
      el?.classList.remove('tour-focus')
    }
  }, [i])

  useEffect(() => {
    if (i === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setI(null)
      if (e.key === 'ArrowRight') setI((n) => (n === null ? n : Math.min(STOPS.length - 1, n + 1)))
      if (e.key === 'ArrowLeft') setI((n) => (n === null ? n : Math.max(0, n - 1)))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [i])

  if (i === null) return null
  const stop = STOPS[i]
  const last = i === STOPS.length - 1
  return (
    <aside role="dialog" aria-label={`Guided tour, stop ${i + 1} of ${STOPS.length}`} style={{ position: 'fixed', left: 16, bottom: 'calc(env(safe-area-inset-bottom, 0px) + 104px)', zIndex: 60, width: 'min(380px, calc(100vw - 32px))', padding: 16, borderRadius: 22, background: '#14181f', color: '#f3f1ea', boxShadow: '0 30px 60px -20px rgba(0,0,0,.6)', display: 'grid', gap: 10, animation: 'ms-pop 280ms cubic-bezier(.34,1.56,.64,1) both' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 750, color: '#f6c445' }}>
          {i + 1} / {STOPS.length}
        </span>
        <span aria-hidden="true" style={{ flex: 1, height: 4, borderRadius: 99, background: 'rgba(243,241,234,.15)', overflow: 'hidden' }}>
          <span style={{ display: 'block', width: `${((i + 1) / STOPS.length) * 100}%`, height: '100%', background: '#f6c445', transition: 'width 300ms ease' }} />
        </span>
        <button type="button" onClick={() => setI(null)} aria-label="End the tour" style={{ width: 28, height: 28, borderRadius: 99, border: 0, background: 'rgba(243,241,234,.12)', color: '#f3f1ea', cursor: 'pointer' }}>
          ×
        </button>
      </div>
      <strong style={{ fontSize: 17, letterSpacing: '-0.02em' }}>{stop.title}</strong>
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: 'rgba(243,241,234,.85)' }}>{stop.body}</p>
      {stop.action && (
        <button
          type="button"
          disabled={busy || done[i]}
          onClick={async () => {
            setBusy(true)
            await stop.action!.run()
            setBusy(false)
            setDone((d) => ({ ...d, [i]: true }))
          }}
          style={{ justifySelf: 'start', minHeight: 40, padding: '0 14px', borderRadius: 12, border: 0, background: done[i] ? 'rgba(243,241,234,.15)' : '#f6c445', color: done[i] ? '#f3f1ea' : '#14181f', fontWeight: 750, cursor: busy || done[i] ? 'default' : 'pointer' }}
        >
          {done[i] ? 'Done. Look at the highlighted area.' : busy ? 'Working…' : stop.action.label}
        </button>
      )}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
        <button type="button" disabled={i === 0} onClick={() => setI(i - 1)} style={{ minHeight: 40, padding: '0 14px', borderRadius: 12, border: '1.5px solid rgba(243,241,234,.3)', background: 'transparent', color: '#f3f1ea', fontWeight: 650, cursor: i === 0 ? 'default' : 'pointer', opacity: i === 0 ? 0.4 : 1 }}>
          Back
        </button>
        <button type="button" onClick={() => (last ? setI(null) : setI(i + 1))} style={{ minHeight: 40, padding: '0 18px', borderRadius: 12, border: 0, background: '#f3f1ea', color: '#14181f', fontWeight: 750, cursor: 'pointer' }}>
          {last ? 'Finish' : 'Next'}
        </button>
      </div>
    </aside>
  )
}
