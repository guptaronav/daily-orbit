import { useState } from 'react'
import * as D from './data'
import { useStoreTick } from './shared'

/*
 * NASA's five hazards of human spaceflight, as this crew member lives them on this mission. Each
 * tile takes the worst status of the readings its sourced text links to, says what the hazard is,
 * what it means here (the mission environment chosen in the top bar), and what to watch for.
 * The closed-environment tile also shows the simulated cabin air against NASA's CO2 limit.
 */

type Hazard = {
  id: string
  name: string
  url?: string
  what: string
  body: string
  selfCare: string
  status: 'gray' | 'green' | 'yellow' | 'red'
  measured: number
  linked: string[]
  flagged: string[]
  here: string
}
type Budget = { used: number; remaining: number; fraction: number; rate: number; daysLeft: number; status: 'green' | 'yellow' | 'red'; limit: number; limitUrl: string; missionDays: number; rateBasis: string; rateUrl: string; prior: number; priorSimulated: boolean; event: number }
type Cabin = { series: { day: string; value: number }[]; limit: number | null; unit: string; facts: { text: string; url: string }[]; limitText: string; limitUrl: string; headache: boolean }

const ICON: Record<string, string> = {
  radiation: 'M12 12m-2 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0 M12 2a10 10 0 0 1 8.66 5 l-6.93 4 M3.34 7A10 10 0 0 1 12 2v8 M12 22a10 10 0 0 1-8.66-5l6.93-4 M20.66 17A10 10 0 0 1 12 22v-8',
  isolation: 'M12 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1 M2 2l20 20',
  distance: 'M3 12h18 M15 6l6 6-6 6 M5 8a2 2 0 1 0 0 .01Z',
  gravity: 'M12 3v14 M6 11l6 6 6-6 M4 21h16',
  environment: 'M3 10l9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z M9 21v-6h6v6',
}
const TONE = {
  gray: { word: 'No data yet', bg: 'var(--paper-deep)', ink: 'var(--nodata-ink)', bar: 'var(--nodata)' },
  green: { word: 'Within baseline', bg: 'rgba(47,125,79,.1)', ink: 'var(--ok-ink)', bar: 'var(--ok)' },
  yellow: { word: 'Watch', bg: 'rgba(183,121,31,.12)', ink: 'var(--watch-ink)', bar: 'var(--watch)' },
  red: { word: 'Act', bg: 'rgba(179,38,30,.1)', ink: 'var(--act-ink)', bar: 'var(--act)' },
}

function CabinAir({ c }: { c: Cabin }) {
  const max = Math.max(c.limit ?? 0, ...c.series.map((p) => p.value)) * 1.15 || 1
  const H = 70
  const today = c.series[c.series.length - 1]
  const over = c.limit != null && today.value > c.limit
  return (
    <div style={{ display: 'grid', gap: 8, padding: 12, borderRadius: 14, background: 'var(--panel)', border: '1px solid var(--rule)' }}>
      <p style={{ margin: 0, display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 13 }}>
        <strong>Cabin CO₂</strong>
        <span style={{ padding: '1px 8px', borderRadius: 99, background: 'var(--paper-deep)', color: 'var(--muted)', fontSize: 11.5, fontWeight: 700 }}>Simulated</span>
      </p>
      <div role="img" aria-label={`Simulated cabin CO2, last 7 days: ${c.series.map((p) => `${p.value} ${c.unit}`).join(', ')}${c.limit != null ? `. NASA limit ${c.limit} ${c.unit}` : ''}`} style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', gap: 6, height: H }}>
        {c.limit != null && <span aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, bottom: (c.limit / max) * H, borderTop: '1.5px dashed var(--act)' }} />}
        {c.series.map((p, i) => (
          <span key={p.day} style={{ flex: 1, height: Math.max(3, (p.value / max) * H), borderRadius: 6, background: c.limit != null && p.value > c.limit ? 'var(--act)' : i === c.series.length - 1 ? 'var(--accent)' : 'var(--rule-strong)' }} />
        ))}
      </div>
      <p style={{ margin: 0, fontSize: 12.5, color: 'var(--muted)' }}>
        Today {today.value} {c.unit}
        {c.limit != null ? ` · NASA limit ${c.limit} ${c.unit} (dashed line)` : ''}
        {over ? ' · above the limit' : ''}
      </p>
      {c.headache && (
        <p style={{ margin: 0, fontSize: 13, padding: '8px 10px', borderRadius: 10, background: 'rgba(183,121,31,.12)' }}>
          You reported a headache today. {c.facts[0]?.text ?? ''}
        </p>
      )}
    </div>
  )
}

