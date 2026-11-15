import { useEffect, useReducer } from 'react'
import { readiness } from '../lib/readiness'
import * as D from './data'
import { getSnapshot } from './store'

/*
 * The weekly flight-surgeon report: one page per crew member covering the last seven days, laid
 * out to print cleanly (or save as PDF) with the app's chrome hidden. Every number comes from the
 * same functions the screens use, so the report can never disagree with the app.
 */

const DAY = 86_400_000
const WORD: Record<string, string> = { gray: 'No data', green: 'Within usual', yellow: 'Watch', red: 'Act' }
const TONE: Record<string, string> = { gray: 'var(--nodata-ink)', green: 'var(--ok-ink)', yellow: 'var(--watch-ink)', red: 'var(--act-ink)' }
const th = { textAlign: 'left', padding: '8px 10px', fontSize: 12, fontWeight: 750, letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--muted)', borderBottom: '2px solid var(--ink)' } as const
const td = { padding: '7px 10px', fontSize: 13.5, borderBottom: '1px solid var(--rule)', verticalAlign: 'top' } as const
const h2 = { margin: '22px 0 8px', fontSize: 18, fontWeight: 750, letterSpacing: '-0.02em' } as const

type Reading = { id: string; label: string; unit: string; dp: number; status: string; latest: { v: number } | null; baseline: { mean: number } | null; reference?: { mean: number } | null; history: { t: number; v: number; passed: boolean }[] }

