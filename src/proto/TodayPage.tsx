import { useEffect, useReducer } from 'react'
import { readiness, type ReadinessLevel } from '../lib/readiness'
import { blockState, doneToday, isBlockDone, planFor, toMinutes, type CustomBlock } from '../lib/schedule'
import { useGroundLink } from './GroundLink'
import * as D from './data'
import * as P from './parts'
import { bridge, getSnapshot } from './store'

/*
 * Today: what to do today. Readiness and its reasons, the living body figure, the next block on
 * the schedule, today's goals (the one goal list every screen reads), level and crew progress, and
 * a short "needs a look" list that links to where each thing is handled. Full detail lives on its
 * own page (Body, Schedule, Rewards, Escalate), so nothing here repeats it.
 */

const LEVEL: Record<ReadinessLevel, { bg: string; ink: string; ring: string; line: string }> = {
  ready: { bg: 'rgba(47,125,79,.12)', ink: 'var(--ok-ink)', ring: 'var(--ok)', line: 'Fine for demanding work today.' },
  check: { bg: 'rgba(183,121,31,.14)', ink: 'var(--watch-ink)', ring: 'var(--watch)', line: 'Take a closer look before demanding work.' },
  notToday: { bg: 'rgba(179,38,30,.12)', ink: 'var(--act-ink)', ring: 'var(--act)', line: 'Talk to your crew medical officer before demanding work.' },
  unknown: { bg: 'var(--paper-deep)', ink: 'var(--nodata-ink)', ring: 'var(--nodata)', line: 'Do a mirror check to build your baseline.' },
}
const TONE: Record<string, string> = { gray: 'var(--nodata)', green: 'var(--ok)', yellow: 'var(--watch)', red: 'var(--act)' }
const WORD: Record<string, string> = { gray: 'No data', green: 'Within usual', yellow: 'Watch', red: 'Act' }

const card = { borderRadius: 26, background: 'var(--panel)', border: '1px solid var(--rule)', padding: 18, display: 'grid', gap: 10, alignContent: 'start' } as const
const kicker = { margin: 0, fontSize: 12, fontWeight: 750, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--muted)' } as const
const go = (s: string) => bridge.go?.(s as never)
const screenFor = (href: string) => (href.startsWith('Mirror') ? 'mirror' : href.startsWith('Manual') ? 'manual' : 'today')

