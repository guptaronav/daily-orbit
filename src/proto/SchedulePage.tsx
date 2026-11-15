import { useEffect, useState, type FormEvent } from 'react'
import { blockState, doneToday, dueItems, isBlockDone, planFor, ROLE_DUTIES, toMinutes, type Block, type BlockState, type CustomBlock } from '../lib/schedule'
import * as D from './data'
import { ReminderSetting } from './Reminder'
import { bridge } from './store'
import { getSnapshot } from './store'
import { useStoreTick } from './shared'

/*
 * The mission schedule: the shared crew day, this person's role duties (nobody else sees them),
 * and blocks they add themselves. Linked blocks tick themselves when the real thing is done;
 * the rest are ticked by hand. A live "now" line runs down the timeline.
 */

const KIND: Record<string, { label: string; color: string }> = {
  routine: { label: 'Routine', color: '#6b7a90' },
  check: { label: 'Health check', color: '#0b3d91' },
  exercise: { label: 'Exercise', color: '#e8742c' },
  meal: { label: 'Meal', color: '#c9962b' },
  sleep: { label: 'Sleep', color: '#4a5670' },
  work: { label: 'Work', color: '#2b323d' },
  conference: { label: 'Ground call', color: '#12708a' },
  personal: { label: 'Personal', color: '#2f7d4f' },
  role: { label: 'Role duty', color: '#7b5cc4' },
  custom: { label: 'Yours', color: '#14181f' },
}
const ADD_KINDS = [
  ['work', 'Work'],
  ['exercise', 'Exercise'],
  ['personal', 'Personal'],
  ['check', 'Health'],
  ['conference', 'Ground call'],
]