export function ReportPage() {
  const [, bump] = useReducer((n: number) => n + 1, 0)
  useEffect(() => D.onState(bump), [])
  const s = D.getState()
  const crew = s.crew as { id: string; name: string; role: string }
  useEffect(() => D.markReportSeen(crew.id), [crew.id])
  const now = Date.now()
  const since = now - 7 * DAY
  const cd = D.crewData(crew.id) as { readings: Record<string, Reading>; regions: Record<string, { label: string; status: string }> }
  const rows = Object.values(cd.readings).filter((r) => r.latest)
  const pats = D.patterns(crew.id) as { id: string; title: string; status: 'yellow' | 'red'; rungName: string; risk: string }[]
  const gaps = D.gaps(crew.id) as { id: string; rated: { label: string; value: number }; measured: { text: string }[] }[]
  const alerts = (D.alerts() as { crewId: string; title: string; status: 'yellow' | 'red'; state: string; firstSeen: number; note?: string }[]).filter((a) => a.crewId === crew.id)
  const regions = D.REGIONS.map((r: { id: string; label: string }) => ({ label: r.label, status: (cd.regions[r.id]?.status ?? 'gray') as never }))
  const rd = readiness({ regions, patterns: pats, openAlerts: alerts.filter((a) => a.state !== 'closed'), gaps: gaps.length })
  const budget = D.radiationBudget(crew.id) as { used: number; limit: number; daysLeft: number; rate: number; rateBasis: string; missionDays: number }
  const water = D.intake(crew.id) as { week: { day: string; water: number }[]; goal: number }
  const g = D.game(crew.id) as { month: number[] }
  const last7 = g.month.slice(-7)
  const checkIns = last7.filter((x) => x > 0).length
  const exercise = last7.filter((x) => x > 1).length
  const packets = (D.groundLink(crew.id) as { list: { sentAt: number; count: number; state: string }[] }).list.filter((p) => p.sentAt >= since)
  const events = (getSnapshot().events[crew.id] ?? []).filter((e) => Date.parse(e.timestamp) >= since)
  const symptoms = events.filter((e) => e.kind === 'symptomReported').length
  const pvtb = (D.pvtbHistory(crew.id) as { at: number; lapses: number }[]).filter((x) => x.at >= since)
  const fmt = (r: Reading, v: number | undefined | null) => (v === null || v === undefined ? '—' : `${Number(v.toFixed(Math.min(2, r.dp)))}`)

  return (
    <main className="report-page" style={{ width: '100%', maxWidth: 980, margin: '0 auto', padding: '28px clamp(16px, 3vw, 32px) 72px', boxSizing: 'border-box' }}>
      <div className="no-print" style={{ display: 'flex', flexWrap: 'wrap', gap: '14px 20px', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
        <div style={{ display: 'grid', gap: 10, flex: '1 1 420px' }}>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)' }}>Weekly report · {crew.name}</p>
          <h1 style={{ margin: 0, fontSize: 'clamp(36px, 5vw, 60px)', lineHeight: 0.95, fontWeight: 750, letterSpacing: '-0.05em' }}>Your week, on one page.</h1>
          <span style={{ maxWidth: '60ch', fontSize: 15.5, lineHeight: 1.5, color: 'var(--ink-soft)' }}>The last seven days, ready to hand to the flight surgeon. Open it any day from the page icon in the top bar.</span>
        </div>
        <span style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <button
            type="button"
            onClick={() => {
              const blob = new Blob([D.readingsCsv(crew.id, 30) as string], { type: 'text/csv' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `daily-orbit-readings-${String(crew.name).replace(/\W+/g, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`
              a.click()
              setTimeout(() => URL.revokeObjectURL(url), 1000)
            }}
            style={{ minHeight: 46, padding: '0 16px', borderRadius: 14, border: '1.5px solid var(--ink)', background: 'var(--panel)', color: 'var(--ink)', fontWeight: 700, cursor: 'pointer' }}
          >
            Download readings (CSV, 30 days)
          </button>
          <button type="button" className="fw-press" onClick={() => window.print()} style={{ minHeight: 46, padding: '0 18px', borderRadius: 14, border: 0, background: '#14181f', color: '#f3f1ea', boxShadow: '0 5px 0 #000', fontWeight: 750, cursor: 'pointer' }}>
            Print or save as PDF
          </button>
        </span>
      </div>

      <article style={{ background: 'var(--panel)', border: '1px solid var(--rule)', borderRadius: 24, padding: 'clamp(18px, 3vw, 34px)' }}>
        <header style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, borderBottom: '2px solid var(--ink)', paddingBottom: 12 }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 750, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--accent)' }}>Daily Orbit · weekly health report</p>
            <h1 style={{ margin: '4px 0 0', fontSize: 30, fontWeight: 750, letterSpacing: '-0.03em' }}>
              {crew.id === 'guest' ? 'Guest' : crew.name}
              {crew.role ? `, ${crew.role}` : ''}
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 13.5, color: 'var(--muted)' }}>
              {new Date(since).toLocaleDateString()} to {new Date(now).toLocaleDateString()} · mission day {budget.missionDays + 1} · {s.env.label}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }}>Readiness now</p>
            <strong style={{ fontSize: 22 }}>{rd.label}</strong>
            <p style={{ margin: 0, fontSize: 12.5, color: 'var(--ink-soft)', maxWidth: 320 }}>{rd.reasons.slice(0, 3).join('; ')}</p>
          </div>
        </header>

        <h2 style={h2}>Readings against this person's own usual</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>Indicator</th>
              <th style={th}>Latest</th>
              <th style={th}>Usual</th>
              <th style={th}>7-day range</th>
              <th style={th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const wk = r.history.filter((h) => h.passed && h.t >= since).map((h) => h.v)
              const usual = r.reference?.mean ?? r.baseline?.mean
              return (
                <tr key={r.id}>
                  <td style={td}>{r.label}</td>
                  <td style={td}>
                    {fmt(r, r.latest?.v)} {r.unit}
                  </td>
                  <td style={td}>{usual === undefined ? '—' : `${fmt(r, usual)} ${r.unit}`}</td>
                  <td style={td}>{wk.length ? `${fmt(r, Math.min(...wk))} to ${fmt(r, Math.max(...wk))}` : 'No readings this week'}</td>
                  <td style={{ ...td, fontWeight: 700, color: TONE[r.status] }}>{WORD[r.status]}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <h2 style={h2}>Patterns and self-report gaps</h2>
        {pats.length === 0 && gaps.length === 0 ? (
          <p style={{ margin: 0, fontSize: 14 }}>None.</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 4, fontSize: 14 }}>
            {pats.map((p) => (
              <li key={p.id}>
                <strong>{p.title}</strong> ({WORD[p.status]}), {p.risk}. Suggested step: {p.rungName}.
              </li>
            ))}
            {gaps.map((x) => (
              <li key={x.id}>
                Rated {x.rated.label} {x.rated.value}/10 (usual or better), but {x.measured.map((m) => m.text).join(', and ')}.
              </li>
            ))}
          </ul>
        )}

        <h2 style={h2}>Alerts</h2>
        {alerts.length === 0 ? (
          <p style={{ margin: 0, fontSize: 14 }}>None.</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 4, fontSize: 14 }}>
            {alerts.map((a) => (
              <li key={a.title}>
                <strong>{a.title}</strong>: {a.state}
                {a.note ? `. Note: "${a.note}"` : ''}
              </li>
            ))}
          </ul>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18 }}>
          <div>
            <h2 style={h2}>Routine, last 7 days</h2>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>
              Mirror checks on {checkIns} of 7 days
              <br />
              Exercise logged on {exercise} of 7 days
              <br />
              Symptoms reported: {symptoms}
              <br />
              Packets sent to Earth: {packets.length}
              <br />
              3-minute alertness tests: {pvtb.length}
              {pvtb.length ? ` (latest: ${pvtb[0].lapses} slow responses of ${D.PVTB_LAPSE_MS} ms or more)` : ''}
            </p>
          </div>
          <div>
            <h2 style={h2}>Radiation</h2>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>
              Career dose about {Math.round(budget.used)} of {budget.limit} mSv (NASA-STD-3001 [V1 4030])
              <br />
              About {budget.daysLeft.toLocaleString()} days left at {budget.rate} mSv a day
              <br />
              <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>A planning estimate, not dosimetry.</span>
            </p>
          </div>
          <div>
            <h2 style={h2}>Water, last 7 days</h2>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>
              {water.week.map((x) => `${new Date(x.day + 'T12:00:00Z').toLocaleDateString([], { weekday: 'short' })} ${Number(x.water.toFixed(2))} L`).join(' · ')}
              <br />
              Goal {water.goal} L a day
            </p>
          </div>
        </div>

        <p style={{ margin: '24px 0 0', paddingTop: 10, borderTop: '1px solid var(--rule)', fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.5 }}>
          Generated {new Date(now).toLocaleString()} by Daily Orbit, a prototype and not a medical device. Statuses compare each reading with this person's own history; they are statistical flags, not diagnoses. Health
          text comes from NASA sources listed in the app.
        </p>
      </article>
    </main>
  )
}