export function TodayPage() {
  const [, bump] = useReducer((n: number) => n + 1, 0)
  useEffect(() => D.onState(bump), [])
  useEffect(() => {
    const t = setInterval(bump, 30_000)
    return () => clearInterval(t)
  }, [])
  const link = useGroundLink()

  const s = D.getState()
  const crew = s.crew as { id: string; name: string; role: string }
  const cd = D.crewData(crew.id) as { regions: Record<string, { label: string; status: string }>; readings: Record<string, { latest: { v: number } | null }> }
  const regions = D.REGIONS.map((r: { id: string; label: string }) => ({ id: r.id, label: r.label, status: cd.regions[r.id]?.status ?? 'gray' }))
  const pats = D.patterns(crew.id) as { id: string; title: string; status: 'yellow' | 'red'; rungName: string }[]
  const gaps = D.gaps(crew.id) as { id: string; measured: { text: string }[]; rated: { label: string; value: number } }[]
  const open = (D.alerts() as { crewId: string; title: string; status: 'yellow' | 'red'; state: string }[]).filter((a) => a.crewId === crew.id && a.state !== 'closed')
  const rd = readiness({ regions: regions.map((r) => ({ label: r.label, status: r.status as never })), patterns: pats, openAlerts: open, gaps: gaps.length })
  const lv = LEVEL[rd.level]
  const hr = cd.readings.heartRate?.latest?.v ?? null
  const water = D.intake(crew.id) as { water: number; goal: number; meals: string[] }
  const hz = D.hazards(crew.id) as { id: string; name: string; status: string }[]
  const budget = D.radiationBudget(crew.id)

  const now = new Date()
  const plan = planFor(crew.role || '', D.scheduleStore(crew.id).custom as CustomBlock[], now)
  const done = doneToday(getSnapshot().events[crew.id] ?? [], now)
  const rows = plan.map((b) => ({ b, st: blockState(b, now, isBlockDone(b, done, water.meals, D.ticksToday(crew.id))) }))
  const next = rows.find((r) => r.st === 'now') ?? rows.find((r) => r.st === 'upcoming')
  const minsTo = next ? toMinutes(next.b.start) - (now.getHours() * 60 + now.getMinutes()) : 0
  const hour = now.getHours()
  const hello = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const name = crew.id === 'guest' ? 'crew member' : crew.name
  const goals = D.todayTasks(crew.id) as { id: string; label: string; sub: string; points: number; done: boolean; href: string; optional?: boolean }[]
  const req = goals.filter((q) => !q.optional)
  const reqDone = req.filter((q) => q.done).length
  const lvl = D.level((D.wallet(crew.id) as { xp: number }).xp) as { n: number; rank: string; into: number; need: number; frac: number }
  const cg = D.crewGoal() as { frac: number }
  const look: { status: string; text: string; to: string; cta: string }[] = [
    ...pats.map((p) => ({ status: p.status, text: `${p.title}: next step ${p.rungName}`, to: 'bodymap', cta: 'Care plan' })),
    ...gaps.map((x) => ({ status: 'yellow', text: `You rated your ${x.rated.label} ${x.rated.value}/10, but ${x.measured[0].text}`, to: 'bodymap', cta: 'See why' })),
    ...hz.filter((h) => h.status === 'yellow' || h.status === 'red').map((h) => ({ status: h.status, text: `${h.name} hazard`, to: 'bodymap', cta: 'Five hazards' })),
    ...(budget.status !== 'green' ? [{ status: budget.status, text: `Career radiation dose ${Math.round(budget.used)} of ${budget.limit} mSv`, to: 'bodymap', cta: 'Radiation' }] : []),
  ]

  return (
    <main style={{ width: '100%', maxWidth: 1440, margin: '0 auto', padding: '24px clamp(16px, 3vw, 32px) 72px', boxSizing: 'border-box', display: 'grid', gap: 18 }}>
      {/* Hero: who, where, readiness, and the living body */}
      <section style={{ display: 'flex', flexWrap: 'wrap', gap: 18, alignItems: 'stretch', animation: 'lg-rise 520ms cubic-bezier(.22,1,.36,1) both' }}>
        <div style={{ flex: '2 1 520px', display: 'grid', gap: 14, alignContent: 'end' }}>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)' }}>
            Mission day {budget.missionDays + 1} · {s.env.label} · {D.formatDelay(s.delay)} to Earth{crew.role ? ` · ${crew.role}` : ''}
          </p>
          <h1 style={{ margin: 0, fontSize: 'clamp(40px, 6vw, 76px)', lineHeight: 0.92, fontWeight: 750, letterSpacing: '-0.05em' }}>
            {hello},
            <br />
            {name}.
          </h1>
          <div role="status" style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', padding: '14px 16px', borderRadius: 20, background: lv.bg, border: `2px solid ${lv.ring}`, maxWidth: 720 }}>
            <span style={{ display: 'grid', placeItems: 'center', minWidth: 132, padding: '10px 16px', borderRadius: 14, background: lv.ring, color: 'var(--paper)', fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>{rd.label}</span>
            <div style={{ flex: '1 1 260px', display: 'grid', gap: 4 }}>
              <strong style={{ color: lv.ink, fontSize: 15.5 }}>{lv.line}</strong>
              <span style={{ fontSize: 13.5, color: 'var(--ink-soft)' }}>Because: {rd.reasons.slice(0, 3).join('; ')}.</span>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>Readiness is a prompt from your own readings, not a medical clearance.</span>
            </div>
          </div>
        </div>
        <div style={{ flex: '1 1 300px', borderRadius: 28, background: '#14181f', color: '#f3f1ea', padding: 18, display: 'flex', gap: 14, alignItems: 'center' }}>
          <div style={{ width: 150, flex: '0 0 auto' }}>
            <P.BodyFigure statuses={Object.fromEntries(regions.map((r) => [r.id, r.status]))} interactive={false} markers={true} height="230px" uid="today" bpm={hr} alertRegions={D.alertRegions(crew.id)} />
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            <p style={{ ...kicker, color: 'rgba(243,241,234,.6)' }}>Live body</p>
            <p style={{ margin: 0, display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 40, fontWeight: 750, letterSpacing: '-0.04em' }}>{hr ? Math.round(hr) : '—'}</span>
              <span style={{ color: 'rgba(243,241,234,.7)' }}>bpm, latest</span>
            </p>
            <span style={{ fontSize: 13, color: 'rgba(243,241,234,.75)' }}>The heart beats at your measured rate. Regions with an open alert glow.</span>
            <button type="button" onClick={() => go('bodymap')} style={{ justifySelf: 'start', minHeight: 36, padding: '0 12px', borderRadius: 10, border: '1.5px solid rgba(243,241,234,.4)', background: 'transparent', color: '#f3f1ea', fontWeight: 700, cursor: 'pointer' }}>
              Open the body map
            </button>
          </div>
        </div>
      </section>

      {D.reportStatus(crew.id).ready && (
        <section role="status" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: 20, background: 'rgba(246,196,69,.16)', border: '2px solid #f6c445' }}>
          <strong style={{ fontSize: 16 }}>Your week is complete.</strong>
          <span style={{ flex: '1 1 260px', fontSize: 14.5, color: 'var(--ink-soft)' }}>Seven days of readings, patterns, alerts and routine, on one page for the flight surgeon.</span>
          <button type="button" className="fw-press" onClick={() => go('report')} style={{ minHeight: 42, padding: '0 16px', borderRadius: 12, border: 0, background: '#14181f', color: '#f3f1ea', boxShadow: '0 4px 0 #000', fontWeight: 750, cursor: 'pointer' }}>
            Read your weekly report
          </button>
        </section>
      )}
      {/* Row: what is next, today's goals, and progress (one list of goals, read by every screen) */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 14 }}>
        <div style={{ ...card, background: '#14181f', color: '#f3f1ea', border: 0 }}>
          <p style={{ ...kicker, color: '#f6c445' }}>{next ? (next.st === 'now' ? 'Now' : `Next, in ${minsTo < 60 ? `${minsTo} min` : `${Math.floor(minsTo / 60)} h ${minsTo % 60} min`}`) : 'Schedule'}</p>
          <strong style={{ fontSize: 19, letterSpacing: '-0.02em' }}>{next ? next.b.title : 'Nothing else today'}</strong>
          {next && <span style={{ fontSize: 13.5, color: 'rgba(243,241,234,.7)' }}>{next.b.start} · {next.b.minutes} min</span>}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {next?.b.link && (
              <button type="button" className="fw-press" onClick={() => go(next.b.link!)} style={{ minHeight: 40, padding: '0 14px', borderRadius: 12, border: 0, background: '#f6c445', color: '#14181f', boxShadow: '0 4px 0 #a8740a', fontWeight: 750, cursor: 'pointer' }}>
                Start it
              </button>
            )}
            <button type="button" onClick={() => go('schedule')} style={{ minHeight: 40, padding: '0 12px', borderRadius: 12, border: '1.5px solid rgba(243,241,234,.35)', background: 'transparent', color: '#f3f1ea', fontWeight: 650, cursor: 'pointer' }}>
              Full schedule
            </button>
          </div>
        </div>

        <div style={{ ...card, gridColumn: 'span 2' }} className="today-goals">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
            <p style={kicker}>Today's goals</p>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>
              {reqDone} of {req.length} done{reqDone === req.length ? ', all done' : ''} · coins for doing, never for the numbers
            </span>
          </div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6 }}>
            {goals.map((q) => (
              <li key={q.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 12, background: q.done ? 'rgba(47,125,79,.08)' : 'var(--panel-2)' }}>
                <span aria-hidden="true" style={{ display: 'grid', placeItems: 'center', width: 22, height: 22, flex: '0 0 auto', borderRadius: 99, background: q.done ? 'var(--ok)' : 'transparent', border: q.done ? 0 : '2px solid var(--rule-strong)', color: 'var(--paper)', fontSize: 12, fontWeight: 800 }}>
                  {q.done ? '✓' : ''}
                </span>
                <span style={{ flex: 1, minWidth: 0, display: 'grid' }}>
                  <span style={{ fontWeight: 650, fontSize: 14.5, textDecoration: q.done ? 'line-through' : 'none', color: q.done ? 'var(--muted)' : 'var(--ink)' }}>
                    {q.label}
                    {q.optional ? <span style={{ fontWeight: 500, color: 'var(--muted)' }}> · bonus</span> : null}
                  </span>
                  {!q.done && <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>{q.sub}</span>}
                </span>
                <span style={{ fontSize: 13, fontWeight: 750, color: q.done ? 'var(--muted)' : '#a8740a', whiteSpace: 'nowrap' }}>+{q.points}</span>
                {!q.done && (
                  <button type="button" onClick={() => go(screenFor(q.href))} style={{ minHeight: 34, padding: '0 12px', borderRadius: 10, border: '1.5px solid var(--ink)', background: 'var(--panel)', color: 'var(--ink)', fontWeight: 700, cursor: 'pointer' }}>
                    Do it
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div style={card}>
          <p style={kicker}>Your progress</p>
          <div style={{ display: 'grid', gap: 4 }}>
            <span style={{ fontSize: 13.5 }}>
              Level {lvl.n} · {lvl.rank} · {lvl.need - lvl.into} XP to level {lvl.n + 1}
            </span>
            <div role="progressbar" aria-label="Level progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(lvl.frac * 100)} style={{ height: 8, borderRadius: 99, background: 'var(--paper-deep)', overflow: 'hidden' }}>
              <div style={{ width: `${lvl.frac * 100}%`, height: '100%', background: '#f6c445' }} />
            </div>
          </div>
          <span style={{ fontSize: 13.5 }}>Crew weekly goal: {Math.round(cg.frac * 100)}%</span>
          <button type="button" onClick={() => go('progress')} style={{ justifySelf: 'start', minHeight: 36, padding: '0 12px', borderRadius: 10, border: '1.5px solid var(--ink)', background: 'var(--panel)', color: 'var(--ink)', fontWeight: 700, cursor: 'pointer' }}>
            Rewards and locker
          </button>
        </div>
      </section>

      {/* Needs a look: only what is actually off, each linking to where it is handled */}
      <section style={card}>
        <p style={kicker}>Needs a look</p>
        {look.length === 0 ? (
          <span style={{ fontSize: 14.5, color: 'var(--muted)' }}>Nothing is off today. Patterns, the five hazards and your radiation budget are all within your usual.</span>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6 }}>
            {look.map((x) => (
              <li key={x.text} style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <strong style={{ color: TONE[x.status], minWidth: 54 }}>{WORD[x.status]}</strong>
                <span style={{ flex: 1, minWidth: 200, fontSize: 14.5 }}>{x.text}</span>
                <button type="button" onClick={() => go(x.to)} style={{ minHeight: 32, padding: '0 10px', borderRadius: 10, border: '1.5px solid var(--rule-strong)', background: 'var(--panel)', color: 'var(--ink)', fontWeight: 650, cursor: 'pointer', fontSize: 13 }}>
                  {x.cta}
                </button>
              </li>
            ))}
          </ul>
        )}
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>
          Ground link: {link.known ? `Earth knows your status as of ${new Date(link.known.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'nothing sent today'} · {D.formatDelay(link.delay)} each way ·{' '}
          <button type="button" onClick={() => go('escalation')} style={{ border: 0, background: 'transparent', padding: 0, color: 'var(--accent)', textDecoration: 'underline', cursor: 'pointer', font: 'inherit' }}>
            Escalate
          </button>
        </span>
      </section>
    </main>
  )
}
