import { useState } from 'react'
import { CAREER_LIMIT_MSV, CAREER_LIMIT_SOURCE, DAILY_RATE } from '../lib/radiationBudget'
import type { EnvId } from '../lib/environments'
import * as D from './data'
import { useStoreTick } from './shared'

/*
 * Mission forecast: where two slow, invisible hazards are heading if the mission runs its length.
 * Only NASA's own figures are used, and where NASA has no figure the forecast says so instead of
 * guessing.
 *
 *  - Bone: "on average, bones lose between 1% and 1.5% of their density each month during
 *    four-to-six-month missions" (NASA HRP, Risk of Spaceflight-Induced Bone Changes). Shown for
 *    weightless missions only; NASA has no measured monthly rate for Moon or Mars gravity.
 *  - Radiation: the career budget (NASA-STD-3001, 600 mSv) at the mission's NASA daily rate.
 */

const BONE_SOURCE = 'https://www.nasa.gov/reference/risk-of-spaceflight-induced-bone-changes/'
const EXERCISE_SOURCE = 'https://www.nasa.gov/missions/station/iss-research/astronaut-exercise/'
const WEIGHTLESS: EnvId[] = ['iss', 'mars']
const DEFAULT_DAYS: Record<EnvId, number> = { iss: 180, lunar: 30, lunarRover: 30, mars: 1000, marsSurface: 500 }
const DAYS_PER_MONTH = 30.44

type Budget = { prior: number; missionDays: number; rate: number; limit: number }

const card = { borderRadius: 26, background: 'var(--panel)', border: '1px solid var(--rule)', padding: 20, display: 'grid', gap: 12, alignContent: 'start', minWidth: 0 } as const
const kicker = { margin: 0, fontSize: 12, fontWeight: 750, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--muted)' } as const

/** A simple line chart: x = mission day, a shaded band or a line, a "today" marker and a limit. */
function Chart({ days, today, lo, hi, max, limit, unit, color, label }: { days: number; today: number; lo: (d: number) => number; hi: (d: number) => number; max: number; limit?: number; unit: string; color: string; label: string }) {
  const W = 520, H = 200, L = 44, R = 12, T = 12, B = 26
  const x = (d: number) => L + (d / days) * (W - L - R)
  const y = (v: number) => T + (1 - v / max) * (H - T - B)
  const N = 40
  const pts = Array.from({ length: N + 1 }, (_, i) => (i / N) * days)
  const upper = pts.map((d) => `${x(d).toFixed(1)},${y(hi(d)).toFixed(1)}`)
  const lower = pts.map((d) => `${x(d).toFixed(1)},${y(lo(d)).toFixed(1)}`).reverse()
  const band = lo(days) !== hi(days)
  // Round, readable steps: 1, 2, 2.5 or 5 times a power of ten, about four of them.
  const raw = max / 4
  const mag = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((v) => v >= raw) ?? raw
  const ticks = Array.from({ length: Math.floor(max / step) + 1 }, (_, i) => Math.round(i * step * 100) / 100)
  const t = Math.min(today, days)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={label} style={{ display: 'block' }}>
      {ticks.map((v) => (
        <g key={v}>
          <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="var(--rule)" strokeWidth="1" />
          <text x={L - 6} y={y(v) + 4} textAnchor="end" fontSize="11" fill="var(--muted)">{v}{unit}</text>
        </g>
      ))}
      {limit !== undefined && limit <= max && (
        <g>
          <line x1={L} x2={W - R} y1={y(limit)} y2={y(limit)} stroke="var(--act)" strokeWidth="1.5" strokeDasharray="5 4" />
          <text x={W - R} y={y(limit) - 5} textAnchor="end" fontSize="11" fontWeight="700" fill="var(--act-ink)">NASA limit</text>
        </g>
      )}
      {band ? (
        <polygon points={[...upper, ...lower].join(' ')} fill={color} fillOpacity="0.22" stroke={color} strokeWidth="1.5" />
      ) : (
        <polyline points={upper.join(' ')} fill="none" stroke={color} strokeWidth="2.5" />
      )}
      <line x1={x(t)} x2={x(t)} y1={T} y2={H - B} stroke="var(--ink)" strokeWidth="1.5" />
      <text x={x(t) + 4} y={T + 10} fontSize="11" fontWeight="700" fill="var(--ink)">today</text>
      <text x={L} y={H - 6} fontSize="11" fill="var(--muted)">day 0</text>
      <text x={W - R} y={H - 6} textAnchor="end" fontSize="11" fill="var(--muted)">day {days}</text>
    </svg>
  )
}