export function DoseBudget({ b }: { b: Budget }) {
  const color = b.status === 'red' ? 'var(--act)' : b.status === 'yellow' ? 'var(--watch)' : 'var(--ok)'
  return (
    <div style={{ display: 'grid', gap: 6, padding: 12, borderRadius: 14, background: 'var(--panel)', border: '1px solid var(--rule)' }}>
      <p style={{ margin: 0, display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 13 }}>
        <strong>Career dose{D.systemsOnline().shelter ? <span style={{ marginLeft: 6, padding: '1px 7px', borderRadius: 99, background: 'rgba(47,125,79,.14)', color: 'var(--ok-ink)', fontSize: 11, fontWeight: 750 }}>Shelter ready</span> : null}</strong>
        <span style={{ color: 'var(--muted)' }}>
          {Math.round(b.used)} of {b.limit} mSv
        </span>
      </p>
      <div role="progressbar" aria-label="Career radiation dose used" aria-valuemin={0} aria-valuemax={b.limit} aria-valuenow={Math.round(b.used)} style={{ height: 10, borderRadius: 99, background: 'var(--paper-deep)', overflow: 'hidden' }}>
        <div style={{ width: `${b.fraction * 100}%`, height: '100%', background: color, transition: 'width 600ms ease' }} />
      </div>
      <p style={{ margin: 0, fontSize: 12.5, color: 'var(--ink-soft)' }}>
        {b.remaining > 0 ? `About ${b.daysLeft.toLocaleString()} days left at ${b.rate} mSv a day.` : 'Career limit reached.'}
      </p>
      <p style={{ margin: 0, fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.45 }}>
        Limit: NASA-STD-3001 [V1 4030], under 600 mSv per career.{' '}
        <a href={b.limitUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>
          Source
        </a>
        . Rate: {b.rateBasis}. {b.priorSimulated && b.prior ? `Earlier missions (${b.prior} mSv) are simulated. ` : ''}A planning estimate, not dosimetry.
      </p>
    </div>
  )
}

export function HazardsPanel() {
  useStoreTick()
  const s = D.getState()
  const list = D.hazards(s.crew.id) as Hazard[]
  const cabin = D.cabin(s.crew.id) as Cabin
  const budget = D.radiationBudget(s.crew.id) as Budget
  const [open, setOpen] = useState<string | null>(null)

  return (
    <section data-reveal="1" aria-labelledby="hazards-heading" style={{ borderRadius: 28, background: '#14181f', color: '#f3f1ea', padding: 'clamp(18px, 2.4vw, 26px)', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
        <h2 id="hazards-heading" style={{ margin: 0, fontSize: 'clamp(20px, 2.2vw, 26px)', fontWeight: 750, letterSpacing: '-0.03em' }}>
          The five hazards, on this mission
        </h2>
        <span style={{ fontSize: 13, color: 'rgba(243,241,234,.7)' }}>
          {s.env.label} · {D.formatDelay(s.delay)} one way · change it in the top bar
        </span>
      </div>
      <ul className="hazard-grid" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {list.map((h) => {
          const t = TONE[h.status]
          const isOpen = open === h.id
          return (
            <li key={h.id} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 14, borderRadius: 18, background: 'var(--panel)', color: 'var(--ink)', borderTop: `5px solid ${t.bar}` }}>
              <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d={ICON[h.id]} />
                </svg>
                <strong style={{ fontSize: 15, lineHeight: 1.2 }}>{h.name}</strong>
              </p>
              <span style={{ alignSelf: 'flex-start', padding: '2px 9px', borderRadius: 99, background: t.bg, color: t.ink, fontSize: 12, fontWeight: 750 }}>
                {t.word}
                {h.flagged.length ? `: ${h.flagged.join(', ')}` : ''}
              </span>
              {h.here && (
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.45 }}>
                  <strong>Here: </strong>
                  {h.here}
                </p>
              )}
              {h.id === 'environment' && (D.systemsOnline().telemetry ? <CabinAir c={cabin} /> : <p style={{ margin: 0, fontSize: 12.5, color: 'var(--muted)' }}>Cabin air telemetry comes online when the crew reaches 300 points together.</p>)}
              {h.id === 'radiation' && <DoseBudget b={budget} />}
              {h.id === 'radiation' && (
                <button type="button" onClick={() => document.getElementById('radiation-replay')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} style={{ justifySelf: 'start', minHeight: 32, padding: '0 10px', borderRadius: 10, border: '1.5px solid var(--ink)', background: 'var(--panel)', color: 'var(--ink)', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}>
                  Replay a real solar storm
                </button>
              )}
              <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : h.id)} style={{ alignSelf: 'flex-start', marginTop: 'auto', minHeight: 32, padding: '0 10px', borderRadius: 9, border: '1.5px solid var(--rule-strong)', background: 'transparent', color: 'var(--ink)', fontWeight: 650, cursor: 'pointer', fontSize: 13 }}>
                {isOpen ? 'Less' : 'What it is'}
              </button>
              {isOpen && (
                <div style={{ display: 'grid', gap: 6, fontSize: 13, lineHeight: 1.45, animation: 'ms-pop 260ms ease both' }}>
                  {h.what && <p style={{ margin: 0 }}>{h.what}</p>}
                  {h.body && <p style={{ margin: 0, color: 'var(--ink-soft)' }}>{h.body}</p>}
                  {h.selfCare && (
                    <p style={{ margin: 0 }}>
                      <strong>Watch for: </strong>
                      {h.selfCare}
                    </p>
                  )}
                  <p style={{ margin: 0, color: 'var(--muted)' }}>Your readings it touches: {h.linked.join(', ') || 'none yet'}.</p>
                  {h.url && (
                    <a href={h.url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>
                      NASA: {h.name}
                    </a>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
