import { useEffect, useRef, useState, type ReactNode } from 'react'
import * as D from './data'
import { navigate } from './dc'
import { useStoreTick } from './shared'

/*
 * What is left today, one hover (or tap) away: the dock's goal button opens this list of today's
 * goals, done or not, each with the button that does it. Same goal list as Today and Rewards.
 */

type Task = { id: string; label: string; sub: string; points: number; done: boolean; href: string; optional?: boolean }

export function DockTodo({ children }: { children: (toggle: () => void, open: boolean) => ReactNode }) {
  useStoreTick()
  const [hover, setHover] = useState(false)
  const [pinned, setPinned] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const open = hover || pinned
  useEffect(() => {
    if (!pinned) return
    const off = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setPinned(false)
    }
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setPinned(false)
    window.addEventListener('pointerdown', off)
    window.addEventListener('keydown', esc)
    return () => {
      window.removeEventListener('pointerdown', off)
      window.removeEventListener('keydown', esc)
    }
  }, [pinned])

  const id = D.getState().crew.id as string
  const tasks = D.todayTasks(id) as Task[]
  const core = tasks.filter((t) => !t.optional)
  const done = core.filter((t) => t.done).length
  const next = core.find((t) => !t.done) ?? tasks.find((t) => !t.done)
  const go = (t: Task) => {
    setPinned(false)
    setHover(false)
    navigate(t.href)
  }

  return (
    <div ref={ref} style={{ position: 'relative' }} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      {children(() => setPinned((p) => !p), open)}
      {open && (
        <div role="dialog" aria-label="Today's goals" className="dock-todo">
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
            <strong style={{ fontSize: 14.5 }}>Today's goals</strong>
            <span style={{ fontSize: 12.5, color: 'var(--muted)', fontWeight: 650 }}>
              {done} of {core.length} done
            </span>
          </div>
          <div aria-hidden="true" style={{ height: 6, borderRadius: 99, background: 'var(--paper-deep)', overflow: 'hidden' }}>
            <div style={{ width: `${(done / Math.max(1, core.length)) * 100}%`, height: '100%', background: 'var(--ok)', transition: 'width 300ms ease' }} />
          </div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 4 }}>
            {tasks.map((t) => (
              <li key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 8px', borderRadius: 12, background: t === next ? 'var(--panel-2)' : 'transparent' }}>
                <span aria-hidden="true" style={{ flex: '0 0 auto', width: 20, height: 20, borderRadius: 99, display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 800, background: t.done ? 'var(--ok)' : 'transparent', color: 'var(--paper)', border: t.done ? 0 : '2px solid var(--rule-strong)' }}>
                  {t.done ? '✓' : ''}
                </span>
                <span style={{ flex: 1, minWidth: 0, display: 'grid' }}>
                  <span style={{ fontSize: 13.5, fontWeight: 650, color: t.done ? 'var(--muted)' : 'var(--ink)', textDecoration: t.done ? 'line-through' : 'none' }}>
                    {t.label}
                    {t.optional ? <span style={{ fontWeight: 600, color: 'var(--muted)' }}> · bonus</span> : null}
                  </span>
                  {!t.done && <span style={{ fontSize: 12, color: 'var(--muted)', whiteSpace: 'normal' }}>{t.sub}</span>}
                </span>
                {t.done ? (
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ok-ink)' }}>+{t.points}</span>
                ) : (
                  <button type="button" onClick={() => go(t)} style={{ flex: '0 0 auto', minHeight: 30, padding: '0 10px', borderRadius: 9, border: t === next ? 0 : '1.5px solid var(--ink)', background: t === next ? 'var(--ink)' : 'var(--panel)', color: t === next ? 'var(--paper)' : 'var(--ink)', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}>
                    {t === next ? 'Start' : 'Do it'} · +{t.points}
                  </button>
                )}
              </li>
            ))}
          </ul>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }}>{next ? 'Coins pay for doing, never for the numbers.' : 'All done for today. See you tomorrow.'}</p>
        </div>
      )}
    </div>
  )
}
