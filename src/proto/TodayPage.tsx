import { useEffect, useReducer } from 'react'
import { readiness, type ReadinessLevel } from '../lib/readiness'
import { blockState, doneToday, isBlockDone, planFor, toMinutes, type CustomBlock } from '../lib/schedule'
import { useGroundLink } from './GroundLink'
import { DoseBudget } from './HazardsPanel'
import * as D from './data'
import * as P from './parts'
import { bridge, getSnapshot } from './store'

/*
 * Today: the mission console a crew member opens first. Everything on it already exists elsewhere
 * in the app; this page puts the day in one view: readiness and its reasons, the living body
 * figure, the next thing to do, open alerts, patterns, the five hazards, the radiation budget,
 * food and water, and the ground link.
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
  const g = D.game(crew.id) as { streak: number; today: { checkIn: boolean } }
  const w = D.wallet(crew.id) as { coins: number }
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
  const latestPacket = link.list[0]

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
            <button type="button" onClick={() => go('report')} style={{ justifySelf: 'start', minHeight: 36, padding: '0 12px', borderRadius: 10, border: 0, background: 'transparent', color: '#f6c445', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>
              Weekly report for the flight surgeon
            </button>
          </div>
        </div>
      </section>

      {/* Row: do next, the check, alerts, ground link */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 14 }}>
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

        <div style={card}>
          <p style={kicker}>Mirror check</p>
          <strong style={{ fontSize: 19 }}>{g.today.checkIn ? 'Done today' : 'Not done yet'}</strong>
          <span style={{ fontSize: 13.5, color: 'var(--muted)' }}>
            {g.streak}-day streak · {w.coins} coins
          </span>
          {!g.today.checkIn && (
            <button type="button" className="fw-press" onClick={() => go('mirror')} style={{ justifySelf: 'start', minHeight: 42, padding: '0 16px', borderRadius: 12, border: 0, background: '#14181f', color: '#f3f1ea', boxShadow: '0 4px 0 #000', fontWeight: 750, cursor: 'pointer' }}>
              Start today's check
            </button>
          )}
        </div>

        <div style={{ ...card, border: open.length ? '2px solid var(--act)' : card.border }}>
          <p style={kicker}>Open alerts</p>
          <strong style={{ fontSize: 19 }}>{open.length ? `${open.length} for the medical officer` : 'None'}</strong>
          {open.slice(0, 3).map((a) => (
            <span key={a.title} style={{ fontSize: 13.5 }}>
              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 99, background: TONE[a.status], marginRight: 6 }} />
              {a.title}
              {a.state === 'acknowledged' ? ' (acknowledged)' : ''}
            </span>
          ))}
          {open.length > 0 && (
            <button type="button" onClick={() => go('medical')} style={{ justifySelf: 'start', minHeight: 36, padding: '0 12px', borderRadius: 10, border: '1.5px solid var(--ink)', background: 'var(--panel)', color: 'var(--ink)', fontWeight: 700, cursor: 'pointer' }}>
              Review
            </button>
          )}
        </div>

        <div style={card}>
          <p style={kicker}>Ground link</p>
          <strong style={{ fontSize: 19 }}>{latestPacket ? (latestPacket.state === 'arrived' ? 'Earth has your latest' : 'Packet on its way') : 'Nothing sent today'}</strong>
          <span style={{ fontSize: 13.5, color: 'var(--muted)' }}>
            {link.known ? `Earth knows your status as of ${new Date(link.known.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.` : 'The ground knows nothing about today yet.'} {D.formatDelay(link.delay)} each way.
          </span>
          <button type="button" onClick={() => go('escalation')} style={{ justifySelf: 'start', minHeight: 36, padding: '0 12px', borderRadius: 10, border: '1.5px solid var(--ink)', background: 'var(--panel)', color: 'var(--ink)', fontWeight: 700, cursor: 'pointer' }}>
            Open Escalate
          </button>
        </div>
      </section>

      {/* Row: patterns and gaps, hazards, radiation, food and water */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 14 }}>
        <div style={card}>
          <p style={kicker}>Patterns and gaps</p>
          {pats.length === 0 && gaps.length === 0 && <span style={{ fontSize: 14.5, color: 'var(--muted)' }}>Nothing moving the wrong way together.</span>}
          {pats.map((p) => (
            <span key={p.id} style={{ fontSize: 14.5 }}>
              <strong style={{ color: TONE[p.status] }}>{WORD[p.status]}</strong> {p.title} · next step {p.rungName}
            </span>
          ))}
          {gaps.map((x) => (
            <span key={x.id} style={{ fontSize: 14 }}>
              You rated your {x.rated.label} {x.rated.value}/10, but {x.measured[0].text}.
            </span>
          ))}
          <button type="button" onClick={() => go('bodymap')} style={{ justifySelf: 'start', minHeight: 36, padding: '0 12px', borderRadius: 10, border: '1.5px solid var(--ink)', background: 'var(--panel)', color: 'var(--ink)', fontWeight: 700, cursor: 'pointer' }}>
            Care plans on the body map
          </button>
        </div>

        <div style={card}>
          <p style={kicker}>The five hazards</p>
          <div style={{ display: 'grid', gap: 6 }}>
            {hz.map((h) => (
              <span key={h.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 14 }}>
                <span>{h.name}</span>
                <strong style={{ color: TONE[h.status] }}>{WORD[h.status]}</strong>
              </span>
            ))}
          </div>
          <DoseBudget b={budget as never} />
        </div>

        <div style={card}>
          <p style={kicker}>Food and water today</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 34, fontWeight: 750, letterSpacing: '-0.04em' }}>{Number(water.water.toFixed(2))}</span>
            <span style={{ color: 'var(--muted)' }}>of {water.goal} L</span>
          </div>
          <div role="progressbar" aria-label="Water today" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(Math.min(1, water.water / water.goal) * 100)} style={{ height: 10, borderRadius: 99, background: 'var(--paper-deep)', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(1, water.water / water.goal) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #0b3d91, #4cc9f0)' }} />
          </div>
          <span style={{ fontSize: 14 }}>{water.meals.filter((m) => m !== 'snack').length} of 3 main meals logged</span>
          <button type="button" onClick={() => go('manual')} style={{ justifySelf: 'start', minHeight: 36, padding: '0 12px', borderRadius: 10, border: '1.5px solid var(--ink)', background: 'var(--panel)', color: 'var(--ink)', fontWeight: 700, cursor: 'pointer' }}>
            Log food and water
          </button>
        </div>
      </section>
    </main>
  )
}
