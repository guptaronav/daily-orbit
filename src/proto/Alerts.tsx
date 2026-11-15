import { useEffect, useReducer, useState } from 'react'
import { RENOTIFY_MS } from '../lib/alerts'
import * as D from './data'
import { useApp } from '../state/AppContext'
import { bridge } from './store'

/*
 * The alert loop on screen. AlertBanner sits under the top bar on every page while any alert is
 * unacknowledged, and re-announces itself every few minutes. AlertsPanel, on the Crew view, is where
 * the crew medical officer acknowledges an alert and closes it with a note.
 */

type Alert = {
  id: string
  crewId: string
  crewName: string
  kind: 'reading' | 'pattern'
  title: string
  detail: string
  status: 'yellow' | 'red'
  state: 'open' | 'acknowledged' | 'closed'
  firstSeen: number
  note?: string
  ackAt?: number
  closedAt?: number
}

const ago = (t: number) => {
  const m = Math.max(0, Math.round((Date.now() - t) / 60000))
  if (m < 1) return 'just now'
  if (m < 60) return `${m} min ago`
  const h = Math.round(m / 60)
  return h < 48 ? `${h} h ago` : `${Math.round(h / 24)} days ago`
}

function useAlerts() {
  const [, bump] = useReducer((n: number) => n + 1, 0)
  useEffect(() => D.onState(bump), [])
  // Re-render on a clock so ages and the re-announce pulse move on their own.
  useEffect(() => {
    const t = setInterval(bump, 30_000)
    return () => clearInterval(t)
  }, [])
  return D.alerts() as Alert[]
}

export function AlertBanner() {
  const list = useAlerts()
  const { screen } = useApp()
  const open = list.filter((a) => a.state === 'open')
  useEffect(() => {
    const base = document.title.replace(/^\(\d+\) /, '')
    document.title = open.length ? `(${open.length}) ${base}` : base
  }, [open.length])
  // On the Crew page the full alerts panel is right there, so the banner would only repeat it.
  if (!open.length || screen === 'medical') return null
  const oldest = Math.min(...open.map((a) => a.firstSeen))
  // Each re-announce period gets a new key, which replays the attention animation.
  const pulse = Math.floor((Date.now() - oldest) / RENOTIFY_MS)
  const red = open.some((a) => a.status === 'red')
  return (
    <div style={{ pointerEvents: 'auto', maxWidth: 1440, margin: '8px auto 0', padding: '0 4px' }}>
      <div
        key={pulse}
        role="alert"
        style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 16, background: red ? 'var(--act)' : 'var(--watch)', color: 'var(--paper)', boxShadow: '0 10px 24px -14px rgba(20,24,31,.6)', animation: 'al-pulse 1.4s ease 2' }}
      >
        <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 99, background: 'var(--paper)', animation: 'ms-twinkle 1.2s ease-in-out infinite' }} />
        <strong style={{ fontSize: 14.5 }}>
          {open.length} alert{open.length === 1 ? '' : 's'} waiting for the crew medical officer
        </strong>
        <span style={{ fontSize: 13.5, opacity: 0.9 }}>
          {open
            .slice(0, 2)
            .map((a) => `${a.crewName}: ${a.title}`)
            .join(' · ')}
          {open.length > 2 ? ` · +${open.length - 2} more` : ''} · oldest {ago(oldest)}
        </span>
        <button type="button" onClick={() => bridge.go?.('medical' as never)} style={{ marginLeft: 'auto', minHeight: 36, padding: '0 14px', borderRadius: 10, border: 0, background: '#fff', color: '#14181f', fontWeight: 750, cursor: 'pointer' }}>
          Review
        </button>
      </div>
    </div>
  )
}

