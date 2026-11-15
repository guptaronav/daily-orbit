import { useEffect, useReducer, useState } from 'react'
import * as D from './data'
import { bridge } from './store'

/*
 * Patterns across indicators on the body map: several related readings moving the wrong way
 * together, each tied to its NASA risk and the escalation rung to go to. When nothing lines up,
 * it says so in one quiet line, so the panel never shouts on a normal day.
 */

type Hit = {
  id: string
  title: string
  summary: string
  risk: string
  riskUrl: string
  status: 'yellow' | 'red'
  rung: number
  rungName: string
  parts: { id: string; label: string; status: string; direction: 'up' | 'down' | null }[]
  care: { now: string[]; prevent: string[]; recheck: string[]; moveUp: string }
}

function CareList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null
  return (
    <div>
      <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 750, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--muted)' }}>{title}</p>
      <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 4, fontSize: 13.5, lineHeight: 1.45 }}>
        {items.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </div>
  )
}

const TONE = {
  yellow: { word: 'Watch', ink: 'var(--watch-ink)', swatch: 'var(--watch)', wash: 'rgba(183,121,31,.1)' },
  red: { word: 'Act', ink: 'var(--act-ink)', swatch: 'var(--act)', wash: 'rgba(179,38,30,.09)' },
}

export function PatternsPanel() {
  const [, bump] = useReducer((n: number) => n + 1, 0)
  useEffect(() => D.onState(bump), [])
  const crew = D.getState().crew as { id: string; name: string }
  const hits = D.patterns(crew.id) as Hit[]
  const [open, setOpen] = useState<string | null>(null)
  const [scheduled, setScheduled] = useState<Record<string, boolean>>({})
  const addRecheck = (h: Hit) => {
    D.addBlock(crew.id, { title: `Re-check: ${h.care.recheck.join(', ')}`, start: '07:45', minutes: 15, repeat: 'once', day: D.tomorrowKey(), addKind: 'check', detail: 'Health' })
    setScheduled((x) => ({ ...x, [h.id]: true }))
  }

  return (
    <section data-reveal="1" aria-labelledby="patterns-heading" style={{ borderRadius: 28, background: 'var(--panel)', border: '1px solid var(--rule)', padding: 'clamp(18px, 2.4vw, 26px)', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
        <h2 id="patterns-heading" style={{ margin: 0, fontSize: 'clamp(20px, 2.2vw, 26px)', fontWeight: 750, letterSpacing: '-0.03em' }}>
          Patterns across your readings
        </h2>
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>Related readings moving the wrong way together. A prompt to look closer, not a diagnosis.</span>
      </div>

      {hits.length === 0 ? (
        <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, color: 'var(--muted)' }}>
          <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 99, background: 'var(--ok)' }} />
          No patterns right now: nothing is moving the wrong way together.
        </p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: 12 }}>
          {hits.map((h) => {
            const tone = TONE[h.status]
            return (
              <li key={h.id} style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 16, borderRadius: 20, background: tone.wash, border: `2px solid ${tone.swatch}`, animation: 'ms-pop 360ms ease both' }}>
                <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ padding: '3px 10px', borderRadius: 99, background: tone.swatch, color: '#fff', fontSize: 12.5, fontWeight: 750 }}>{tone.word}</span>
                  <strong style={{ fontSize: 16.5 }}>{h.title}</strong>
                </p>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-soft)' }}>{h.summary}</p>
                <ul aria-label="Readings in this pattern" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {h.parts.map((p) => (
                    <li key={p.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 99, background: 'var(--panel)', border: '1px solid var(--rule)', fontSize: 13, fontWeight: 650 }}>
                      <span aria-hidden="true" style={{ color: p.status === 'red' ? 'var(--act-ink)' : 'var(--watch-ink)' }}>
                        {p.direction === 'up' ? '↑' : p.direction === 'down' ? '↓' : '•'}
                      </span>
                      {p.label}
                      <span style={{ color: 'var(--muted)', fontWeight: 500 }}>{p.direction ? (p.direction === 'up' ? 'higher' : 'lower') : 'changed'}</span>
                    </li>
                  ))}
                </ul>
                <p style={{ margin: 0, fontSize: 12.5, color: 'var(--muted)' }}>
                  NASA risk:{' '}
                  <a href={h.riskUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>
                    {h.risk}
                  </a>
                </p>
                <button type="button" aria-expanded={open === h.id} onClick={() => setOpen(open === h.id ? null : h.id)} style={{ alignSelf: 'flex-start', minHeight: 36, padding: '0 12px', borderRadius: 10, border: '1.5px solid var(--ink)', background: 'var(--panel)', color: 'var(--ink)', fontWeight: 700, cursor: 'pointer' }}>
                  {open === h.id ? 'Hide care plan' : 'Care plan'}
                </button>
                {open === h.id && (
                  <div style={{ display: 'grid', gap: 12, padding: 14, borderRadius: 14, background: 'var(--panel)', border: '1px solid var(--rule)', animation: 'ms-pop 300ms ease both' }}>
                    <CareList title="Do now" items={h.care.now} />
                    <CareList title="Prevent" items={h.care.prevent} />
                    <div>
                      <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 750, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--muted)' }}>Watch</p>
                      <p style={{ margin: 0, fontSize: 13.5 }}>Re-check tomorrow: {h.care.recheck.join(', ')}.</p>
                      <button type="button" disabled={!!scheduled[h.id]} onClick={() => addRecheck(h)} style={{ marginTop: 8, minHeight: 34, padding: '0 12px', borderRadius: 10, border: 0, background: scheduled[h.id] ? 'var(--paper-deep)' : 'var(--accent)', color: scheduled[h.id] ? 'var(--muted)' : '#fff', fontWeight: 700, cursor: scheduled[h.id] ? 'default' : 'pointer' }}>
                        {scheduled[h.id] ? 'Added to tomorrow’s schedule' : 'Add re-check to tomorrow’s schedule'}
                      </button>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 750, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--muted)' }}>Move up if</p>
                      <p style={{ margin: 0, fontSize: 13.5 }}>{h.care.moveUp}</p>
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 'auto' }}>
                  <span style={{ fontSize: 13.5 }}>
                    Next step: <strong>{h.rungName}</strong>
                  </span>
                  <button type="button" className="fw-press" onClick={() => bridge.go?.('escalation' as never)} style={{ minHeight: 40, padding: '0 14px', borderRadius: 12, border: 0, background: '#14181f', color: '#f3f1ea', boxShadow: '0 4px 0 #000', fontWeight: 750, cursor: 'pointer' }}>
                    Open Escalate
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
