import { useEffect, useState } from 'react'
import { LogoMark } from './Logo'

/*
 * The launch card, once per session: "Our Apollo-gies presents Daily Orbit" on the site's own
 * paper, with the logo orbiting in and a thin line that fills while the app loads behind it.
 * About 1.8 seconds (shorter with reduced motion); a click or Skip ends it at once.
 */

const SHOW_MS = 1800
const SHOW_MS_REDUCED = 700
const KEY = 'chm-booted'

export function BootScreen() {
  const [show, setShow] = useState(() => {
    try {
      if (new URLSearchParams(location.search).get('boot') === '0') return false
      return sessionStorage.getItem(KEY) !== '1'
    } catch {
      return false
    }
  })
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    if (!show) return
    try {
      sessionStorage.setItem(KEY, '1')
    } catch {
      // Not remembering only means it shows again next time.
    }
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const ms = reduced ? SHOW_MS_REDUCED : SHOW_MS
    const t = setTimeout(() => setLeaving(true), ms)
    const u = setTimeout(() => setShow(false), ms + 380)
    return () => {
      clearTimeout(t)
      clearTimeout(u)
    }
  }, [show])

  if (!show) return null
  return (
    <div role="status" aria-label="Our Apollo-gies presents Daily Orbit" className={`boot${leaving ? ' boot-out' : ''}`} onClick={() => setShow(false)}>
      <div className="boot-card">
        <p className="boot-team">
          Our <span>Apollo</span>-gies <em>presents</em>
        </p>
        <div className="boot-mark">
          <LogoMark height={64} />
        </div>
        <h1 className="boot-title">Daily Orbit</h1>
        <p className="boot-tag">A minute a day keeps the crew flying.</p>
        <span className="boot-line" aria-hidden="true">
          <span />
        </span>
      </div>
      <button type="button" onClick={(e) => { e.stopPropagation(); setShow(false) }} className="boot-skip">
        Skip
      </button>
    </div>
  )
}
