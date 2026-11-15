import { useEffect, useState } from 'react'
import bedrest from '../data/bedrest.json'
import donki from '../data/donki-sep.json'
import sources from '../content/sources.json'
import { INDICATORS } from '../contract/types'
import { getSnapshot } from './store'
import { LogoTile } from './Logo'

/*
 * A short systems check on the first load of a session. Every line is a real check, run on the
 * spot: the local database, the bundled NASA content and data, the face model, the camera, and
 * the offline cache. It never asks for camera permission, never touches the network beyond this
 * app's own files, and gets out of the way in about two seconds (or at once with Skip).
 *
 * Before the check, a short title card: "Our Apollo-gies presents Daily Orbit". About three
 * seconds, a moment with reduced motion, and Skip ends both.
 */

const INTRO_MS = 3200
const INTRO_MS_REDUCED = 1400

type Check = { label: string; result: string; ok: boolean | null }
const KEY = 'chm-booted'

async function runChecks(): Promise<Check[]> {
  // The database loads in parallel with this screen; give it up to two seconds before judging it.
  for (let i = 0; i < 20 && !getSnapshot().crew.length; i++) await new Promise((r) => setTimeout(r, 100))
  const snap = getSnapshot()
  const crew = snap.crew.length
  // Look in the offline cache first (it does not answer HEAD requests), then ask the server.
  const url = `${import.meta.env.BASE_URL}models/face_landmarker.task`
  let model = false
  try {
    model = !!(await caches.match(url, { ignoreSearch: true }))
  } catch {
    model = false
  }
  if (!model) {
    try {
      const ctl = new AbortController()
      const r = await fetch(url, { signal: ctl.signal })
      model = r.ok
      ctl.abort()
    } catch {
      model = false
    }
  }
  const camera = !!navigator.mediaDevices?.getUserMedia
  const offline = !!navigator.serviceWorker?.controller
  return [
    { label: 'Local health database', result: crew ? `${crew} crew profiles loaded` : 'empty', ok: crew > 0 },
    { label: 'NASA-sourced content', result: `${INDICATORS.length} indicators, ${sources.length} sources`, ok: true },
    { label: 'NASA data on board', result: `${bedrest.days.length} bed-rest days, ${donki.eventCount} solar events`, ok: true },
    { label: 'Face model', result: model ? 'bundled, no download needed' : 'not reachable', ok: model },
    { label: 'Camera', result: camera ? 'available (asks only when you start a check)' : 'not available: manual entry still works', ok: camera ? true : null },
    { label: 'Offline mode', result: offline ? 'ready: works with no link to Earth' : 'arms after this first visit', ok: offline ? true : null },
  ]
}

export function BootScreen() {
  const [show, setShow] = useState(() => {
    try {
      if (new URLSearchParams(location.search).get('boot') === '0') return false
      return sessionStorage.getItem(KEY) !== '1'
    } catch {
      return false
    }
  })
  const [checks, setChecks] = useState<Check[]>([])
  const [shown, setShown] = useState(0)
  const [leaving, setLeaving] = useState(false)
  const [intro, setIntro] = useState(true)

  useEffect(() => {
    if (!show) return
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const t = setTimeout(() => setIntro(false), reduced ? INTRO_MS_REDUCED : INTRO_MS)
    return () => clearTimeout(t)
  }, [show])

  useEffect(() => {
    if (!show) return
    try {
      sessionStorage.setItem(KEY, '1')
    } catch {
      // Not remembering only means it shows again next time.
    }
    let alive = true
    void runChecks().then((c) => alive && setChecks(c))
    return () => {
      alive = false
    }
  }, [show])

  useEffect(() => {
    if (!show || intro || !checks.length) return
    if (shown < checks.length) {
      const t = setTimeout(() => setShown((n) => n + 1), 170)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setLeaving(true), 700)
    const u = setTimeout(() => setShow(false), 1100)
    return () => {
      clearTimeout(t)
      clearTimeout(u)
    }
  }, [show, intro, checks, shown])

  if (!show) return null
  if (intro) {
    return (
      <div role="status" aria-label="Our Apollo-gies presents Daily Orbit" className="intro" onClick={() => setIntro(false)}>
        <div className="intro-stars" aria-hidden="true" />
        <div style={{ position: 'relative', display: 'grid', justifyItems: 'center', gap: 10, textAlign: 'center', padding: 16 }}>
          <p className="intro-team" aria-hidden="true">
            {'Our '.split('').map((ch, i) => (
              <span key={i} style={{ animationDelay: `${i * 45}ms` }}>
                {ch === ' ' ? ' ' : ch}
              </span>
            ))}
            <span className="intro-gold">
              {'Apollo'.split('').map((ch, i) => (
                <span key={i} style={{ animationDelay: `${(i + 4) * 45}ms` }}>
                  {ch}
                </span>
              ))}
            </span>
            {'-gies'.split('').map((ch, i) => (
              <span key={i} style={{ animationDelay: `${(i + 10) * 45}ms` }}>
                {ch}
              </span>
            ))}
          </p>
          <p className="intro-presents">presents</p>
          <div className="intro-mark">
            <span className="intro-ring" aria-hidden="true" />
            <LogoTile size={92} />
          </div>
          <h1 className="intro-title">Daily Orbit</h1>
          <p className="intro-tag">A minute a day keeps the crew flying.</p>
        </div>
        <button type="button" onClick={(e) => { e.stopPropagation(); setShow(false) }} className="intro-skip">
          Skip
        </button>
      </div>
    )
  }
  return (
    <div role="status" aria-label="Systems check" style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'grid', placeItems: 'center', background: 'radial-gradient(ellipse at 50% 30%, #1b2440, #07090f 70%)', color: '#e8eefc', opacity: leaving ? 0 : 1, transition: 'opacity 400ms ease', padding: 16 }}>
      <div style={{ width: 'min(460px, 100%)', display: 'grid', gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ borderRadius: 14, animation: 'ms-glow 2s ease-in-out infinite' }}>
            <LogoTile size={56} />
          </span>
          <div>
            <strong style={{ fontSize: 22, letterSpacing: '-0.02em' }}>Daily Orbit</strong>
            <p style={{ margin: 0, fontSize: 13.5, color: 'rgba(232,238,252,.7)' }}>Systems check</p>
          </div>
        </div>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', fontSize: 13.5 }}>
          {checks.slice(0, shown).map((c) => (
            <li key={c.label} style={{ display: 'flex', gap: 10, alignItems: 'baseline', animation: 'ms-pop 220ms ease both' }}>
              <span aria-hidden="true" style={{ width: 18, color: c.ok === false ? '#f0645a' : c.ok ? '#7ef0c5' : '#f6c445' }}>
                {c.ok === false ? '✕' : c.ok ? '✓' : '•'}
              </span>
              <span style={{ minWidth: 168, color: 'rgba(232,238,252,.75)' }}>{c.label}</span>
              <span>{c.result}</span>
            </li>
          ))}
          {!checks.length && <li style={{ color: 'rgba(232,238,252,.6)' }}>Checking…</li>}
        </ul>
        <button type="button" onClick={() => setShow(false)} style={{ justifySelf: 'start', minHeight: 36, padding: '0 14px', borderRadius: 10, border: '1px solid rgba(232,238,252,.3)', background: 'transparent', color: '#e8eefc', cursor: 'pointer', fontWeight: 650 }}>
          Skip
        </button>
      </div>
    </div>
  )
}
