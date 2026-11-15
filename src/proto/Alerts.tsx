import { useEffect, useState } from 'react'
import { RENOTIFY_MS } from '../lib/alerts'
import * as D from './data'
import { useApp } from '../state/AppContext'
import { bridge } from './store'
import { AlertActionCard, MedicalOfficerSetting, ResolvedAlerts } from './AlertCare'
import { timeAgo, useStoreTick } from './shared'

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

function useAlerts() {
  const bump = useStoreTick()
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
  const cmo = D.medicalOfficer() as { activeName: string; unwell: boolean }
  const worstEsc = Math.max(0, ...open.map((a) => (D.alertEscalation(a) as { level: number }).level))
  return (
    <div style={{ pointerEvents: 'auto', maxWidth: 1440, margin: '8px auto 0', padding: '0 4px' }}>
      <div
        key={pulse}
        role="alert"
        style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 16, background: red ? 'var(--act)' : 'var(--watch)', color: 'var(--paper)', boxShadow: '0 10px 24px -14px rgba(20,24,31,.6)', animation: 'al-pulse 1.4s ease 2' }}
      >
        <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 99, background: 'var(--paper)', animation: 'ms-twinkle 1.2s ease-in-out infinite' }} />
        <strong style={{ fontSize: 14.5 }}>
          {open.length} alert{open.length === 1 ? '' : 's'} waiting for {cmo.activeName || 'the crew medical officer'}
          {cmo.unwell ? ' (backup medical officer)' : ''}
        </strong>
        <span style={{ fontSize: 13.5, opacity: 0.9 }}>
          {open
            .slice(0, 2)
            .map((a) => `${a.crewName}: ${a.title}`)
            .join(' · ')}
          {open.length > 2 ? ` · +${open.length - 2} more` : ''} · oldest {timeAgo(oldest)}
          {worstEsc === 2 ? ' · unanswered over an hour: time to tell Earth' : worstEsc === 1 ? ' · the backup has been asked too' : ''}
        </span>
        <button type="button" onClick={() => bridge.go?.('medical' as never)} style={{ marginLeft: 'auto', minHeight: 36, padding: '0 14px', borderRadius: 10, border: 0, background: '#fff', color: '#14181f', fontWeight: 750, cursor: 'pointer' }}>
          Review
        </button>
      </div>
    </div>
  )
}