function AlertRow({ a }: { a: Alert }) {
  const [closing, setClosing] = useState(false)
  const [note, setNote] = useState('')
  const tone = a.status === 'red' ? 'var(--act)' : 'var(--watch)'
  return (
    <li style={{ display: 'grid', gap: 8, padding: 14, borderRadius: 18, background: 'var(--panel)', border: `2px solid ${a.state === 'open' ? tone : 'var(--rule)'}`, opacity: a.state === 'closed' ? 0.7 : 1 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
        <span style={{ padding: '2px 9px', borderRadius: 99, background: tone, color: 'var(--paper)', fontSize: 12, fontWeight: 750 }}>{a.status === 'red' ? 'Act' : 'Watch'}</span>
        <strong style={{ fontSize: 15 }}>
          {a.crewName}: {a.title}
        </strong>
        <span style={{ marginLeft: 'auto', fontSize: 12.5, color: 'var(--muted)' }}>
          {a.state === 'open' ? `Open, raised ${ago(a.firstSeen)}` : a.state === 'acknowledged' ? `Acknowledged ${ago(a.ackAt!)}` : `Closed ${ago(a.closedAt!)}`}
        </span>
      </div>
      <p style={{ margin: 0, fontSize: 13.5, color: 'var(--ink-soft)' }}>{a.detail}</p>
      {a.note && (
        <p style={{ margin: 0, fontSize: 13.5, padding: '8px 10px', borderRadius: 10, background: 'var(--panel-2)' }}>
          <strong>Note: </strong>
          {a.note}
        </p>
      )}
      {a.state !== 'closed' && !closing && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {a.state === 'open' && (
            <button type="button" className="fw-press" onClick={() => D.ackAlert(a.id)} style={{ minHeight: 40, padding: '0 14px', borderRadius: 12, border: 0, background: '#14181f', color: '#f3f1ea', boxShadow: '0 4px 0 #000', fontWeight: 750, cursor: 'pointer' }}>
              Acknowledge
            </button>
          )}
          <button type="button" onClick={() => setClosing(true)} style={{ minHeight: 40, padding: '0 14px', borderRadius: 12, border: '1.5px solid var(--ink)', background: 'var(--panel)', color: 'var(--ink)', fontWeight: 700, cursor: 'pointer' }}>
            Close with a note
          </button>
        </div>
      )}
      {closing && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!note.trim()) return
            D.closeAlert(a.id, note.trim())
            setClosing(false)
          }}
          style={{ display: 'grid', gap: 8 }}
        >
          <label style={{ display: 'grid', gap: 6, fontSize: 13.5, fontWeight: 650 }}>
            What was done, and what happens next
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={280} required placeholder="e.g. Talked it through, extra sleep tonight, re-check in the morning." style={{ padding: 10, borderRadius: 12, border: '2px solid var(--rule)', background: 'var(--panel)', color: 'var(--ink)', font: 'inherit', resize: 'vertical' }} />
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" disabled={!note.trim()} style={{ minHeight: 38, padding: '0 14px', borderRadius: 12, border: 0, background: note.trim() ? '#14181f' : 'var(--paper-deep)', color: note.trim() ? '#f3f1ea' : 'var(--muted)', fontWeight: 750, cursor: note.trim() ? 'pointer' : 'not-allowed' }}>
              Close alert
            </button>
            <button type="button" onClick={() => setClosing(false)} style={{ minHeight: 38, padding: '0 12px', borderRadius: 12, border: 0, background: 'transparent', color: 'var(--accent)', fontWeight: 650, cursor: 'pointer', textDecoration: 'underline' }}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </li>
  )
}

export function AlertsPanel() {
  const list = useAlerts()
  const active = list.filter((a) => a.state !== 'closed')
  const closed = list.filter((a) => a.state === 'closed').slice(0, 4)
  return (
    <section aria-labelledby="alerts-heading" style={{ borderRadius: 28, background: 'var(--panel-2)', border: '1px solid var(--rule)', padding: 'clamp(18px, 2.4vw, 26px)', display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
        <h2 id="alerts-heading" style={{ margin: 0, fontSize: 'clamp(20px, 2.2vw, 26px)', fontWeight: 750, letterSpacing: '-0.03em' }}>
          Alerts for the crew medical officer
        </h2>
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>Each stays open until acknowledged, and only clears with a note. A new reading reopens it.</span>
      </div>
      {active.length === 0 ? (
        <p style={{ margin: 0, fontSize: 15, color: 'var(--muted)' }}>No open alerts.</p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 10 }}>
          {active.map((a) => (
            <AlertRow key={a.id} a={a} />
          ))}
        </ul>
      )}
      {closed.length > 0 && (
        <details>
          <summary style={{ cursor: 'pointer', fontSize: 14, fontWeight: 650 }}>Recently closed ({closed.length})</summary>
          <ul style={{ listStyle: 'none', margin: '10px 0 0', padding: 0, display: 'grid', gap: 10 }}>
            {closed.map((a) => (
              <AlertRow key={a.id} a={a} />
            ))}
          </ul>
        </details>
      )}
    </section>
  )
}
