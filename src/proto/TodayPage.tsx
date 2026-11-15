import { useEffect } from 'react'
import { openBodyCheck } from './BodyChecks'
import { readiness, type ReadinessLevel } from '../lib/readiness'
import { blockState, doneToday, isBlockDone, planFor, toMinutes, type CustomBlock } from '../lib/schedule'
import { useGroundLink } from './GroundLink'
import * as D from './data'
import * as P from './parts'
import { bridge, getSnapshot } from './store'
import { AlertActionCard } from './AlertCare'
import { useStoreTick } from './shared'
import { openEscalation } from './EscalationAdvice'

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
  const bump = useStoreTick()
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
  const checkIn = goals.find((q) => q.id === 'checkIn')
  const streak = (D.game(crew.id) as { streak: number }).streak
  const req = goals.filter((q) => !q.optional)
  const reqDone = req.filter((q) => q.done).length
  const lvl = D.level((D.wallet(crew.id) as { xp: number }).xp) as { n: number; rank: string; into: number; need: number; frac: number }
  const cg = D.crewGoal() as { frac: number }
  const look: { status: string; text: string; to: string; cta: string }[] = [
    ...pats.map((p) => ({ status: p.status, text: `${p.title}: next step ${p.rungName}`, to: 'bodymap', cta: 'Care plan' })),
    ...gaps.map((x) => ({ status: 'yellow', text: `You rated your ${x.rated.label} ${x.rated.value}/10, but ${x.measured[0].text}`, to: 'bodymap', cta: 'See why' })),
    ...hz.filter((h) => h.status === 'yellow' || h.status === 'red').map((h) => ({ status: h.status, text: `${h.name} hazard`, to: 'bodymap', cta: 'Five hazards' })),
    ...(budget.status !== 'green' ? [{ status: budget.status, text: `Career radiation dose ${Math.round(budget.used)} of ${budget.limit} mSv`, to: 'bodymap', cta: 'Radiation' }] : []),
    ...(D.slideForecasts(crew.id) as { label: string; status: string; text: string; outside: boolean }[]).filter((f) => f.status !== 'red').map((f) => ({ status: 'yellow', text: `${f.label}: ${f.text}`, to: 'bodymap', cta: 'See the trend' })),
  ]
  const weeklyAge = D.weeklyCheckAge(crew.id) as number | null
  const stale = D.staleReadings(crew.id) as { id: string; label: string; days: number; go: string }[]
  const myAlert = (D.alerts() as { crewId: string; state: string; status: string; title: string }[]).find((a) => a.crewId === crew.id && a.state !== 'closed')

  const g = D.game(crew.id) as { streak: number; shields: number; best: number; month: number[] }
  const earned = D.COIN_CAP - D.capRoom(crew.id)
  const later = rows.filter((r) => r.st === 'upcoming' && r !== next).slice(0, 3)
  const week = g.month.slice(-7).map((v, i) => ({ v, day: new Date(now.getTime() - (6 - i) * 86_400_000).toLocaleDateString([], { weekday: 'narrow' }), today: i === 6 }))
  const inMins = (m: number) => (m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`)
  const ghost = { minHeight: 40, padding: '0 12px', borderRadius: 12, border: '1.5px solid rgba(243,241,234,.35)', background: 'transparent', color: '#f3f1ea', fontWeight: 650, cursor: 'pointer' } as const
  const stat = (label: string, value: string, sub?: string) => (
    <div key={label} style={{ flex: '1 1 120px', padding: '10px 14px', borderRadius: 18, background: 'var(--panel)', border: '1px solid var(--rule)' }}>
      <span style={{ display: 'block', fontSize: 12, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--muted)' }}>{label}</span>
      <strong style={{ fontSize: 22, letterSpacing: '-0.03em' }}>{value}</strong>
      {sub && <span style={{ marginLeft: 6, fontSize: 12.5, color: 'var(--muted)' }}>{sub}</span>}
    </div>
  )
  const actions: { label: string; sub: string; icon: string; run: () => void }[] = [
    { label: 'Pain check', sub: 'Tap where it hurts, or say nothing does', icon: '✚', run: () => openBodyCheck('pain') },
    { label: 'Weekly check', sub: weeklyAge === null || weeklyAge >= 7 ? 'Due now: workload and mood' : `Done ${weeklyAge === 0 ? 'today' : `${weeklyAge} d ago`}`, icon: '◐', run: () => openBodyCheck('weekly') },
    { label: 'Stand-up test', sub: 'For gravity changes and landing', icon: '↥', run: () => openBodyCheck('stand') },
    { label: 'Strength', sub: 'Grip and bone-loading sessions', icon: '✊', run: () => openBodyCheck('strength') },
  ]

  return (
    <main style={{ width: '100%', maxWidth: 1440, margin: '0 auto', padding: '24px clamp(16px, 3vw, 32px) 72px', boxSizing: 'border-box', display: 'grid', gap: 18 }}>
      {/* Hero: who, where, today's numbers at a glance, readiness, and the living body */}
      <section style={{ display: 'flex', flexWrap: 'wrap', gap: 18, alignItems: 'stretch', animation: 'lg-rise 520ms cubic-bezier(.22,1,.36,1) both' }}>
        <div className={D.systemsOnline().nav ? 'nav-stars' : undefined} style={{ flex: '2 1 520px', display: 'grid', gap: 14, alignContent: 'end', borderRadius: 24 }}>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)' }}>
            Mission day {budget.missionDays + 1} · {s.env.label} · {D.formatDelay(s.delay)} to Earth{crew.role ? ` · ${crew.role}` : ''}
          </p>
          <h1 style={{ margin: 0, fontSize: 'clamp(40px, 6vw, 76px)', lineHeight: 0.92, fontWeight: 750, letterSpacing: '-0.05em' }}>
            {hello},
            <br />
            {name}.
          </h1>
          {/* The daily mirror check comes first: it is the one thing everything else is built on. */}
          {checkIn && !checkIn.done ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, padding: '18px 20px', borderRadius: 24, background: 'var(--accent)', color: 'var(--on-accent)', maxWidth: 720 }}>
              <div style={{ flex: '1 1 260px', display: 'grid', gap: 4 }}>
                <p style={{ ...kicker, color: '#f6c445' }}>Your daily mirror check</p>
                <strong style={{ fontSize: 'clamp(20px, 2.4vw, 26px)', letterSpacing: '-0.02em', lineHeight: 1.15 }}>About a minute. Do it now, before the day starts.</strong>
                <span style={{ fontSize: 14, opacity: 0.85 }}>
                  Camera pulse, two vision checks, how you feel · +{checkIn.points} coins{streak > 0 ? ` · keeps your ${streak}-day streak` : ''}
                </span>
              </div>
              <span style={{ position: 'relative', display: 'inline-grid' }}>
                <span aria-hidden="true" className="mc-ring" />
                <button type="button" className="fw-press" onClick={() => go('mirror')} style={{ position: 'relative', minHeight: 56, padding: '0 26px', borderRadius: 16, border: 0, background: '#f6c445', color: '#14181f', boxShadow: '0 5px 0 #a8740a', fontSize: 18, fontWeight: 800, cursor: 'pointer' }}>
                  Start mirror check
                </button>
              </span>
            </div>
          ) : checkIn ? (
            <div role="status" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 16, background: 'rgba(47,125,79,.1)', border: '1px solid var(--ok)', maxWidth: 720 }}>
              <span aria-hidden="true" style={{ display: 'grid', placeItems: 'center', width: 24, height: 24, borderRadius: 99, background: 'var(--ok)', color: 'var(--paper)', fontSize: 13, fontWeight: 800 }}>✓</span>
              <strong style={{ fontSize: 15, color: 'var(--ok-ink)' }}>Mirror check done today</strong>
              <span style={{ flex: 1, fontSize: 13.5, color: 'var(--ink-soft)' }}>{streak > 0 ? `${streak}-day streak. ` : ''}See you tomorrow.</span>
              <button type="button" onClick={() => go('mirror')} style={{ minHeight: 34, padding: '0 12px', borderRadius: 10, border: '1.5px solid var(--rule-strong)', background: 'var(--panel)', color: 'var(--ink)', fontWeight: 650, cursor: 'pointer' }}>
                Run it again
              </button>
            </div>
          ) : null}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, maxWidth: 760 }}>
            {stat('Streak', `${g.streak} days`, g.shields ? `${g.shields} shield${g.shields === 1 ? '' : 's'}` : undefined)}
            {stat('Goals', `${reqDone} of ${req.length}`, reqDone === req.length ? 'all done' : 'today')}
            {stat('Coins today', `${earned}`, `of ${D.COIN_CAP}`)}
            {stat('Level', `${lvl.n}`, lvl.rank)}
          </div>
          <div role="status" style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', padding: '14px 16px', borderRadius: 20, background: lv.bg, border: `2px solid ${lv.ring}`, maxWidth: 760 }}>
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
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {regions.map((r) => (
                <li key={r.id} title={`${r.label}: ${WORD[r.status]}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 99, background: 'rgba(243,241,234,.08)', fontSize: 12 }}>
                  <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: 99, background: TONE[r.status] }} />
                  {r.label === 'Gut and nutrition' ? 'Gut' : r.label}
                </li>
              ))}
            </ul>
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
      {/* Row: your day, today's goals, and your week (one list of goals, read by every screen) */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 14 }}>
        <div style={{ ...card, background: '#14181f', color: '#f3f1ea', border: 0, gap: 12 }}>
          <p style={{ ...kicker, color: '#f6c445' }}>{next ? (next.st === 'now' ? 'Now' : `Next, in ${inMins(minsTo)}`) : 'Schedule'}</p>
          <strong style={{ fontSize: 21, lineHeight: 1.2, letterSpacing: '-0.02em' }}>{next ? next.b.title : 'Nothing else today'}</strong>
          {next && (
            <span style={{ fontSize: 13.5, color: 'rgba(243,241,234,.7)' }}>
              {next.b.start} · {next.b.minutes} min
            </span>
          )}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {next?.b.link && (
              <button type="button" className="fw-press" onClick={() => go(next.b.link!)} style={{ minHeight: 40, padding: '0 14px', borderRadius: 12, border: 0, background: '#f6c445', color: '#14181f', boxShadow: '0 4px 0 #a8740a', fontWeight: 750, cursor: 'pointer' }}>
                Start it
              </button>
            )}
            <button type="button" onClick={() => go('schedule')} style={ghost}>
              Full schedule
            </button>
          </div>
          {later.length > 0 && (
            <div style={{ display: 'grid', gap: 6, paddingTop: 12, borderTop: '1px solid rgba(243,241,234,.14)' }}>
              <p style={{ ...kicker, color: 'rgba(243,241,234,.55)' }}>Later today</p>
              <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6 }}>
                {later.map((r) => (
                  <li key={`${r.b.start}-${r.b.title}`} style={{ display: 'flex', gap: 10, alignItems: 'baseline', fontSize: 13.5 }}>
                    <span style={{ minWidth: 44, fontVariantNumeric: 'tabular-nums', color: '#f6c445', fontWeight: 700 }}>{r.b.start}</span>
                    <span style={{ flex: 1, minWidth: 0, color: 'rgba(243,241,234,.88)' }}>{r.b.title}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        <div style={{ ...card, gridColumn: 'span 2' }} className="today-goals">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
            <p style={kicker}>Today's goals</p>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>
              {reqDone} of {req.length} done{reqDone === req.length ? ', all done' : ''} · coins for doing, never for the numbers
            </span>
          </div>
          <div role="progressbar" aria-label="Today's goals" aria-valuemin={0} aria-valuemax={req.length} aria-valuenow={reqDone} style={{ height: 8, borderRadius: 99, background: 'var(--paper-deep)', overflow: 'hidden' }}>
            <div style={{ width: `${req.length ? (reqDone / req.length) * 100 : 0}%`, height: '100%', background: 'var(--ok)', transition: 'width 500ms ease' }} />
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

        <div style={{ ...card, gap: 14 }}>
          <p style={kicker}>Your week</p>
          <ol aria-label="Check-ins over the last seven days" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 6 }}>
            {week.map((d, i) => (
              <li key={i} title={d.v === 2 ? 'Checked in and exercised' : d.v === 1 ? 'Checked in' : 'No check-in'} style={{ display: 'grid', justifyItems: 'center', gap: 4 }}>
                <span style={{ width: '100%', aspectRatio: '1', maxWidth: 34, borderRadius: 10, background: d.v === 2 ? '#e8742c' : d.v === 1 ? '#f6c445' : 'var(--paper-deep)', outline: d.today ? '2px solid var(--ink)' : 'none', outlineOffset: 2 }} />
                <span style={{ fontSize: 11.5, fontWeight: d.today ? 800 : 500, color: d.today ? 'var(--ink)' : 'var(--muted)' }}>{d.day}</span>
              </li>
            ))}
          </ol>
          <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>Gold: checked in · orange: checked in and exercised · best streak {g.best || g.streak} days</span>
          <div style={{ display: 'grid', gap: 4 }}>
            <span style={{ fontSize: 13.5 }}>
              Level {lvl.n} · {lvl.need - lvl.into} XP to level {lvl.n + 1}
            </span>
            <div role="progressbar" aria-label="Level progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(lvl.frac * 100)} style={{ height: 8, borderRadius: 99, background: 'var(--paper-deep)', overflow: 'hidden' }}>
              <div style={{ width: `${lvl.frac * 100}%`, height: '100%', background: '#f6c445' }} />
            </div>
          </div>
          <div style={{ display: 'grid', gap: 4 }}>
            <span style={{ fontSize: 13.5 }}>Crew weekly goal: {Math.round(cg.frac * 100)}%</span>
            <div role="progressbar" aria-label="Crew weekly goal" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(cg.frac * 100)} style={{ height: 8, borderRadius: 99, background: 'var(--paper-deep)', overflow: 'hidden' }}>
              <div style={{ width: `${cg.frac * 100}%`, height: '100%', background: 'var(--accent)' }} />
            </div>
          </div>
          <button type="button" onClick={() => go('progress')} style={{ justifySelf: 'start', minHeight: 36, padding: '0 12px', borderRadius: 10, border: '1.5px solid var(--ink)', background: 'var(--panel)', color: 'var(--ink)', fontWeight: 700, cursor: 'pointer' }}>
            Rewards and locker
          </button>
        </div>
      </section>

      {/* Row: needs a look, quick actions, and what Earth can see */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 14 }}>
        <div style={card} data-tour="needs-look">
          <p style={kicker}>Needs a look</p>
          {myAlert && (
            <div style={{ display: 'grid', gap: 6 }}>
              <strong style={{ fontSize: 14.5, color: myAlert.status === 'red' ? 'var(--act-ink)' : 'var(--watch-ink)' }}>Your alert: {myAlert.title}</strong>
              <AlertActionCard a={myAlert as never} compact />
            </div>
          )}
          {look.length === 0 && !myAlert ? (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span aria-hidden="true" style={{ display: 'grid', placeItems: 'center', width: 34, height: 34, flex: '0 0 auto', borderRadius: 99, background: 'rgba(47,125,79,.12)', color: 'var(--ok-ink)', fontWeight: 800 }}>
                ✓
              </span>
              <span style={{ fontSize: 14.5, color: 'var(--ink-soft)' }}>Nothing is off today. Patterns, the five hazards and your radiation budget are all within your usual.</span>
            </div>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
              {look.map((x) => (
                <li key={x.text} style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '8px 10px', borderRadius: 12, background: 'var(--panel-2)' }}>
                  <strong style={{ color: TONE[x.status], minWidth: 54 }}>{WORD[x.status]}</strong>
                  <span style={{ flex: 1, minWidth: 160, fontSize: 14 }}>{x.text}</span>
                  <button type="button" onClick={() => go(x.to)} style={{ minHeight: 32, padding: '0 10px', borderRadius: 10, border: '1.5px solid var(--rule-strong)', background: 'var(--panel)', color: 'var(--ink)', fontWeight: 650, cursor: 'pointer', fontSize: 13 }}>
                    {x.cta}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {stale.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 12, border: '1px dashed var(--rule-strong)' }}>
              <span style={{ flex: '1 1 200px', fontSize: 13.5 }}>
                <strong>Getting old:</strong> {stale.slice(0, 3).map((x) => `${x.label} (${x.days} days)`).join(', ')}
                {stale.length > 3 ? ` and ${stale.length - 3} more` : ''}. A fresh reading keeps your baseline honest, and logging it earns coins.
              </span>
              <button type="button" onClick={() => go(stale[0].go)} style={{ minHeight: 32, padding: '0 10px', borderRadius: 10, border: '1.5px solid var(--ink)', background: 'var(--panel)', color: 'var(--ink)', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                Refresh
              </button>
            </div>
          )}
        </div>

        <div style={card}>
          <p style={kicker}>Body checks</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
            {actions.map((a) => (
              <button key={a.label} type="button" className="today-action" onClick={a.run} style={{ display: 'grid', gap: 2, justifyItems: 'start', textAlign: 'left', padding: '10px 12px', borderRadius: 14, border: '1px solid var(--rule)', background: 'var(--panel-2)', color: 'var(--ink)', cursor: 'pointer', font: 'inherit' }}>
                <span aria-hidden="true" style={{ fontSize: 18, lineHeight: 1, color: '#a8740a' }}>
                  {a.icon}
                </span>
                <strong style={{ fontSize: 14 }}>{a.label}</strong>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>{a.sub}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ ...card, background: '#0b1220', color: '#e8eefc', border: 0 }}>
          <p style={{ ...kicker, color: '#4cc9f0' }}>Ground link</p>
          <strong style={{ fontSize: 17, lineHeight: 1.3 }}>{link.known ? `Earth knows your status as of ${new Date(link.known.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Nothing sent to Earth today'}</strong>
          <span style={{ fontSize: 13.5, color: 'rgba(232,238,252,.72)' }}>
            {D.formatDelay(link.delay)} each way, so a reply takes at least {D.formatDelay(link.delay * 2)}. Anything urgent goes to your crew medical officer first.
          </span>
          <button type="button" onClick={() => openEscalation()} style={{ ...ghost, justifySelf: 'start', minHeight: 36, color: '#e8eefc', border: '1.5px solid rgba(232,238,252,.35)' }}>
            Who to tell, and when
          </button>
        </div>
      </section>
    </main>
  )
}
