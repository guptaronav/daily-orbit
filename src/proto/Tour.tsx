import { useCallback, useEffect, useState } from 'react'
import { runScenario } from './scenarios'
import * as D from './data'
import { bridge } from './store'
import { setSection } from './Sections'

/*
 * The 60-second guided tour. Each stop opens a screen, scrolls to one feature, outlines it, and
 * says in a line or two why it matters. A few stops have a "Show me" button that fires a demo
 * scenario, so a judge sees the real engine react rather than a canned screenshot.
 * Start it from the landing page, the demo panel, ?tour=1 (step through) or ?tour=auto (plays by
 * itself: each stop holds for a few seconds, fires its demo, and moves on; Pause hands control back).
 */

type Stop = { screen: string; anchor: string; title: string; body: string; action?: { label: string; run: () => Promise<unknown> | void } }

const ask = (q: string) => {
  window.dispatchEvent(new CustomEvent('orbit:ask', { detail: q }))
}
const crew = () => D.getState().crew.id as string

const STOPS: Stop[] = [
  { screen: 'landing', anchor: 'h1', title: 'Daily Orbit in two minutes', body: 'A one-minute daily health check for astronauts. Every reading is compared with the person’s own usual, never a population average, and the app refuses to guess when a reading is unreliable.' },
  { screen: 'today', anchor: '[role=status]', title: 'Today: the console you open first', body: 'Readiness with its reasons, the body figure beating at the measured heart rate, the next block on the schedule, and today’s goals: one list that every coin, streak and level in the app comes from.' },
  { screen: 'today', anchor: '[data-tour="needs-look"]', title: 'Every alert says what to do', body: 'Now, Today, and when to escalate, from sourced content with a link. Finishing the Now steps is a care step worth coins. Readings that are sliding say how many days until they leave your usual range, and old readings ask to be refreshed.' },
  {
    screen: 'bodymap',
    anchor: '[aria-labelledby="patterns-heading"]',
    title: 'Patterns, not single numbers',
    body: 'Related readings moving the wrong way together raise a pattern, tied to its NASA risk, with a care plan. Fire a fever and watch the engine react.',
    action: { label: 'Show me: a fever', run: () => runScenario('fever', crew()) },
  },
  { screen: 'bodymap', anchor: '[aria-labelledby="hazards-heading"]', title: 'NASA’s five hazards, on this mission', body: 'Each hazard is colored by the readings its NASA-sourced text links to, with what it means on the ISS, the Moon, the way to Mars or on Mars. Includes the career radiation budget and the cabin air.' },
  { screen: 'bodymap', anchor: '#radiation-replay', title: 'A real solar storm', body: 'Replay a historical solar particle event from NASA DONKI, hour by hour, with dose rates measured by NASA’s lunar orbiter. The shelter alert fires at onset, and each hour is saved as a reading on Body.' },
  { screen: 'bodymap', anchor: '#forecast-heading', title: 'Where the mission is heading', body: 'Bone loss and radiation can’t be felt. The forecast projects both to the end of the mission from NASA’s own rates, and says plainly where NASA has no number.' },
  { screen: 'mirror', anchor: 'h1', title: 'The mirror check', body: 'About a minute of webcam for pulse and blinking, an Amsler grid and a near-vision test per eye, then how you feel. Video never leaves the device.' },
  { screen: 'manual', anchor: '[aria-labelledby="rt-heading"]', title: 'What the camera can’t see', body: 'Blood pressure, temperature, blood sugar, body mass, food and water, and alertness: a quick minute, or the validated 3-minute PVT-B that catches sleep loss before you feel it.' },
  { screen: 'manual', anchor: '#bodychecks-heading', title: 'Body checks', body: 'A pain map you tap on, a stand-up test for gravity changes, a weekly NASA-TLX workload and PHQ-2/GAD-2 mood check, and grip strength with bone-loading sessions. Each pays for doing it, never for the result.' },
  { screen: 'schedule', anchor: 'h1', title: 'The mission day', body: 'A NASA-shaped crew day, duties only your role sees, and your own blocks. Health blocks tick themselves when you do them.' },
  { screen: 'medical', anchor: '#alerts-heading', title: 'Nothing gets lost', body: 'The fever opened an alert with its action card. Unanswered alerts climb: after 15 minutes the backup medical officer is asked, after an hour it is time to tell Earth. If the medical officer is the patient, the backup covers. Readings that recover close their alert visibly.' },
  { screen: 'medical', anchor: '[data-tour="share"]', title: 'You decide what crosses to Earth', body: 'Choose which kinds of change leave the ship. Anything switched off stays onboard and is counted, never sent, and the packet size updates as you choose.' },
  {
    screen: 'medical',
    anchor: '#ask-orbit',
    title: 'Ask Orbit',
    body: 'Questions about symptoms get answers only from the app’s NASA sources, with links, next to the person’s own readings. Warning signs skip straight to escalation.',
    action: { label: 'Ask: “I have a headache”', run: () => ask('I have a headache') },
  },
  { screen: 'progress', anchor: '.ms-scene, h1', title: 'Coins for effort, never for values', body: 'A bad day pays the same as a good one, so nobody hides a symptom. Mission banners hide real NASA facts to discover.' },
  { screen: 'metrics', anchor: '#validation-heading', title: 'Tested on real NASA data', body: 'Replayed on a real NASA bed-rest participant: the flags catch the real weight loss and hold it at Act on 12 of 18 days, with no extra false alarms.' },
  { screen: 'metrics', anchor: '#model-card-heading', title: 'What it is, and what it is not', body: 'A one-page model card: the rules, the data, the false-alarm rate, and the limits. A prototype, not a medical device.' },
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

/** How long a stop holds in auto mode, and the extra time a stop with a demo gets. */
const DWELL_MS = 9000
const DEMO_EXTRA_MS = 3500

export function Tour() {
  const [i, setI] = useState<number | null>(null)
  const [auto, setAuto] = useState(false)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<Record<number, boolean>>({})

  const start = useCallback((play = false) => {
    setDone({})
    setAuto(play)
    setI(0)
  }, [])
  useEffect(() => {
    const on = (e: Event) => start(!!(e as CustomEvent).detail?.auto)
    window.addEventListener('tour:start', on)
    const q = new URLSearchParams(location.search).get('tour')
    if (q === '1' || q === 'full') start(false)
    if (q === 'auto') start(true)
    return () => window.removeEventListener('tour:start', on)
  }, [start])

  useEffect(() => {
    if (i === null) return
    const stop = STOPS[i]
    let el: Element | null = null
    let cancelled = false
    if (stop.screen === 'bodymap') setSection('body', stop.anchor.includes('patterns') ? 'patterns' : stop.anchor.includes('hazards') || stop.anchor.includes('radiation') ? 'hazards' : stop.anchor.includes('forecast') ? 'forecast' : 'tour')
    if (stop.screen === 'manual') setSection('log', stop.anchor.includes('bodychecks') ? 'checks' : stop.anchor.includes('rt-') ? 'alertness' : 'readings')
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

  // Auto mode: fire the stop's demo, hold, then move on. The last stop ends the tour.
  useEffect(() => {
    if (i === null || !auto) return
    const stop = STOPS[i]
    let cancelled = false
    const demo = stop.action && !done[i] ? window.setTimeout(async () => {
      setBusy(true)
      await stop.action!.run()
      if (cancelled) return
      setBusy(false)
      setDone((d) => ({ ...d, [i]: true }))
    }, 1500) : undefined
    const next = window.setTimeout(() => setI((n) => (n === null ? n : n >= STOPS.length - 1 ? null : n + 1)), DWELL_MS + (stop.action ? DEMO_EXTRA_MS : 0))
    return () => {
      cancelled = true
      window.clearTimeout(demo)
      window.clearTimeout(next)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, auto])

  useEffect(() => {
    if (i === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setI(null)
      if (e.key === ' ' && (e.target as HTMLElement)?.tagName !== 'BUTTON') setAuto((a) => !a)
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
        <button type="button" onClick={() => setAuto((a) => !a)} aria-label={auto ? 'Pause the tour' : 'Play the tour automatically'} style={{ minHeight: 28, padding: '0 10px', borderRadius: 99, border: 0, background: auto ? '#f6c445' : 'rgba(243,241,234,.12)', color: auto ? '#14181f' : '#f3f1ea', fontWeight: 750, fontSize: 12, cursor: 'pointer' }}>
          {auto ? 'Pause' : 'Play'}
        </button>
        <button type="button" onClick={() => setI(null)} aria-label="End the tour" style={{ width: 28, height: 28, borderRadius: 99, border: 0, background: 'rgba(243,241,234,.12)', color: '#f3f1ea', cursor: 'pointer' }}>
          ×
        </button>
      </div>
      {auto && (
        <span aria-hidden="true" style={{ height: 3, borderRadius: 99, background: 'rgba(243,241,234,.12)', overflow: 'hidden' }}>
          <span key={i} style={{ display: 'block', height: '100%', background: 'rgba(246,196,69,.7)', animation: `tour-dwell ${DWELL_MS + (stop.action ? DEMO_EXTRA_MS : 0)}ms linear forwards` }} />
        </span>
      )}
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
