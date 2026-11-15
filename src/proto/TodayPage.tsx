import { useEffect, useState } from 'react'
import { readiness, type ReadinessLevel } from '../lib/readiness'
import { blockState, doneToday, isBlockDone, planFor, toMinutes, type CustomBlock } from '../lib/schedule'
import { AlertActionCard } from './AlertCare'
import { openBodyCheck } from './BodyChecks'
import * as D from './data'
import { openEscalation } from './EscalationAdvice'
import * as P from './parts'
import { openSection } from './Sections'
import { useStoreTick } from './shared'
import { bridge, getSnapshot } from './store'

/*
 * Today: one screen, three parts, top to bottom.
 *
 *  1. Hello, the ONE thing to do next (the mirror check until it is done, then the next goal), and
 *     how ready you are (the reasons one tap away). The live body sits beside it.
 *  2. Today's goals (the one goal list every screen reads) and your day on the schedule.
 *  3. Needs your attention: every alert, pattern, self-report gap, slide, hazard, due check and
 *     old reading in one list, most serious first, each with one action. Five at a time.
 *
 * Streak and coins are in the header, levels and the week view in Rewards, and escalation in
 * Ask Orbit ("What should I do?"), so Today shows none of them twice.
 */

const LEVEL: Record<ReadinessLevel, { bg: string; ink: string; ring: string; line: string }> = {
  ready: { bg: 'rgba(47,125,79,.1)', ink: 'var(--ok-ink)', ring: 'var(--ok)', line: 'Fine for demanding work today.' },
  check: { bg: 'rgba(183,121,31,.12)', ink: 'var(--watch-ink)', ring: 'var(--watch)', line: 'Take a closer look before demanding work.' },
  notToday: { bg: 'rgba(179,38,30,.1)', ink: 'var(--act-ink)', ring: 'var(--act)', line: 'Talk to your crew medical officer before demanding work.' },
  unknown: { bg: 'var(--paper-deep)', ink: 'var(--nodata-ink)', ring: 'var(--nodata)', line: 'Do a mirror check to build your baseline.' },
}
const TONE: Record<string, string> = { gray: 'var(--rule-strong)', green: 'var(--ok)', yellow: 'var(--watch)', red: 'var(--act)' }
const WORD: Record<string, string> = { gray: 'No data', green: 'Within usual', yellow: 'Watch', red: 'Act' }
const RANK: Record<string, number> = { red: 0, yellow: 1, green: 2, gray: 3 }

type Alert = { id: string; crewId: string; crewName: string; title: string; status: 'yellow' | 'red'; state: string; firstSeen: number }
type Goal = { id: string; label: string; sub: string; points: number; done: boolean; optional?: boolean }
type Item = { key: string; status: string; title: string; sub?: string; label?: string; run?: () => void; alert?: Alert }