const pad = (n: number) => String(n).padStart(2, '0')
const endOf = (b: Block) => {
  const m = toMinutes(b.start) + b.minutes
  return `${pad(Math.floor(m / 60) % 24)}:${pad(m % 60)}`
}
const go = (screen?: string) => screen && bridge.go?.(screen as never)
const inMinutes = (m: number) => (m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60 ? `${m % 60} min` : ''}`.trim())

export function SchedulePage() {
  useStoreTick()
  // The clock: re-render every 30 s so "now" moves.
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(t)
  }, [])
  const [form, setForm] = useState({ title: '', start: '15:00', minutes: '30', kind: 'work', repeat: 'daily' })
  const [problem, setProblem] = useState('')
  const [added, setAdded] = useState(0)

  const s = D.getState()
  const crew = s.crew as { id: string; name: string; role: string }
  const role = crew.role || ''
  const store = D.scheduleStore(crew.id)
  const blocks = planFor(role, store.custom as CustomBlock[], now)
  const done = doneToday(getSnapshot().events[crew.id] ?? [], now)
  const meals = (D.intake(crew.id) as { meals: string[] }).meals
  const ticks: string[] = D.ticksToday(crew.id)
  const rows = blocks.map((b) => {
    const isDone = isBlockDone(b, done, meals, ticks)
    return { b, isDone, state: blockState(b, now, isDone) as BlockState }
  })
  const doneN = rows.filter((r) => r.isDone).length
  const t = now.getHours() * 60 + now.getMinutes()
  const nowIndex = rows.findIndex((r) => toMinutes(r.b.start) > t)
  const due = dueItems(getSnapshot().measurements[crew.id] ?? [], getSnapshot().events[crew.id] ?? [], now)
  const C = 2 * Math.PI * 27
  const roleDuties = ROLE_DUTIES[role] ?? []

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const title = form.title.trim()
    if (!title) return setProblem('Give the block a name.')
    if (!/^\d{2}:\d{2}$/.test(form.start)) return setProblem('Pick a start time.')
    D.addBlock(crew.id, { title: title.slice(0, 60), start: form.start, minutes: Number(form.minutes), repeat: form.repeat, addKind: form.kind, detail: KIND[form.kind]?.label })
    setProblem('')
    setForm((f) => ({ ...f, title: '' }))
    setAdded((n) => n + 1)
  }

  const nowLine = (
    <li key="now-line" aria-hidden="true" style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '2px 0' }}>
      <span style={{ width: 64, textAlign: 'right', fontSize: 12.5, fontWeight: 800, color: 'var(--act)' }}>
        {pad(now.getHours())}:{pad(now.getMinutes())}
      </span>
      <span style={{ width: 10, height: 10, borderRadius: 99, background: 'var(--act)', boxShadow: '0 0 0 4px rgba(179,38,30,.18)', animation: 'ms-twinkle 1.6s ease-in-out infinite' }} />
      <span style={{ flex: 1, borderTop: '2px solid var(--act)' }} />
    </li>
  )

  return (
    <main style={{ width: '100%', maxWidth: 1440, margin: '0 auto', padding: '28px clamp(16px, 3vw, 32px) 72px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'stretch', gap: 20 }}>
        <div style={{ flex: '2 1 520px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 14, padding: '8px 0', animation: 'lg-rise 520ms cubic-bezier(.22,1,.36,1) both' }}>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)' }}>
            Mission schedule · {crew.id === 'guest' ? 'guest' : crew.name}
            {role ? ` · ${role}` : ''}
          </p>
          <h1 style={{ margin: 0, fontSize: 'clamp(40px, 6vw, 76px)', lineHeight: 0.92, fontWeight: 750, letterSpacing: '-0.05em' }}>
            Your day,
            <br />
            block by block.
          </h1>
          <p style={{ margin: 0, maxWidth: 560, fontSize: 17, lineHeight: 1.5, color: 'var(--muted)' }}>
            The crew day everyone shares, the duties only your role carries, and anything you add yourself. Health blocks tick themselves when you do them.
          </p>
        </div>

        <section aria-label="Today so far" style={{ flex: '1 1 340px', padding: 22, borderRadius: 28, background: '#14181f', color: '#f3f1ea', display: 'flex', flexDirection: 'column', gap: 16, animation: 'lg-rise 520ms 80ms cubic-bezier(.22,1,.36,1) both' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <svg width="68" height="68" viewBox="0 0 64 64" aria-hidden="true">
              <circle cx="32" cy="32" r="27" fill="none" stroke="rgba(243,241,234,.14)" strokeWidth="7" />
              <circle cx="32" cy="32" r="27" fill="none" stroke="#f6c445" strokeWidth="7" strokeLinecap="round" strokeDasharray={`${C * (rows.length ? doneN / rows.length : 0)} ${C}`} transform="rotate(-90 32 32)" style={{ transition: 'stroke-dasharray 600ms cubic-bezier(.22,1,.36,1)' }} />
              <text x="32" y="37" textAnchor="middle" fill="#f3f1ea" fontSize="15" fontWeight="750">
                {doneN}/{rows.length}
              </text>
            </svg>
            <div>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{rows.length && doneN === rows.length ? 'Day complete' : 'Blocks done today'}</p>
              <p style={{ margin: '2px 0 0', fontSize: 13.5, color: 'rgba(243,241,234,.7)' }}>Coins come from the health tasks themselves, not from ticks.</p>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: 13.5, color: 'rgba(243,241,234,.75)' }}>The red line on the timeline marks now. Health blocks tick themselves when you do them.</p>
        </section>
      </div>

      <ReminderSetting />
      {(() => {
        const g = D.envGuide(s.envId) as { label: string; dayLength: string; equipment: string[] }
        if (!g.dayLength && !g.equipment.length) return null
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, padding: '12px 16px', borderRadius: 18, background: 'var(--panel-2)', border: '1px solid var(--rule)', fontSize: 14 }}>
            <strong>{g.label}:</strong>
            {g.dayLength && <span>{g.dayLength}</span>}
            {g.equipment.length > 0 && <span style={{ color: 'var(--muted)' }}>Exercise and health kit here: {g.equipment.join('; ')}.</span>}
          </div>
        )
      })()}
      {due.length > 0 && (
        <div role="status" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 18, background: 'var(--accent-wash)', border: '1px solid var(--rule)' }}>
          <strong style={{ fontSize: 14 }}>Due now:</strong>
          {due.map((d) => (
            <button key={d.id} type="button" onClick={() => go(d.link)} title={d.assumption} style={{ minHeight: 36, padding: '0 14px', borderRadius: 99, border: '1.5px solid var(--accent)', background: 'var(--panel)', color: 'var(--accent)', fontWeight: 700, cursor: 'pointer' }}>
              {d.label}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 24 }}>
        {/* Timeline */}
        <section aria-label="Today's timeline" style={{ flex: '2 1 560px', borderRadius: 28, background: 'var(--panel)', border: '1px solid var(--rule)', padding: 'clamp(16px, 2.4vw, 26px)', animation: 'lg-rise 520ms 120ms cubic-bezier(.22,1,.36,1) both' }}>
          <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rows.map(({ b, isDone, state }, i) => {
              const k = KIND[b.kind === 'custom' ? ((b as Block & { addKind?: string }).addKind ?? 'custom') : b.kind] ?? KIND.custom
              const mine = b.kind === 'custom'
              const auto = !!(b.doneBy || b.meal)
              const item = (
                <li key={b.id} style={{ display: 'flex', gap: 10, alignItems: 'stretch', opacity: isDone ? 0.62 : 1, transition: 'opacity 300ms ease' }}>
                  <span style={{ width: 64, flex: '0 0 auto', textAlign: 'right', paddingTop: 12, fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: state === 'now' ? 'var(--ink)' : 'var(--muted)' }}>{b.start}</span>
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', gap: 12, alignItems: 'center', padding: '10px 12px 10px 14px', borderRadius: 16, background: state === 'now' ? 'var(--panel-2)' : 'transparent', border: `2px solid ${state === 'now' ? 'var(--ink)' : 'var(--rule)'}`, borderLeft: `6px solid ${k.color}`, boxShadow: state === 'now' ? '0 10px 24px -16px rgba(20,24,31,.5)' : 'none' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                        <strong style={{ fontSize: 15.5, textDecoration: isDone ? 'line-through' : 'none' }}>{b.title}</strong>
                        {b.roles && b.kind === 'role' && <span style={{ fontSize: 11.5, fontWeight: 750, padding: '2px 8px', borderRadius: 99, background: '#7b5cc4', color: '#fff' }}>{role} only</span>}
                        {mine && <span style={{ fontSize: 11.5, fontWeight: 750, padding: '2px 8px', borderRadius: 99, background: 'var(--ink)', color: 'var(--paper)' }}>Yours{(b as CustomBlock).repeat === 'once' ? ', today' : ', daily'}</span>}
                        {state === 'now' && <span style={{ fontSize: 11.5, fontWeight: 750, padding: '2px 8px', borderRadius: 99, background: '#f6c445', color: '#14181f' }}>Now</span>}
                        {state === 'missed' && !isDone && <span style={{ fontSize: 11.5, fontWeight: 650, padding: '2px 8px', borderRadius: 99, background: 'var(--paper-deep)', color: 'var(--muted)' }}>Passed</span>}
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--muted)' }}>
                        {b.start} to {endOf(b)} · {k.label}
                        {b.detail && b.detail !== k.label ? ` · ${b.detail}` : ''}
                        {auto ? ' · ticks itself when done' : ''}
                      </p>
                    </div>
                    {b.link && !isDone && (
                      <button type="button" onClick={() => go(b.link)} style={{ minHeight: 36, padding: '0 12px', borderRadius: 10, border: '1.5px solid var(--ink)', background: 'var(--panel)', color: 'var(--ink)', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        Open
                      </button>
                    )}
                    {!auto ? (
                      <button type="button" role="checkbox" aria-checked={isDone} aria-label={`Mark ${b.title} done`} onClick={() => D.tickBlock(crew.id, b.id)} style={{ width: 32, height: 32, flex: '0 0 auto', borderRadius: 10, border: isDone ? 0 : '2px solid var(--rule-strong)', background: isDone ? '#2f7d4f' : 'var(--panel)', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>
                        {isDone ? '✓' : ''}
                      </button>
                    ) : (
                      <span aria-label={isDone ? 'Done' : 'Not done yet'} style={{ display: 'grid', placeItems: 'center', width: 32, height: 32, flex: '0 0 auto', borderRadius: 10, background: isDone ? '#2f7d4f' : 'var(--paper-deep)', color: '#fff', fontWeight: 800 }}>
                        {isDone ? '✓' : ''}
                      </span>
                    )}
                    {mine && (
                      <button type="button" aria-label={`Remove ${b.title}`} onClick={() => D.removeBlock(crew.id, b.id)} style={{ width: 32, height: 32, flex: '0 0 auto', borderRadius: 10, border: 0, background: 'transparent', color: 'var(--muted)', fontSize: 18, cursor: 'pointer' }}>
                        ×
                      </button>
                    )}
                  </div>
                </li>
              )
              return i === nowIndex ? [nowLine, item] : item
            })}
            {(nowIndex === -1 || rows.length === 0) && nowLine}
          </ol>
        </section>

        {/* Add a block, and what the role carries */}
        <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: 20, position: 'sticky', top: 104 }}>
          <form onSubmit={submit} aria-label="Add to my day" style={{ borderRadius: 26, background: 'var(--panel)', border: '1px solid var(--rule)', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 750, letterSpacing: '-0.03em' }}>Add to my day</h2>
            <p style={{ margin: 0, fontSize: 13.5, color: 'var(--muted)' }}>Only you see blocks you add.</p>
            <label style={{ display: 'grid', gap: 6, fontSize: 13.5, fontWeight: 650 }}>
              What
              <input value={form.title} maxLength={60} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Filter swap, call home" aria-invalid={!!problem && !form.title.trim()} style={{ minHeight: 46, padding: '0 12px', borderRadius: 12, border: '2px solid var(--rule)', background: 'var(--panel)', color: 'var(--ink)', font: 'inherit' }} />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <label style={{ display: 'grid', gap: 6, fontSize: 13.5, fontWeight: 650 }}>
                Starts
                <input type="time" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} style={{ minHeight: 46, padding: '0 10px', borderRadius: 12, border: '2px solid var(--rule)', background: 'var(--panel)', color: 'var(--ink)', font: 'inherit' }} />
              </label>
              <label style={{ display: 'grid', gap: 6, fontSize: 13.5, fontWeight: 650 }}>
                Length
                <select value={form.minutes} onChange={(e) => setForm({ ...form, minutes: e.target.value })} style={{ minHeight: 46, padding: '0 10px', borderRadius: 12, border: '2px solid var(--rule)', background: 'var(--panel)', color: 'var(--ink)', font: 'inherit' }}>
                  {[15, 30, 45, 60, 90, 120].map((m) => (
                    <option key={m} value={m}>
                      {inMinutes(m)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <fieldset style={{ border: 0, margin: 0, padding: 0, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <legend style={{ fontSize: 13.5, fontWeight: 650, marginBottom: 6 }}>Kind</legend>
              {ADD_KINDS.map(([k, label]) => (
                <button key={k} type="button" aria-pressed={form.kind === k} onClick={() => setForm({ ...form, kind: k })} style={{ minHeight: 36, padding: '0 12px', borderRadius: 99, border: `2px solid ${form.kind === k ? KIND[k].color : 'var(--rule)'}`, background: form.kind === k ? KIND[k].color : 'var(--panel)', color: form.kind === k ? '#fff' : 'var(--ink)', fontWeight: 650, cursor: 'pointer' }}>
                  {label}
                </button>
              ))}
            </fieldset>
            <fieldset style={{ border: 0, margin: 0, padding: 0, display: 'flex', gap: 6 }}>
              <legend style={{ fontSize: 13.5, fontWeight: 650, marginBottom: 6 }}>Repeat</legend>
              {[
                ['daily', 'Every day'],
                ['once', 'Today only'],
              ].map(([k, label]) => (
                <button key={k} type="button" aria-pressed={form.repeat === k} onClick={() => setForm({ ...form, repeat: k })} style={{ flex: 1, minHeight: 40, borderRadius: 12, border: `2px solid ${form.repeat === k ? 'var(--ink)' : 'var(--rule)'}`, background: form.repeat === k ? 'var(--ink)' : 'var(--panel)', color: form.repeat === k ? 'var(--paper)' : 'var(--ink)', fontWeight: 700, cursor: 'pointer' }}>
                  {label}
                </button>
              ))}
            </fieldset>
            {problem && (
              <p role="alert" style={{ margin: 0, fontSize: 13.5, color: 'var(--act-ink)' }}>
                {problem}
              </p>
            )}
            <button type="submit" className="fw-press" style={{ minHeight: 52, borderRadius: 14, border: 0, background: '#14181f', color: '#f3f1ea', boxShadow: '0 5px 0 #000', fontSize: 15.5, fontWeight: 750, cursor: 'pointer' }}>
              Add block
            </button>
            {added > 0 && (
              <p key={added} role="status" style={{ margin: 0, fontSize: 13.5, color: 'var(--ok-ink)', animation: 'ms-pop 300ms ease both' }}>
                Added to your day.
              </p>
            )}
          </form>

          <section aria-label="Your role" style={{ borderRadius: 26, background: '#1e1838', color: '#f3f1ea', padding: 20 }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#c9b8ff' }}>{role ? `${role} duties` : 'No role set'}</p>
            {roleDuties.length ? (
              <ul style={{ margin: '10px 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: 8 }}>
                {roleDuties.map((d) => (
                  <li key={d.id} style={{ fontSize: 14 }}>
                    <strong>{d.title}</strong>
                    <span style={{ display: 'block', color: 'rgba(243,241,234,.7)', fontSize: 13 }}>{d.detail}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ margin: '8px 0 0', fontSize: 14, color: 'rgba(243,241,234,.75)' }}>Pick a crew member in the top bar to see their role's duties.</p>
            )}
            <p style={{ margin: '12px 0 0', fontSize: 12.5, color: 'rgba(243,241,234,.6)' }}>Only this role sees these. Other crew members have their own.</p>
          </section>
        </div>
      </div>
    </main>
  )
}
