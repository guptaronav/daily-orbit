import { useEffect, useState } from 'react'
import { clearScenarios, runScenario, SCENARIOS } from './scenarios'
import { openEarthLink, openRadiation, openSection } from './Sections'
import * as D from './data'
import { bridge } from './store'

/*
 * Judge mode: every demo story in one panel, each with one button that runs it on the chosen crew
 * member and then opens the place where its effect shows. The stories write ordinary records marked
 * "simulated", so the real status, pattern, alert and Go / No-go code reacts. Open it from the
 * landing page or with the J key.
 */

export const openJudgeMode = () => window.dispatchEvent(new CustomEvent('judge:open'))

type Story = { id: string; label: string; detail: string; show: string; go: () => void; run?: (crewId: string) => Promise<string> }

const go = (s: string) => bridge.go?.(s as never)
const WHERE: Record<string, { show: string; go: () => void }> = {
  fever: { show: 'Crew: the infection alert and its plan', go: () => go('medical') },
  co2: { show: 'Body, Five hazards: cabin air over the limit', go: () => openSection('body', 'hazards') },
  'says-fine': { show: 'Today: the call drops, and the gap is named', go: () => go('today') },
  'bad-sensor': { show: 'Crew: the alert says "the sensor"', go: () => go('medical') },
  'crew-sleep': { show: 'Crew: the alert says "the crew"', go: () => go('medical') },
}

export function JudgeMode() {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [done, setDone] = useState<Record<string, string>>({})

  useEffect(() => {
    const on = () => setOpen(true)
    const key = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      if (e.key === 'j' && !e.metaKey && !e.ctrlKey && !e.altKey) setOpen((o) => !o)
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('judge:open', on)
    window.addEventListener('keydown', key)
    return () => {
      window.removeEventListener('judge:open', on)
      window.removeEventListener('keydown', key)
    }
  }, [])
  if (!open) return null

  const crew = D.getState().crew as { id: string; name: string }
  const stories: Story[] = [
    ...SCENARIOS.map((s) => ({ id: s.id, label: s.label, detail: s.detail, ...(WHERE[s.id] ?? { show: 'Today', go: () => go('today') }), run: (id: string) => runScenario(s.id, id) })),
    { id: 'storm', label: 'A real solar storm', detail: 'Replay a NASA-recorded solar particle event hour by hour: the shelter alert, the dose and the career budget.', show: 'Body, Five hazards: the storm replay', go: openRadiation },
    { id: 'mars-link', label: 'Mars is far today', detail: 'The real Earth–Mars light time from JPL planet positions, and the next solar conjunction blackout.', show: 'Crew: the ground link', go: openEarthLink },
  ]

  const play = async (s: Story) => {
    setBusy(s.id)
    const msg = s.run ? await s.run(crew.id) : ''
    setBusy(null)
    if (msg) setDone((d) => ({ ...d, [s.id]: msg }))
    setOpen(false)
    s.go()
  }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="judge-heading" onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 95, display: 'grid', placeItems: 'center', padding: 16, background: 'rgba(7,9,15,.55)', backdropFilter: 'blur(4px)' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(720px, 100%)', maxHeight: 'calc(100vh - 32px)', overflowY: 'auto', borderRadius: 28, background: 'var(--panel)', color: 'var(--ink)', border: '1px solid var(--rule)', boxShadow: '0 40px 80px -30px rgba(0,0,0,.6)' }}>
        <div style={{ padding: '20px 22px 14px', background: '#14181f', color: '#f3f1ea', display: 'grid', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 750, letterSpacing: '.08em', textTransform: 'uppercase', color: '#f6c445' }}>Judge mode</p>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close judge mode" style={{ border: 0, background: 'rgba(243,241,234,.12)', color: '#f3f1ea', borderRadius: 10, minHeight: 32, padding: '0 12px', fontWeight: 700, cursor: 'pointer' }}>
              Close
            </button>
          </div>
          <h2 id="judge-heading" style={{ margin: 0, fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 750, letterSpacing: '-0.03em' }}>Pick a story. Watch the app react.</h2>
          <p style={{ margin: 0, fontSize: 14, color: 'rgba(243,241,234,.75)' }}>
            Each one runs on <strong style={{ color: '#f3f1ea' }}>{crew.name}</strong> with records marked simulated, then takes you to where it shows. Press J anytime.
          </p>
        </div>
        <ul style={{ listStyle: 'none', margin: 0, padding: 14, display: 'grid', gap: 8 }}>
          {stories.map((s, i) => (
            <li key={s.id} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 14px', padding: '12px 14px', borderRadius: 18, background: 'var(--panel-2)', border: '1px solid var(--rule)' }}>
              <span aria-hidden="true" style={{ flex: '0 0 auto', width: 30, height: 30, borderRadius: 10, display: 'grid', placeItems: 'center', background: '#14181f', color: '#f6c445', fontWeight: 800, fontSize: 13 }}>{i + 1}</span>
              <div style={{ flex: '1 1 300px', minWidth: 0, display: 'grid', gap: 2 }}>
                <strong style={{ fontSize: 15 }}>{s.label}</strong>
                <span style={{ fontSize: 13, lineHeight: 1.45, color: 'var(--ink-soft)' }}>{s.detail}</span>
                <span style={{ fontSize: 12.5, color: 'var(--accent)', fontWeight: 650 }}>See it on: {s.show}</span>
                {done[s.id] && <span style={{ fontSize: 12.5, color: 'var(--ok-ink)', fontWeight: 650 }}>Ran: {done[s.id]}</span>}
              </div>
              <button type="button" disabled={busy !== null} onClick={() => play(s)} style={{ flex: '0 0 auto', minHeight: 40, padding: '0 16px', borderRadius: 12, border: 0, background: '#14181f', color: '#f3f1ea', fontWeight: 750, cursor: busy ? 'wait' : 'pointer' }}>
                {busy === s.id ? 'Running…' : s.run ? 'Run and show me' : 'Show me'}
              </button>
            </li>
          ))}
        </ul>
        <div style={{ padding: '0 22px 18px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, fontSize: 13, color: 'var(--muted)' }}>
          <span>Want the guided version? The 2-minute tour walks through everything.</span>
          <button type="button" onClick={() => { clearScenarios(); setDone({}) }} style={{ border: 0, background: 'transparent', padding: 0, color: 'var(--accent)', textDecoration: 'underline', fontWeight: 650, cursor: 'pointer', font: 'inherit' }}>
            Clear the cabin fault
          </button>
        </div>
      </div>
    </div>
  )
}
