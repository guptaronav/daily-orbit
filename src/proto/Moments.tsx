import { useEffect, useReducer } from 'react'
import * as D from './data'
import * as P from './parts'

/*
 * Moments worth a pause, each shown once: a streak shield that saved a streak, and a level-up
 * screen that says what the new level unlocked. Never a guilt message, never a nag.
 */

type Unlock = { lv: number; kind: string; id: string; label: string; what: string }
type Moment = { kind: 'shield'; key: string; text: string } | { kind: 'level'; key: number; lv: number; rank: string; unlocks: Unlock[] }

export function Moments() {
  const [, bump] = useReducer((n: number) => n + 1, 0)
  useEffect(() => D.onState(bump), [])
  const s = D.getState()
  if (!s.crew?.id) return null
  const ms = D.pendingMoments(s.crew.id) as Moment[]
  const m = ms[0]
  if (!m) return null
  const close = () => {
    D.markMoment(s.crew.id, m.kind, m.key)
    bump()
  }

  if (m.kind === 'shield') {
    return (
      <div role="status" style={{ position: 'fixed', top: 96, left: '50%', transform: 'translateX(-50%)', zIndex: 58, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px 12px 16px', borderRadius: 18, background: '#14181f', color: '#f3f1ea', boxShadow: '0 20px 40px -18px rgba(0,0,0,.6)', animation: 'ms-pop 360ms cubic-bezier(.34,1.56,.64,1) both', maxWidth: 'calc(100vw - 32px)' }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#7ef0c5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d={D.ICONS.shield} />
        </svg>
        <strong style={{ fontSize: 15.5 }}>{m.text}</strong>
        <button type="button" onClick={close} style={{ minHeight: 34, padding: '0 12px', borderRadius: 10, border: 0, background: '#f3f1ea', color: '#14181f', fontWeight: 750, cursor: 'pointer' }}>
          Nice
        </button>
      </div>
    )
  }

  return (
    <div role="dialog" aria-modal="true" aria-label={`Level ${m.lv} reached`} style={{ position: 'fixed', inset: 0, zIndex: 90, display: 'grid', placeItems: 'center', padding: 16, background: 'rgba(7,9,15,.6)', backdropFilter: 'blur(4px)' }}>
      <div style={{ width: 'min(440px, 100%)', borderRadius: 28, background: 'radial-gradient(circle at 50% 0%, #2a3a70, #0b1220 70%)', color: '#f3f1ea', padding: 26, display: 'grid', gap: 14, justifyItems: 'center', textAlign: 'center', boxShadow: '0 40px 80px -30px rgba(0,0,0,.8)', animation: 'ms-pop 420ms cubic-bezier(.34,1.56,.64,1) both' }}>
        <div style={{ animation: 'ob-bob 3s ease-in-out infinite' }}>
          <P.Avatar crew={s.crew} gear={D.gear(s.crew.id)} size={96} ring="#f6c445" level={m.lv} />
        </div>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 750, letterSpacing: '.08em', textTransform: 'uppercase', color: '#f6c445' }}>Level up</p>
        <h2 style={{ margin: 0, fontSize: 34, fontWeight: 800, letterSpacing: '-0.04em' }}>
          Level {m.lv} · {m.rank}
        </h2>
        {m.unlocks.length > 0 && (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8, width: '100%' }}>
            {m.unlocks.map((u) => (
              <li key={u.id} style={{ padding: '10px 12px', borderRadius: 14, background: 'rgba(243,241,234,.08)', border: '1px solid rgba(243,241,234,.15)' }}>
                <strong>Unlocked: {u.label}</strong>
                <span style={{ display: 'block', fontSize: 13, color: 'rgba(243,241,234,.7)' }}>{u.what}</span>
              </li>
            ))}
          </ul>
        )}
        <button type="button" className="fw-press" onClick={close} autoFocus style={{ minHeight: 46, padding: '0 22px', borderRadius: 14, border: 0, background: '#f6c445', color: '#14181f', boxShadow: '0 5px 0 #a8740a', fontWeight: 800, cursor: 'pointer' }}>
          Keep going
        </button>
      </div>
    </div>
  )
}