const card = { borderRadius: 26, background: 'var(--panel)', border: '1px solid var(--rule)', padding: 18, display: 'grid', gap: 12, alignContent: 'start' } as const
const kicker = { margin: 0, fontSize: 12, fontWeight: 750, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--muted)' } as const
const go = (s: string) => bridge.go?.(s as never)
const inMins = (m: number) => (m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`)

/** Each goal opens exactly where it is done. */
function doGoal(id: string) {
  if (id === 'checkIn' || id === 'symptom') return go('mirror')
  if (id === 'water' || id === 'meals') return openSection('log', 'food')
  if (id === 'alertness') return openSection('log', 'alertness')
  return openSection('log', 'readings')
}

export function TodayPage() {
  const bump = useStoreTick()
  useEffect(() => {
    const t = setInterval(bump, 30_000)
    return () => clearInterval(t)
  }, [])
  const [showAll, setShowAll] = useState(false)
  const [why, setWhy] = useState(false)
  const [openAlert, setOpenAlert] = useState<string | null>(null)

  const s = D.getState()
  const crew = s.crew as { id: string; name: string; role: string }
  const cd = D.crewData(crew.id) as { regions: Record<string, { label: string; status: string }>; readings: Record<string, { latest: { v: number } | null }> }
  const regions = D.REGIONS.map((r: { id: string; label: string }) => ({ id: r.id, label: r.label, status: cd.regions[r.id]?.status ?? 'gray' }))
  const pats = D.patterns(crew.id) as { id: string; title: string; status: 'yellow' | 'red'; rungName: string }[]
  const gaps = D.gaps(crew.id) as { id: string; measured: { text: string }[]; rated: { label: string; value: number } }[]
  const myAlerts = (D.alerts() as Alert[]).filter((a) => a.crewId === crew.id && a.state !== 'closed')
  const rd = readiness({ regions: regions.map((r) => ({ label: r.label, status: r.status as never })), patterns: pats, openAlerts: myAlerts, gaps: gaps.length })
  const lv = LEVEL[rd.level]
  const hr = cd.readings.heartRate?.latest?.v ?? null
  const water = D.intake(crew.id) as { water: number; goal: number; meals: string[] }
  const hz = (D.hazards(crew.id) as { name: string; status: string }[]).filter((h) => h.status === 'yellow' || h.status === 'red')
  const budget = D.radiationBudget(crew.id)

  const now = new Date()
  const plan = planFor(crew.role || '', D.scheduleStore(crew.id).custom as CustomBlock[], now)
  const done = doneToday(getSnapshot().events[crew.id] ?? [], now)
  const rows = plan.map((b) => ({ b, st: blockState(b, now, isBlockDone(b, done, water.meals, D.ticksToday(crew.id))) }))
  const next = rows.find((r) => r.st === 'now') ?? rows.find((r) => r.st === 'upcoming')
  const later = rows.filter((r) => r.st === 'upcoming' && r !== next).slice(0, 3)
  const minsTo = next ? toMinutes(next.b.start) - (now.getHours() * 60 + now.getMinutes()) : 0
  const hello = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening'
  const name = crew.id === 'guest' ? 'crew member' : crew.name

  const goals = D.todayTasks(crew.id) as Goal[]
  const req = goals.filter((q) => !q.optional)
  const reqDone = req.filter((q) => q.done).length
  const checkIn = goals.find((q) => q.id === 'checkIn')
  const nextGoal = req.find((q) => !q.done) ?? goals.find((q) => !q.done)
  const streak = (D.game(crew.id) as { streak: number }).streak

  // Everything that needs a look, most serious first, each with one action.
  const items: Item[] = [
    ...myAlerts.map((a) => ({ key: a.id, status: a.status, title: a.title, sub: 'Open alert', alert: a })),
    // A pattern that already has an open alert shows once, as the alert.
    ...pats.filter((p) => !myAlerts.some((x) => x.id.endsWith(`:pattern:${p.id}`))).map((p) => ({ key: 'p' + p.id, status: p.status, title: p.title, sub: `Pattern · next step ${p.rungName}`, label: 'Care plan', run: () => openSection('body', 'patterns') })),
    ...gaps.map((x) => ({ key: 'g' + x.id, status: 'yellow', title: `You rated your ${x.rated.label} ${x.rated.value}/10`, sub: `but ${x.measured[0].text}`, label: 'See why', run: () => openSection('body', 'patterns') })),
    ...(D.slideForecasts(crew.id) as { id: string; label: string; status: string; text: string }[]).filter((f) => f.status !== 'red').map((f) => ({ key: 's' + f.id, status: 'yellow', title: f.label, sub: f.text, label: 'Trend', run: () => openSection('body', 'readings') })),
    ...(hz.length ? [{ key: 'hz', status: hz.some((h) => h.status === 'red') ? 'red' : 'yellow', title: `${hz.length} hazard${hz.length === 1 ? '' : 's'} to watch`, sub: hz.map((h) => h.name).join(', '), label: 'Five hazards', run: () => openSection('body', 'hazards') }] : []),
    ...(budget.status !== 'green' ? [{ key: 'rad', status: budget.status, title: 'Career radiation dose', sub: `${Math.round(budget.used)} of ${budget.limit} mSv`, label: 'Radiation', run: () => go('radiation') }] : []),
  ]
  const weekly = D.weeklyCheckAge(crew.id) as number | null
  const stale = D.staleReadings(crew.id) as { label: string; days: number; go: string }[]
  const todo: Item[] = [
    ...(weekly === null || weekly >= 7 ? [{ key: 'weekly', status: 'gray', title: 'Weekly check is due', sub: 'Workload and mood, about 2 minutes', label: 'Start', run: () => openBodyCheck('weekly') }] : []),
    ...(stale.length ? [{ key: 'stale', status: 'gray', title: `${stale.length} reading${stale.length === 1 ? ' is' : 's are'} getting old`, sub: stale.slice(0, 3).map((x) => `${x.label} (${x.days} d)`).join(', '), label: 'Refresh', run: () => (stale[0].go === 'mirror' ? go('mirror') : openSection('log', 'readings')) }] : []),
    ...(D.reportStatus(crew.id).ready ? [{ key: 'report', status: 'gray', title: 'Your weekly report is ready', sub: 'Seven days on one page for the flight surgeon', label: 'Read it', run: () => go('report') }] : []),
  ]
  const all = [...items.sort((a, b) => RANK[a.status] - RANK[b.status]), ...todo]
  const shown = showAll ? all : all.slice(0, 5)

  const btn = (dark = false) => ({ minHeight: 36, padding: '0 14px', borderRadius: 11, border: dark ? 0 : '1.5px solid var(--ink)', background: dark ? '#14181f' : 'var(--panel)', color: dark ? '#f3f1ea' : 'var(--ink)', fontWeight: 700, fontSize: 13.5, cursor: 'pointer', whiteSpace: 'nowrap' }) as const

  return (
    <main style={{ width: '100%', maxWidth: 1320, margin: '0 auto', padding: '24px clamp(16px, 3vw, 32px) 72px', boxSizing: 'border-box', display: 'grid', gap: 20 }}>
      {/* 1. Hello, the one thing to do next, and how ready you are */}
      <section style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'stretch', animation: 'lg-rise 520ms cubic-bezier(.22,1,.36,1) both' }}>
        <div className={D.systemsOnline().nav ? 'nav-stars' : undefined} style={{ flex: '2 1 520px', display: 'grid', gap: 16, alignContent: 'end', borderRadius: 24 }}>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)' }}>
            Mission day {budget.missionDays + 1} · {s.env.label} · {D.formatDelay(s.delay)} to Earth
          </p>
          <h1 style={{ margin: 0, fontSize: 'clamp(38px, 5.4vw, 68px)', lineHeight: 0.95, fontWeight: 750, letterSpacing: '-0.05em' }}>
            {hello}, {name}.
          </h1>

          {checkIn && !checkIn.done ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, padding: '18px 20px', borderRadius: 24, background: 'var(--accent)', color: 'var(--on-accent)' }}>
              <div style={{ flex: '1 1 260px', display: 'grid', gap: 4 }}>
                <p style={{ ...kicker, color: '#f6c445' }}>Up next · your daily mirror check</p>
                <strong style={{ fontSize: 'clamp(19px, 2.2vw, 24px)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>About a minute. Do it now, before the day starts.</strong>
                <span style={{ fontSize: 14, opacity: 0.85 }}>
                  Camera pulse, two vision checks, how you feel · +{checkIn.points} coins{streak > 0 ? ` · keeps your ${streak}-day streak` : ''}
                </span>
              </div>
              <span style={{ position: 'relative', display: 'inline-grid' }}>
                <span aria-hidden="true" className="mc-ring" />
                <button type="button" className="fw-press" onClick={() => go('mirror')} style={{ position: 'relative', minHeight: 54, padding: '0 24px', borderRadius: 16, border: 0, background: '#f6c445', color: '#14181f', boxShadow: '0 5px 0 #a8740a', fontSize: 17, fontWeight: 800, cursor: 'pointer' }}>
                  Start mirror check
                </button>
              </span>
            </div>
          ) : nextGoal ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14, padding: '16px 18px', borderRadius: 22, background: 'var(--panel)', border: '1.5px solid var(--ink)' }}>
              <div style={{ flex: '1 1 240px', display: 'grid', gap: 2 }}>
                <p style={kicker}>Up next</p>
                <strong style={{ fontSize: 20, letterSpacing: '-0.02em' }}>{nextGoal.label}</strong>
                <span style={{ fontSize: 13.5, color: 'var(--muted)' }}>
                  {nextGoal.sub} · +{nextGoal.points} coins
                </span>
              </div>
              <button type="button" className="fw-press" onClick={() => doGoal(nextGoal.id)} style={{ minHeight: 48, padding: '0 20px', borderRadius: 14, border: 0, background: '#14181f', color: '#f3f1ea', boxShadow: '0 4px 0 #000', fontWeight: 800, fontSize: 15.5, cursor: 'pointer' }}>
                Do it
              </button>
            </div>
          ) : (
            <div role="status" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: 22, background: 'rgba(47,125,79,.1)', border: '1.5px solid var(--ok)' }}>
              <span aria-hidden="true" style={{ display: 'grid', placeItems: 'center', width: 30, height: 30, borderRadius: 99, background: 'var(--ok)', color: 'var(--paper)', fontWeight: 800 }}>
                ✓
              </span>
              <span style={{ fontSize: 15.5 }}>
                <strong style={{ color: 'var(--ok-ink)' }}>Everything for today is done.</strong> {streak > 0 ? `${streak}-day streak. ` : ''}See you tomorrow.
              </span>
            </div>
          )}

          <div role="status" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 18, background: lv.bg, border: `1.5px solid ${lv.ring}` }}>
            <span style={{ padding: '6px 14px', borderRadius: 12, background: lv.ring, color: 'var(--paper)', fontWeight: 800, fontSize: 15 }}>{rd.label}</span>
            <strong style={{ flex: '1 1 220px', color: lv.ink, fontSize: 14.5 }}>{lv.line}</strong>
            <button type="button" aria-expanded={why} onClick={() => setWhy((w) => !w)} style={{ border: 0, background: 'transparent', color: 'var(--accent)', fontWeight: 700, fontSize: 13.5, cursor: 'pointer', textDecoration: 'underline' }}>
              {why ? 'Hide why' : 'Why?'}
            </button>
            {why && (
              <span style={{ flex: '1 1 100%', fontSize: 13.5, color: 'var(--ink-soft)' }}>
                {rd.reasons.slice(0, 3).join('; ')}. Readiness is a prompt from your own readings, not a medical clearance.
              </span>
            )}
          </div>
        </div>

        <div style={{ flex: '1 1 300px', borderRadius: 28, background: '#14181f', color: '#f3f1ea', padding: 18, display: 'flex', gap: 14, alignItems: 'center' }}>
          <div style={{ width: 140, flex: '0 0 auto' }}>
            <P.BodyFigure statuses={Object.fromEntries(regions.map((r) => [r.id, r.status]))} interactive={false} markers={true} height="220px" uid="today" bpm={hr} alertRegions={D.alertRegions(crew.id)} />
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            <p style={{ ...kicker, color: 'rgba(243,241,234,.6)' }}>Live body</p>
            <p style={{ margin: 0, display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 38, fontWeight: 750, letterSpacing: '-0.04em' }}>{hr ? Math.round(hr) : '—'}</span>
              <span style={{ color: 'rgba(243,241,234,.7)' }}>bpm</span>
            </p>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {regions.map((r) => (
                <li key={r.id} title={`${r.label}: ${WORD[r.status]}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 99, background: 'rgba(243,241,234,.08)', fontSize: 12 }}>
                  <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: 99, background: TONE[r.status] }} />
                  {r.label === 'Gut and nutrition' ? 'Gut' : r.label}
                </li>
              ))}
            </ul>
            <button type="button" onClick={() => go('bodymap')} style={{ justifySelf: 'start', minHeight: 36, padding: '0 12px', borderRadius: 10, border: '1.5px solid rgba(243,241,234,.4)', background: 'transparent', color: '#f3f1ea', fontWeight: 700, cursor: 'pointer' }}>
              Open Body
            </button>
          </div>
        </div>
      </section>

      {/* 2. Today's goals, and the day */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 16, alignItems: 'start' }}>
        <div style={card} className="today-goals">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
            <p style={kicker}>Today's goals</p>
            <span style={{ fontSize: 13, fontWeight: 700, color: reqDone === req.length ? 'var(--ok-ink)' : 'var(--muted)' }}>
              {reqDone} of {req.length} done
            </span>
          </div>
          <div role="progressbar" aria-label="Today's goals" aria-valuemin={0} aria-valuemax={req.length} aria-valuenow={reqDone} style={{ height: 6, borderRadius: 99, background: 'var(--paper-deep)', overflow: 'hidden' }}>
            <div style={{ width: `${req.length ? (reqDone / req.length) * 100 : 0}%`, height: '100%', background: 'var(--ok)', transition: 'width 500ms ease' }} />
          </div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 4 }}>
            {goals.map((q) => (
              <li key={q.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 8px', borderRadius: 12 }}>
                <span aria-hidden="true" style={{ display: 'grid', placeItems: 'center', width: 22, height: 22, flex: '0 0 auto', borderRadius: 99, background: q.done ? 'var(--ok)' : 'transparent', border: q.done ? 0 : '2px solid var(--rule-strong)', color: 'var(--paper)', fontSize: 12, fontWeight: 800 }}>
                  {q.done ? '✓' : ''}
                </span>
                <span style={{ flex: 1, minWidth: 0, fontWeight: 600, fontSize: 14.5, color: q.done ? 'var(--muted)' : 'var(--ink)', textDecoration: q.done ? 'line-through' : 'none' }}>
                  {q.label}
                  {q.optional ? <span style={{ fontWeight: 500, color: 'var(--muted)' }}> · bonus</span> : null}
                </span>
                <span style={{ fontSize: 12.5, fontWeight: 750, color: q.done ? 'var(--muted)' : '#a8740a' }}>+{q.points}</span>
                {!q.done && (
                  <button type="button" onClick={() => doGoal(q.id)} style={{ ...btn(), minHeight: 30, padding: '0 10px', fontSize: 12.5 }}>
                    Do it
                  </button>
                )}
              </li>
            ))}
          </ul>
          <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>Coins for doing, never for the numbers.</span>
        </div>

        <div style={{ ...card, background: '#14181f', color: '#f3f1ea', border: 0 }}>
          <p style={{ ...kicker, color: '#f6c445' }}>{next ? (next.st === 'now' ? 'Now' : `Next, in ${inMins(minsTo)}`) : 'Your day'}</p>
          <strong style={{ fontSize: 20, lineHeight: 1.2, letterSpacing: '-0.02em' }}>{next ? next.b.title : 'Nothing else on the schedule today'}</strong>
          {next && (
            <span style={{ fontSize: 13.5, color: 'rgba(243,241,234,.7)' }}>
              {next.b.start} · {next.b.minutes} min
            </span>
          )}
          {later.length > 0 && (
            <ol style={{ listStyle: 'none', margin: 0, padding: '10px 0 0', borderTop: '1px solid rgba(243,241,234,.14)', display: 'grid', gap: 6 }}>
              {later.map((r) => (
                <li key={`${r.b.start}-${r.b.title}`} style={{ display: 'flex', gap: 10, alignItems: 'baseline', fontSize: 13.5 }}>
                  <span style={{ minWidth: 44, fontVariantNumeric: 'tabular-nums', color: '#f6c445', fontWeight: 700 }}>{r.b.start}</span>
                  <span style={{ flex: 1, minWidth: 0, color: 'rgba(243,241,234,.88)' }}>{r.b.title}</span>
                </li>
              ))}
            </ol>
          )}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {next?.b.link && (
              <button type="button" className="fw-press" onClick={() => go(next.b.link!)} style={{ minHeight: 38, padding: '0 14px', borderRadius: 11, border: 0, background: '#f6c445', color: '#14181f', boxShadow: '0 4px 0 #a8740a', fontWeight: 750, cursor: 'pointer' }}>
                Start it
              </button>
            )}
            <button type="button" onClick={() => go('schedule')} style={{ minHeight: 38, padding: '0 12px', borderRadius: 11, border: '1.5px solid rgba(243,241,234,.35)', background: 'transparent', color: '#f3f1ea', fontWeight: 650, cursor: 'pointer' }}>
              Full schedule
            </button>
          </div>
        </div>
      </section>

      {/* 3. One list of what needs a look, each with one action */}
      <section data-tour="needs-look" aria-labelledby="attention-heading" style={card}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
          <h2 id="attention-heading" style={{ ...kicker, fontSize: 12.5 }}>
            Needs your attention
          </h2>
          <button type="button" onClick={() => openEscalation()} style={{ border: 0, background: 'transparent', color: 'var(--accent)', fontWeight: 700, fontSize: 13.5, cursor: 'pointer', textDecoration: 'underline' }}>
            What should I do?
          </button>
        </div>
        {all.length === 0 ? (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span aria-hidden="true" style={{ display: 'grid', placeItems: 'center', width: 30, height: 30, borderRadius: 99, background: 'rgba(47,125,79,.12)', color: 'var(--ok-ink)', fontWeight: 800 }}>
              ✓
            </span>
            <span style={{ fontSize: 14.5, color: 'var(--ink-soft)' }}>Nothing needs a look. Your readings, patterns and hazards are all within your usual.</span>
          </div>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6 }}>
            {shown.map((x) => (
              <li key={x.key} style={{ display: 'grid', gap: 8, padding: '10px 12px', borderRadius: 14, background: 'var(--panel-2)', borderLeft: `4px solid ${TONE[x.status] ?? 'var(--rule-strong)'}` }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px 12px' }}>
                  <span style={{ flex: '1 1 260px', minWidth: 0, display: 'grid' }}>
                    <strong style={{ fontSize: 14.5 }}>{x.title}</strong>
                    {x.sub && <span style={{ fontSize: 13, color: 'var(--muted)' }}>{x.sub}</span>}
                  </span>
                  {x.alert ? (
                    <button type="button" aria-expanded={openAlert === x.key} onClick={() => setOpenAlert((k) => (k === x.key ? null : x.key))} style={btn(true)}>
                      {openAlert === x.key ? 'Hide' : 'What to do'}
                    </button>
                  ) : (
                    <button type="button" onClick={x.run} style={btn()}>
                      {x.label}
                    </button>
                  )}
                </div>
                {x.alert && openAlert === x.key && <AlertActionCard a={x.alert} compact />}
              </li>
            ))}
          </ul>
        )}
        {all.length > 5 && (
          <button type="button" onClick={() => setShowAll((v) => !v)} style={{ justifySelf: 'start', border: 0, background: 'transparent', color: 'var(--accent)', fontWeight: 700, fontSize: 13.5, cursor: 'pointer', padding: 0 }}>
            {showAll ? 'Show fewer' : `Show ${all.length - 5} more`}
          </button>
        )}
      </section>
    </main>
  )
}
