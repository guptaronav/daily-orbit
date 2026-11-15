import { useState } from 'react'
import { openEarthLink } from './Sections'
import * as D from './data'
import { useStoreTick } from './shared'

/*
 * "What should I do?": the escalation ladder worked out from this person's own data, inside Ask
 * Orbit. It names the rung (self-care, a crewmate, the medical officer, the flight surgeon), says
 * why, gives the steps, and acts right here: raise an alert for the medical officer, or send the
 * change summary to Earth (only the kinds of reading the person chose to share).
 *
 * Open it from anywhere with: window.dispatchEvent(new CustomEvent('orbit:escalate', { detail }))
 * where detail may carry { title, detail, status } to pre-fill the alert (a body check does this).
 */

export type EscalateContext = { title?: string; detail?: string; status?: 'yellow' | 'red' }

/** Open Ask Orbit on the "what should I do" answer, optionally about one specific thing. */
export function openEscalation(ctx?: EscalateContext) {
  window.dispatchEvent(new CustomEvent('orbit:escalate', { detail: ctx || {} }))
}

type Advice = { rung: number; who: string; reasons: string[]; steps: string[]; canRaise: boolean; canSend: boolean; delay: string; openAlerts: number }
const NAMES = ['Self-care', 'Crewmate', 'Medical officer', 'Flight surgeon']
const TONE = ['var(--ok)', 'var(--accent)', 'var(--watch)', 'var(--act)']

export function EscalationAdvice({ ctx }: { ctx?: EscalateContext }) {
  useStoreTick()
  const id = D.getState().crew.id as string
  const a = D.escalationAdvice(id) as Advice
  const forced = !!ctx?.title
  const rung = forced ? Math.max(a.rung, ctx?.status === 'red' ? 3 : 2) : a.rung
  const [done, setDone] = useState<{ raised?: string; sent?: string }>({})
  const cmo = D.medicalOfficer() as { activeName: string }
  const raise = () => {
    const title = ctx?.title || (a.reasons[0] ? `Asked for a look: ${a.reasons[0]}` : 'Asked for a look from Ask Orbit')
    const detail = ctx?.detail || (a.reasons.length ? `Raised from Ask Orbit. Why: ${a.reasons.join('; ')}.` : 'Raised from Ask Orbit.')
    D.raiseAlert(id, title, detail, ctx?.status || (rung >= 3 ? 'red' : 'yellow'))
    setDone((d) => ({ ...d, raised: cmo.activeName || 'the medical officer' }))
  }
  const send = () => {
    D.queuePacket(id)
    setDone((d) => ({ ...d, sent: a.delay }))
  }
  const btn = (primary: boolean) => ({ minHeight: 38, padding: '0 12px', borderRadius: 10, border: primary ? 0 : '1.5px solid var(--ink)', background: primary ? '#14181f' : 'var(--panel)', color: primary ? '#f3f1ea' : 'var(--ink)', fontWeight: 750, fontSize: 13.5, cursor: 'pointer' }) as const
  return (
    <div style={{ display: 'grid', gap: 10, padding: 12, borderRadius: 16, background: 'var(--panel)', border: `1.5px solid ${TONE[rung - 1]}` }}>
      <ol aria-label="Escalation ladder" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
        {NAMES.map((n, i) => (
          <li key={n} aria-current={i + 1 === rung ? 'step' : undefined} style={{ display: 'grid', gap: 4, justifyItems: 'center', textAlign: 'center' }}>
            <span style={{ width: '100%', height: 6, borderRadius: 99, background: i < rung ? TONE[i] : 'var(--paper-deep)' }} />
            <span style={{ fontSize: 11, fontWeight: i + 1 === rung ? 800 : 500, color: i + 1 === rung ? 'var(--ink)' : 'var(--muted)' }}>{n}</span>
          </li>
        ))}
      </ol>
      <strong style={{ fontSize: 15 }}>
        {rung === 1 ? 'Nothing needs passing on. Look after yourself.' : `Next step: ${a.who}`}
      </strong>
      {(forced || a.reasons.length > 0) && (
        <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 2, fontSize: 13.5 }}>
          {forced && <li>{ctx!.title}</li>}
          {a.reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      )}
      <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 2, fontSize: 13.5, color: 'var(--ink-soft)' }}>
        {(forced && rung < 3 ? [...a.steps.slice(0, 1), 'Raise an alert so the medical officer can take a look.'] : a.steps).map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {(a.canRaise || forced) && !done.raised && (
          <button type="button" onClick={raise} style={btn(true)}>
            Raise an alert for {cmo.activeName || 'the medical officer'}
          </button>
        )}
        {(a.canSend || rung >= 3) && !done.sent && (
          <button type="button" onClick={send} style={btn(!a.canRaise && !forced)}>
            Send the summary to Earth
          </button>
        )}
        <button type="button" onClick={openEarthLink} style={{ ...btn(false), border: 0, background: 'transparent', color: 'var(--accent)', textDecoration: 'underline', padding: '0 4px' }}>
          The full ladder
        </button>
      </div>
      {done.raised && <span style={{ fontSize: 13.5, color: 'var(--ok-ink)', fontWeight: 650 }}>Alert raised: {done.raised} sees it on the Crew page, and it stays open until they answer.</span>}
      {done.sent && (
        <span style={{ fontSize: 13.5, color: 'var(--ok-ink)', fontWeight: 650 }}>
          Sent: it reaches Earth in {done.sent}, and a reply takes at least twice that. Only the kinds of reading you chose to share were sent.
        </span>
      )}
    </div>
  )
}