export function MissionForecast() {
  useStoreTick()
  const s = D.getState()
  const env = s.env.id as EnvId
  const crewId = s.crew.id as string
  const b = D.radiationBudget(crewId) as Budget
  const [days, setDays] = useState<number | null>(null)
  const length = days ?? Math.max(DEFAULT_DAYS[env] ?? 180, b.missionDays + 30)
  const today = b.missionDays
  const rate = DAILY_RATE[env]?.mSvPerDay ?? b.rate
  const weightless = WEIGHTLESS.includes(env)

  // Radiation: earlier missions plus this mission's NASA daily rate.
  const dose = (d: number) => b.prior + d * rate
  const end = dose(length)
  const crossDay = rate > 0 ? Math.ceil((CAREER_LIMIT_MSV - b.prior) / rate) : Infinity
  const radMax = Math.max(CAREER_LIMIT_MSV * 1.1, end * 1.05)

  // Bone: 1% to 1.5% a month, in weightlessness only.
  const boneLo = (d: number) => (d / DAYS_PER_MONTH) * 1
  const boneHi = (d: number) => (d / DAYS_PER_MONTH) * 1.5
  const boneMax = Math.max(5, Math.ceil(boneHi(length) / 5) * 5)

  // Exercise this week, against the ISS's two hours a day.
  const ex = (D.crewData(crewId) as { readings: Record<string, { history: { t: number; v: number; passed: boolean }[] }> }).readings.exerciseMinutes
  const week = (ex?.history ?? []).filter((h) => h.passed && Date.now() - h.t < 7 * 86_400_000)
  const perDay = week.length ? Math.round(week.reduce((a, h) => a + h.v, 0) / 7) : null

  return (
    <section aria-labelledby="forecast-heading" style={{ display: 'grid', gap: 18 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px 24px' }}>
        <div>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)' }}>Mission forecast · {s.env.label}</p>
          <h2 id="forecast-heading" style={{ margin: '6px 0 0', fontSize: 'clamp(30px, 3.8vw, 46px)', lineHeight: 1, fontWeight: 750, letterSpacing: '-0.04em' }}>
            Where this mission is heading
          </h2>
        </div>
        <p style={{ margin: 0, maxWidth: '50ch', fontSize: 15, lineHeight: 1.55, color: 'var(--muted)' }}>
          Bone loss and radiation build up slowly and can't be felt. This projects both to the end of the mission from NASA's own rates. Where NASA has no number, we don't make one up.
        </p>
      </div>

      <div style={{ ...card, gap: 8 }}>
        <label htmlFor="forecast-days" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, fontWeight: 700 }}>
          <span>Mission length</span>
          <span>
            {length} days <span style={{ color: 'var(--muted)', fontWeight: 600 }}>· about {(length / DAYS_PER_MONTH).toFixed(length < 90 ? 1 : 0)} months · today is day {today}</span>
          </span>
        </label>
        <input id="forecast-days" type="range" min={Math.max(30, today)} max={1100} step={10} value={length} onChange={(e) => setDays(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--ink)' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))', gap: 18 }}>
        <div style={card}>
          <p style={kicker}>Bone density lost</p>
          {weightless ? (
            <>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5 }}>
                By day {length}: <strong style={{ fontSize: 24, letterSpacing: '-0.02em' }}>{boneLo(length).toFixed(0)}–{boneHi(length).toFixed(0)}%</strong> lower, if the loss NASA measured on four-to-six-month missions keeps its pace.
              </p>
              <Chart days={length} today={today} lo={boneLo} hi={boneHi} max={boneMax} unit="%" color="#b7791f" label={`Projected bone density loss, ${boneLo(length).toFixed(0)} to ${boneHi(length).toFixed(0)} percent by day ${length}`} />
              <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>
                NASA: bones lose 1% to 1.5% of their density each month in weightlessness. Measured on four-to-six-month missions, so longer projections are an extrapolation.{' '}
                <a href={BONE_SOURCE} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>Source ↗</a>
              </p>
            </>
          ) : (
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55 }}>
              <strong>Not projected here.</strong> This mission has some gravity ({env === 'marsSurface' ? 'about a third' : 'one-sixth'} of Earth's). NASA's measured rate of 1% to 1.5% a month is for weightlessness, and NASA has no measured rate for partial gravity yet, so a number here would be a guess.{' '}
              <a href={BONE_SOURCE} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>Source ↗</a>
            </p>
          )}
          <div style={{ padding: '10px 12px', borderRadius: 14, background: 'var(--panel-2)', fontSize: 13.5, lineHeight: 1.5 }}>
            <strong>What helps:</strong> exercise is NASA's main countermeasure; ISS crews exercise about two hours a day.{' '}
            {perDay === null ? 'Log your exercise to see your own pace.' : <>Your last 7 days: <strong>{perDay} min a day</strong>.</>}{' '}
            <a href={EXERCISE_SOURCE} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>Source ↗</a>
          </div>
        </div>

        <div style={card}>
          <p style={kicker}>Career radiation dose</p>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5 }}>
            By day {length}: <strong style={{ fontSize: 24, letterSpacing: '-0.02em' }}>{Math.round(end)} mSv</strong> of NASA's {CAREER_LIMIT_MSV} mSv career limit
            {crossDay <= length ? (
              <strong style={{ color: 'var(--act-ink)' }}> · crosses the limit on day {crossDay}</strong>
            ) : (
              <span style={{ color: 'var(--muted)' }}> · {Math.round((end / CAREER_LIMIT_MSV) * 100)}% used</span>
            )}
            .
          </p>
          <Chart days={length} today={today} lo={dose} hi={dose} max={radMax} limit={CAREER_LIMIT_MSV} unit="" color="#0b3d91" label={`Projected career dose, ${Math.round(end)} millisieverts by day ${length}`} />
          <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>
            {b.prior > 0 ? `Starts from ${b.prior} mSv on earlier missions (simulated for the demo crew). ` : ''}At {DAILY_RATE[env]?.basis ?? `${rate} mSv a day`}. A solar storm adds on top: replay one in Five hazards.{' '}
            <a href={CAREER_LIMIT_SOURCE} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>Limit ↗</a>{' '}
            <a href={DAILY_RATE[env]?.url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>Rate ↗</a>
          </p>
        </div>
      </div>
      <p style={{ margin: 0, fontSize: 12.5, color: 'var(--muted)' }}>A planning projection from published averages, not a prediction for this person. Real bone and dose are measured by scans and dosimeters.</p>
    </section>
  )
}
