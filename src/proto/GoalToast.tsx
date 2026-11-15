import { useEffect, useState } from 'react'
import * as D from './data'
import { bridge } from './store'
import { useStoreTick } from './shared'

/*
 * The one piece of feedback every earning action shares. Whatever earned coins (a mirror check,
 * water, a meal, exercise, the crate, a discovery), a pill above the dock says what it was and how
 * today's goals stand, so each action visibly feeds the same daily goals, streak and level.
 */

type Toast = { n: number; why: string; k: number; capped?: boolean }

export function GoalToast() {
  const [t, setT] = useState<Toast | null>(null)
  // The event that earned the coins may land a moment after the announcement: recount when data changes.
  useStoreTick()
  useEffect(() => {
    const on = (e: Event) => {
      const d = (e as CustomEvent).detail || {}
      if (!d.n && !d.capped) return
      setT((p) => ({ n: d.n || 0, why: d.why || 'Coins earned', capped: !!d.capped, k: (p?.k ?? 0) + 1 }))
    }
    window.addEventListener('chm:coins', on)
    return () => window.removeEventListener('chm:coins', on)
  }, [])
  useEffect(() => {
    if (!t) return
    const x = setTimeout(() => setT(null), 4200)
    return () => clearTimeout(x)
  }, [t])
  if (!t) return null
  if (t.capped) {
    return (
      <div key={t.k} role="status" style={{ position: 'fixed', left: '50%', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 108px)', zIndex: 55, transform: 'translateX(-50%)', padding: '10px 16px', borderRadius: 999, background: '#14181f', color: '#f3f1ea', boxShadow: '0 18px 36px -14px rgba(0,0,0,.6)', animation: 'gt-in 4.2s cubic-bezier(.22,1,.36,1) forwards', maxWidth: 'calc(100vw - 32px)', textAlign: 'center' }}>
        <strong>Daily coin limit reached ({D.COIN_CAP}).</strong> <span style={{ color: 'rgba(243,241,234,.8)' }}>Logging still counts for your health; coins start again tomorrow.</span>
      </div>
    )
  }
  const id = D.getState().crew.id
  const goals = D.todayTasks(id) as { done: boolean; optional?: boolean }[]
  const req = goals.filter((g) => !g.optional)
  const done = req.filter((g) => g.done).length
  const all = done === req.length
  return (
    <div key={t.k} role="status" style={{ position: 'fixed', left: '50%', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 108px)', zIndex: 55, transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px 10px 14px', borderRadius: 999, background: '#14181f', color: '#f3f1ea', boxShadow: '0 18px 36px -14px rgba(0,0,0,.6)', animation: 'gt-in 4.2s cubic-bezier(.22,1,.36,1) forwards', whiteSpace: 'nowrap', maxWidth: 'calc(100vw - 32px)' }}>
      <span style={{ display: 'grid', placeItems: 'center', minWidth: 46, height: 30, padding: '0 8px', borderRadius: 99, background: 'radial-gradient(circle at 35% 35%, #ffe08a, #f6c445 55%, #c9962b)', color: '#14181f', fontWeight: 800 }}>+{t.n}</span>
      <span style={{ fontWeight: 650, overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.why}</span>
      <span aria-hidden="true" style={{ display: 'flex', gap: 4 }}>
        {req.map((g, i) => (
          <span key={i} style={{ width: 9, height: 9, borderRadius: 99, background: g.done ? '#f6c445' : 'rgba(243,241,234,.25)' }} />
        ))}
      </span>
      <button type="button" onClick={() => bridge.go?.('today' as never)} style={{ border: 0, background: 'transparent', color: all ? '#7ef0c5' : 'rgba(243,241,234,.8)', fontWeight: 700, cursor: 'pointer', padding: '0 4px' }}>
        {all ? 'All goals done today' : `Today's goals ${done} of ${req.length}`}
      </button>
    </div>
  )
}
