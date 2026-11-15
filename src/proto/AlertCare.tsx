import { useEffect, useReducer } from 'react'
import * as D from './data'
import { bridge } from './store'

/*
 * What to do about an alert, on the alert itself: steps for Now and Today, when to move up the
 * ladder, and the source. Every step comes from the app's sourced content (or the pattern's care
 * plan); nothing is invented here. Ticking every "Now" step counts as one care step for the person
 * the alert is about (+10 coins, once a day), so following the plan is rewarded, never the numbers.
 *
 * Also here: who the crew medical officer is (and the backup, for when they are the patient), and
 * the alerts that closed on their own because the readings came back within usual.
 */

type Alert = { id: string; crewId: string; crewName: string; title: string; status: 'yellow' | 'red'; state: string; firstSeen: number }
type Step = { id: string; text: string; go?: string; done: boolean }
type Plan = { now: Step[]; today: Step[]; escalateIf: string; source: string; nowDone: boolean; points: number }

function useTick() {
  const [, bump] = useReducer((n: number) => n + 1, 0)
  useEffect(() => D.onState(bump), [])
  return bump
}

function StepList({ a, steps, label }: { a: Alert; steps: Step[]; label: string }) {
  if (!steps.length) return null
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <p style={{ margin: 0, fontSize: 12, fontWeight: 750, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--muted)' }}>{label}</p>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 4 }}>
        {steps.map((s) => (
          <li key={s.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 8px', borderRadius: 10, background: s.done ? 'rgba(47,125,79,.08)' : 'var(--panel-2)' }}>
            <input type="checkbox" checked={s.done} onChange={() => D.tickAlertStep(a, s.id)} aria-label={`Done: ${s.text}`} style={{ marginTop: 3, width: 18, height: 18, accentColor: 'var(--ok)', flex: '0 0 auto' }} />
            <span style={{ flex: 1, minWidth: 0, fontSize: 13, lineHeight: 1.4, color: s.done ? 'var(--muted)' : 'var(--ink)', textDecoration: s.done ? 'line-through' : 'none' }}>{s.text}</span>
            {s.go && !s.done && (
              <button type="button" onClick={() => bridge.go?.(s.go as never)} style={{ flex: '0 0 auto', minHeight: 30, padding: '0 10px', borderRadius: 9, border: '1.5px solid var(--ink)', background: 'var(--panel)', color: 'var(--ink)', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}>
                Do it
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

/** The action card for one alert. `compact` drops the "Today" list (for the Today page). */
export function AlertActionCard({ a, compact = false }: { a: Alert; compact?: boolean }) {
  useTick()
  const p = D.alertPlan(a) as Plan
  return (
    <div style={{ display: 'grid', gap: 8, padding: 10, borderRadius: 14, border: '1px dashed var(--rule-strong)', background: 'var(--panel)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
        <strong style={{ fontSize: 14 }}>What to do</strong>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: p.nowDone ? 'var(--ok-ink)' : '#a8740a' }}>{p.nowDone ? 'Now steps done' : `Finish the Now steps: +${p.points} coins for ${a.crewName}`}</span>
      </div>
      <StepList a={a} steps={p.now} label="Now" />
      {!compact && <StepList a={a} steps={p.today} label="Today" />}
      <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.4, padding: '6px 8px', borderRadius: 10, background: a.status === 'red' ? 'rgba(179,38,30,.08)' : 'rgba(183,121,31,.1)' }}>
        <strong>Escalate if: </strong>
        {p.escalateIf}
      </p>
      <a href={p.source} target="_blank" rel="noreferrer" style={{ justifySelf: 'start', fontSize: 12.5, color: 'var(--accent)' }}>
        Source ↗
      </a>
    </div>
  )
}

/** Who answers alerts, and who covers when that person is the one who is unwell. */
export function MedicalOfficerSetting() {
  useTick()
  const m = D.medicalOfficer() as { primary: string; backup: string; primaryName: string; backupName: string; unwell: boolean; activeName: string }
  const crew = (D.CREW as { id: string; name: string }[]).filter((c) => c.id !== 'guest')
  const sel = { minHeight: 36, padding: '0 10px', borderRadius: 10, border: '1.5px solid var(--rule-strong)', background: 'var(--panel)', color: 'var(--ink)', font: 'inherit' } as const
  return (
    <div style={{ display: 'grid', gap: 8, padding: '12px 14px', borderRadius: 18, background: m.unwell ? 'rgba(179,38,30,.08)' : 'var(--panel)', border: `1.5px solid ${m.unwell ? 'var(--act)' : 'var(--rule)'}` }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, fontSize: 14 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <strong>Medical officer</strong>
          <select value={m.primary} onChange={(e) => D.setMedicalOfficer(e.target.value, m.backup === e.target.value ? m.primary : m.backup)} style={sel}>
            {crew.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <strong>Backup</strong>
          <select value={m.backup} onChange={(e) => D.setMedicalOfficer(m.primary, e.target.value)} style={sel}>
            {crew
              .filter((c) => c.id !== m.primary)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>
        </label>
        <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 700, color: m.unwell ? 'var(--act-ink)' : 'var(--ok-ink)' }}>Alerts go to {m.activeName}</span>
      </div>
      {m.unwell && (
        <span style={{ fontSize: 13.5, color: 'var(--ink-soft)' }}>
          {m.primaryName} has a reading at Act or an open alert of their own, so their alerts, and everyone else's, go to {m.backupName} until it clears. Nobody should have to triage themselves.
        </span>
      )}
    </div>
  )
}

/** Alerts that closed themselves because the readings came back within usual. */
export function ResolvedAlerts({ bare = false }: { bare?: boolean }) {
  useTick()
  const list = D.resolvedAlerts() as { id: string; crewName: string; title: string; resolvedAt: number; firstSeen: number }[]
  if (!list.length) return null
  const ago = (t: number) => {
    const m = Math.round((Date.now() - t) / 60000)
    return m < 60 ? `${Math.max(1, m)} min ago` : m < 2880 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} days ago`
  }
  const items = (
      <ul style={{ listStyle: 'none', margin: bare ? 0 : '10px 0 0', padding: 0, display: 'grid', gap: 6 }}>
        {list.map((a) => (
          <li key={a.id + a.resolvedAt} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'baseline', padding: '7px 12px', borderRadius: 12, background: 'rgba(47,125,79,.08)', fontSize: 13 }}>
            <span aria-hidden="true" style={{ color: 'var(--ok-ink)', fontWeight: 800 }}>
              ✓
            </span>
            <strong>
              {a.crewName}: {a.title}
            </strong>
            <span style={{ color: 'var(--muted)' }}>back within usual, closed itself {ago(a.resolvedAt)}</span>
          </li>
        ))}
      </ul>
  )
  if (bare) return items
  return (
    <details>
      <summary style={{ cursor: 'pointer', fontSize: 14, fontWeight: 650 }}>Back within usual on their own ({list.length})</summary>
      {items}
    </details>
  )
}