/** One alert as a single compact row; open it for what to do, the escalation note and closing. */
function AlertRow({ a, history = false }: { a: Alert; history?: boolean }) {
  const [open, setOpen] = useState(false)
  const [sent, setSent] = useState(false)
  const [closing, setClosing] = useState(false)
  const [note, setNote] = useState('')
  const tone = a.status === 'red' ? 'var(--act)' : 'var(--watch)'
  const e = D.alertEscalation(a) as { level: number; text: string }
  const when = a.state === 'open' ? timeAgo(a.firstSeen) : a.state === 'acknowledged' ? `seen ${timeAgo(a.ackAt!)}` : `closed ${timeAgo(a.closedAt!)}`
  const small = { minHeight: 32, padding: '0 11px', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer' } as const
  return (
    <li style={{ borderRadius: 14, background: 'var(--panel)', border: `1.5px solid ${a.state === 'open' ? tone : 'var(--rule)'}`, opacity: history ? 0.75 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 8px 8px 12px' }}>
        <span aria-hidden="true" style={{ width: 9, height: 9, flex: '0 0 auto', borderRadius: 99, background: tone }} />
        <span style={{ flex: 1, minWidth: 0, display: 'grid', gap: 1 }}>
          <strong style={{ fontSize: 14, lineHeight: 1.3 }}>{a.title}</strong>
          <span style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)' }}>
            {a.status === 'red' ? 'Act' : 'Watch'} · {when}
            {e.level > 0 && (
              <span title={e.text} style={{ padding: '0 7px', borderRadius: 99, fontSize: 11, fontWeight: 750, lineHeight: '17px', background: e.level === 2 ? 'var(--act)' : 'rgba(183,121,31,.16)', color: e.level === 2 ? 'var(--paper)' : 'var(--watch-ink)', whiteSpace: 'nowrap' }}>
                {e.level === 2 ? 'Tell Earth' : 'Backup asked'}
              </span>
            )}
          </span>
        </span>
        {a.state === 'open' && !history && (
          <button type="button" onClick={() => D.ackAlert(a.id)} style={{ ...small, flex: '0 0 auto', border: 0, background: '#14181f', color: '#f3f1ea' }}>
            Acknowledge
          </button>
        )}
        <button type="button" aria-expanded={open} aria-label={open ? `Hide details for ${a.title}` : `Show what to do for ${a.title}`} onClick={() => setOpen((o) => !o)} style={{ ...small, flex: '0 0 auto', minWidth: 32, padding: '0 8px', border: '1.5px solid var(--rule-strong)', background: 'var(--panel)', color: 'var(--ink)' }}>
          <span aria-hidden="true" style={{ display: 'inline-block', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 160ms ease' }}>
            ▾
          </span>
        </button>
      </div>
      {open && (
        <div style={{ display: 'grid', gap: 10, padding: '0 12px 12px' }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-soft)' }}>{a.detail}</p>
          {e.level > 0 && (
            <div role="status" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 10, background: e.level === 2 ? 'rgba(179,38,30,.1)' : 'rgba(183,121,31,.12)', fontSize: 13, fontWeight: 600 }}>
              <span style={{ flex: '1 1 200px' }}>{e.text}</span>
              {e.level === 2 && !sent && (
                <button type="button" onClick={() => { D.queuePacket(a.crewId); setSent(true) }} style={{ ...small, border: 0, background: 'var(--act)', color: 'var(--paper)' }}>
                  Send {a.crewName}'s summary to Earth
                </button>
              )}
              {sent && <span style={{ fontWeight: 700, color: 'var(--ok-ink)' }}>Sent to Earth. Keep onboard care going while it travels.</span>}
            </div>
          )}
          {a.state !== 'closed' && <AlertActionCard a={a} />}
          {a.note && (
            <p style={{ margin: 0, fontSize: 13, padding: '7px 10px', borderRadius: 10, background: 'var(--panel-2)' }}>
              <strong>Note: </strong>
              {a.note}
            </p>
          )}
          {a.state !== 'closed' && !closing && (
            <button type="button" onClick={() => setClosing(true)} style={{ ...small, justifySelf: 'start', border: '1.5px solid var(--ink)', background: 'var(--panel)', color: 'var(--ink)' }}>
              Close with a note
            </button>
          )}
          {closing && (
            <form
              onSubmit={(ev) => {
                ev.preventDefault()
                if (!note.trim()) return
                D.closeAlert(a.id, note.trim())
                setClosing(false)
              }}
              style={{ display: 'grid', gap: 8 }}
            >
              <label style={{ display: 'grid', gap: 6, fontSize: 13, fontWeight: 650 }}>
                What was done, and what happens next
                <textarea value={note} onChange={(ev) => setNote(ev.target.value)} rows={2} maxLength={280} required placeholder="e.g. Talked it through, extra sleep tonight, re-check in the morning." style={{ padding: 9, borderRadius: 10, border: '2px solid var(--rule)', background: 'var(--panel)', color: 'var(--ink)', font: 'inherit', resize: 'vertical' }} />
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" disabled={!note.trim()} style={{ ...small, border: 0, background: note.trim() ? '#14181f' : 'var(--paper-deep)', color: note.trim() ? '#f3f1ea' : 'var(--muted)', cursor: note.trim() ? 'pointer' : 'not-allowed' }}>
                  Close alert
                </button>
                <button type="button" onClick={() => setClosing(false)} style={{ ...small, border: 0, background: 'transparent', color: 'var(--accent)', textDecoration: 'underline' }}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </li>
  )
}

/**
 * Alerts on the Crew page, grouped by the person they are about: one small card per crew member,
 * one line per alert, most urgent first. Details open on demand, so a busy day still fits on screen.
 */
export function AlertsPanel() {
  const list = useAlerts()
  const active = list.filter((a) => a.state !== 'closed')
  const closed = list.filter((a) => a.state === 'closed').slice(0, 6)
  const nOpen = active.filter((a) => a.state === 'open').length
  const nAck = active.length - nOpen
  const cmo = D.medicalOfficer() as { activeName: string; unwell: boolean }
  const groups = Array.from(new Set(active.map((a) => a.crewId))).map((id) => {
    const items = active.filter((a) => a.crewId === id)
    return { id, name: items[0].crewName, items, red: items.some((a) => a.status === 'red'), open: items.filter((a) => a.state === 'open').length }
  })
  groups.sort((x, y) => Number(y.red) - Number(x.red) || y.open - x.open)
  const chip = (n: number, label: string, bg: string, ink: string) => (
    <span style={{ padding: '3px 10px', borderRadius: 99, background: bg, color: ink, fontSize: 12.5, fontWeight: 750 }}>
      {n} {label}
    </span>
  )
  return (
    <section aria-labelledby="alerts-heading" style={{ borderRadius: 24, background: 'var(--panel-2)', border: '1px solid var(--rule)', padding: 'clamp(14px, 2vw, 20px)', display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 12px' }}>
        <h2 id="alerts-heading" style={{ margin: 0, fontSize: 'clamp(19px, 2vw, 23px)', fontWeight: 750, letterSpacing: '-0.03em' }}>
          Alerts
        </h2>
        {nOpen > 0 && chip(nOpen, 'open', 'var(--act)', 'var(--paper)')}
        {nAck > 0 && chip(nAck, 'acknowledged', 'var(--paper-deep)', 'var(--ink)')}
        {active.length === 0 && chip(0, 'open', 'rgba(47,125,79,.14)', 'var(--ok-ink)')}
        <details style={{ marginLeft: 'auto', position: 'relative' }}>
          <summary style={{ cursor: 'pointer', fontSize: 13, fontWeight: 650, color: cmo.unwell ? 'var(--act-ink)' : 'var(--muted)', listStyle: 'none' }}>
            Answered by {cmo.activeName || 'the medical officer'}
            {cmo.unwell ? ' (backup)' : ''} · change
          </summary>
          <div style={{ position: 'absolute', right: 0, top: '100%', zIndex: 20, marginTop: 8, width: 'min(520px, calc(100vw - 48px))', boxShadow: '0 18px 40px rgba(0,0,0,.18)', borderRadius: 18 }}>
            <MedicalOfficerSetting />
          </div>
        </details>
      </div>
      {active.length === 0 ? (
        <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)' }}>No open alerts. Readings that come back within usual close their alert on their own.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 10, alignItems: 'start' }}>
          {groups.map((g) => (
            <div key={g.id} style={{ display: 'grid', gap: 8, padding: 10, borderRadius: 18, background: 'var(--panel)', border: '1px solid var(--rule)' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '0 4px' }}>
                <strong style={{ fontSize: 15 }}>{g.name}</strong>
                <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>
                  {g.items.length} alert{g.items.length === 1 ? '' : 's'}
                  {g.open ? `, ${g.open} waiting` : ''}
                </span>
              </div>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6 }}>
                {g.items.map((a) => (
                  <AlertRow key={a.id} a={a} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
      {(closed.length > 0 || (D.resolvedAlerts() as unknown[]).length > 0) && (
        <details>
          <summary style={{ cursor: 'pointer', fontSize: 13.5, fontWeight: 650 }}>History: closed and recovered</summary>
          <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
            {closed.length > 0 && (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6 }}>
                {closed.map((a) => (
                  <AlertRow key={a.id} a={{ ...a, title: `${a.crewName}: ${a.title}` }} history />
                ))}
              </ul>
            )}
            <ResolvedAlerts bare />
          </div>
        </details>
      )}
      <span style={{ fontSize: 12, color: 'var(--muted)' }}>Open alerts stay until acknowledged; unanswered ones climb after {D.ESCALATE_BACKUP_MIN as number} and {D.ESCALATE_GROUND_MIN as number} minutes.</span>
    </section>
  )
}
