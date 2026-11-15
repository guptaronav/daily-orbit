import { useEffect, useId, useReducer, useState } from 'react'
import * as D from './data'

/*
 * Food and water on the Log screen. Water fills a drink pouch (crews drink from sealed pouches
 * through a straw); meals are four tap-to-mark tiles. Logging earns the usual once-a-day effort
 * credit, never anything for the amount. A finished day becomes one waterIntake and one
 * mealsEaten reading, which the gut and nutrition region compares with your own baseline.
 */

type Tip = { text: string; url: string }

/** Short NASA nutrition facts, each from the page linked beside it. */
export const NUTRITION_TIPS: Tip[] = [
  { text: "Astronauts often don't eat enough in flight and can lose weight, so NASA monitors intake and body mass.", url: "https://www.nasa.gov/directorates/esdmd/hhp/nutritional-biochemistry/" },
  { text: "NASA's exploration requirement for daily fluid (food plus drinks) is 32 mL per kg of body mass, and at least 2,500 mL for men or 2,100 mL for women.", url: "https://ntrs.nasa.gov/api/citations/20205008306/downloads/JSC67378%20Expl%20Nutr%20Reqs%20042020.pdf" },
  { text: "Fluid shifts can make your body think it has extra fluid, so you may drink less. Drink on purpose, especially if you feel sick.", url: "https://www.nasa.gov/wp-content/uploads/2025/09/ochmo-mtb-004-space-adaptation-sickness-sas.pdf" },
  { text: "Skipped meals lead to undernourishment. Crew days are planned with time for meals, including eating together as a team.", url: "https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-013-food-and-nutrition.pdf" },
  { text: "The ISS recovers about 98% of its water, from urine and from breath and sweat moisture. Each crew member needs about a gallon a day for drinking, food and hygiene.", url: "https://www.nasa.gov/missions/station/iss-research/nasa-achieves-water-recovery-milestone-on-international-space-station/" },
  { text: "Your body can't make vitamin D on a spacecraft, and fish, omega-3s and vegetables are good for bone health.", url: "https://www.nasa.gov/directorates/esdmd/hhp/nutritional-biochemistry/" },
]

// The tips are searchable from Ask Orbit too.
D.addPassages(NUTRITION_TIPS.map((t, k) => ({ id: `nutrition:${k}`, title: 'Food and water in space', text: t.text, url: t.url })))

const MEAL_ICON: Record<string, string> = {
  breakfast: 'M12 3v3 M5.6 7.6l2.1 2.1 M3 15h18 M18.4 7.6l-2.1 2.1 M7 15a5 5 0 0 1 10 0 M5 19h14',
  lunch: 'M12 2v2 M12 20v2 M4.9 4.9l1.4 1.4 M17.7 17.7l1.4 1.4 M2 12h2 M20 12h2 M4.9 19.1l1.4-1.4 M17.7 6.3l1.4-1.4 M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
  dinner: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z',
  snack: 'M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5 M8.5 8.5h.01 M16 15.5h.01 M12 12h.01 M11 17h.01 M7 14h.01',
}

const press = (bg: string, ink: string, shadow: string) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  minHeight: 48,
  padding: '0 18px',
  borderRadius: 14,
  border: 0,
  background: bg,
  color: ink,
  boxShadow: `0 4px 0 ${shadow}`,
  fontSize: 15,
  fontWeight: 750,
  cursor: 'pointer',
  transition: 'transform 90ms ease, box-shadow 90ms ease',
})

export function FoodWater() {
  const [, bump] = useReducer((n: number) => n + 1, 0)
  useEffect(() => D.onState(bump), [])
  const id: string = D.getState().crew.id
  useEffect(() => {
    void D.commitIntake(id)
  }, [id])
  const [coin, setCoin] = useState<{ n: number; k: number; where: string } | null>(null)
  const [tip, setTip] = useState(0)
  const uid = 'fw' + useId().replace(/[^a-zA-Z0-9]/g, '')

  const v = D.intake(id) as { water: number; meals: string[]; goal: number; custom: boolean; week: { day: string; water: number; today: boolean }[] }
  const frac = Math.min(1, v.goal ? v.water / v.goal : 0)
  const reached = v.water >= v.goal
  const mainMeals = v.meals.filter((m) => m !== 'snack').length

  const paid = (n: number, where: string) => {
    if (n > 0) setCoin((c) => ({ n, k: (c?.k ?? 0) + 1, where }))
  }

  // The pouch: water level from 92 (empty) to 22 (full) in its own coordinates.
  const level = 92 - frac * 70
  const maxWeek = Math.max(v.goal, ...v.week.map((w) => w.water)) || 1
  const tips = NUTRITION_TIPS
  const t = tips.length ? tips[tip % tips.length] : null

  return (
    <section aria-labelledby={`${uid}h`} style={{ borderRadius: 28, background: 'var(--panel)', border: '1px solid var(--rule)', padding: 'clamp(18px, 2.4vw, 28px)', display: 'flex', flexDirection: 'column', gap: 20, animation: 'lg-rise 520ms 120ms cubic-bezier(.22,1,.36,1) both' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h2 id={`${uid}h`} style={{ margin: 0, fontSize: 'clamp(24px, 2.6vw, 32px)', fontWeight: 750, letterSpacing: '-0.035em' }}>
            Food and water
          </h2>
          <p style={{ margin: '6px 0 0', fontSize: 15, color: 'var(--muted)', maxWidth: 560 }}>Log as you go. Each finished day feeds the gut and nutrition region of your body map.</p>
        </div>
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>+{D.POINTS.readingLogged} coins for each, once a day</span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
        {/* Water */}
        <div style={{ position: 'relative', flex: '1 1 340px', display: 'flex', gap: 20, alignItems: 'center', padding: 18, borderRadius: 22, background: 'var(--panel-2)', border: `2px solid ${reached ? 'var(--ok)' : 'transparent'}`, transition: 'border-color 300ms ease' }}>
          <svg width="96" height="128" viewBox="0 0 80 106" role="img" aria-label={`Water pouch, ${Math.round(frac * 100)} percent of today's goal`} style={{ flex: '0 0 auto', overflow: 'visible' }}>
            <defs>
              <clipPath id={`${uid}c`}>
                <path d="M14 18 Q14 12 20 12 H60 Q66 12 66 18 V90 Q66 98 58 98 H22 Q14 98 14 90 Z" />
              </clipPath>
              <linearGradient id={`${uid}w`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#4cc9f0" />
                <stop offset="1" stopColor="#0b3d91" />
              </linearGradient>
            </defs>
            <path d="M36 12 V3 Q36 0 39 0 H41 Q44 0 44 3 V12" fill="var(--rule-strong)" stroke="var(--ink)" strokeWidth="1.5" />
            <rect x="34" y="8" width="12" height="5" rx="1.5" fill="#f6c445" stroke="var(--ink)" strokeWidth="1.2" />
            <g clipPath={`url(#${uid}c)`}>
              <rect x="0" y="0" width="80" height="106" fill="rgba(76,201,240,.08)" />
              <g style={{ transform: `translateY(${level}px)`, transition: 'transform 700ms cubic-bezier(.34,1.56,.64,1)' }}>
                <path d="M-40 4 Q-30 0 -20 4 T0 4 T20 4 T40 4 T60 4 T80 4 T100 4 V120 H-40 Z" fill={`url(#${uid}w)`} style={{ animation: 'fw-wave 2.4s linear infinite' }} />
                {[16, 34, 52].map((x, i) => (
                  <circle key={x} cx={x} cy={22 + i * 9} r={1.6 + (i % 2)} fill="rgba(255,255,255,.55)" style={{ animation: `fw-bubble ${2.2 + i * 0.6}s ease-in ${i * 0.5}s infinite` }} />
                ))}
              </g>
            </g>
            <path d="M14 18 Q14 12 20 12 H60 Q66 12 66 18 V90 Q66 98 58 98 H22 Q14 98 14 90 Z" fill="none" stroke="var(--ink)" strokeWidth="2" />
            {[0.25, 0.5, 0.75].map((f) => (
              <path key={f} d={`M60 ${92 - f * 70} H66`} stroke="var(--ink)" strokeWidth="1.2" opacity=".5" />
            ))}
          </svg>
          <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ margin: 0, display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 40, fontWeight: 750, letterSpacing: '-0.04em', lineHeight: 1 }}>{Number(v.water.toFixed(2))}</span>
              <span style={{ fontSize: 15, color: 'var(--muted)' }}>of {v.goal} L</span>
            </p>
            <p role="status" style={{ margin: 0, fontSize: 14, fontWeight: 650, color: reached ? 'var(--ok-ink)' : 'var(--muted)' }}>
              {reached ? 'Goal reached for today' : `${Number(Math.max(0, v.goal - v.water).toFixed(2))} L to go`}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <button type="button" className="fw-press" style={press('#14181f', '#f3f1ea', '#000')} onClick={() => paid(D.addWater(id, 0.25), 'water')}>
                +250 mL
              </button>
              <button type="button" className="fw-press" style={press('#0b3d91', '#fff', '#06224f')} onClick={() => paid(D.addWater(id, 0.5), 'water')}>
                +500 mL
              </button>
              <button type="button" disabled={v.water <= 0} onClick={() => D.addWater(id, -0.25)} style={{ minHeight: 48, padding: '0 10px', border: 0, background: 'transparent', color: v.water > 0 ? 'var(--accent)' : 'var(--muted)', fontWeight: 650, textDecoration: 'underline', textUnderlineOffset: 3, cursor: v.water > 0 ? 'pointer' : 'not-allowed' }}>
                Undo 250 mL
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: 'var(--muted)' }}>
              <span>Daily goal</span>
              <button type="button" aria-label="Lower the daily water goal" onClick={() => D.setWaterGoal(id, v.goal - 0.25)} style={{ width: 30, height: 30, borderRadius: 99, border: '1.5px solid var(--rule-strong)', background: 'var(--panel)', color: 'var(--ink)', cursor: 'pointer', fontWeight: 700 }}>
                −
              </button>
              <strong style={{ color: 'var(--ink)', minWidth: 44, textAlign: 'center' }}>{v.goal} L</strong>
              <button type="button" aria-label="Raise the daily water goal" onClick={() => D.setWaterGoal(id, v.goal + 0.25)} style={{ width: 30, height: 30, borderRadius: 99, border: '1.5px solid var(--rule-strong)', background: 'var(--panel)', color: 'var(--ink)', cursor: 'pointer', fontWeight: 700 }}>
                +
              </button>
            </div>
            <p style={{ margin: 0, fontSize: 12.5, color: 'var(--muted)', maxWidth: 320 }}>
              {v.custom ? 'Your own goal. ' : 'Default from NASA’s fluid requirement: 32 mL per kg of body mass a day, food and drinks together. '}
              <a href={D.WATER_GOAL_SOURCE} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>
                Source
              </a>
            </p>
          </div>
          {coin?.where === 'water' && (
            <span key={coin.k} aria-hidden="true" style={{ position: 'absolute', top: 10, right: 14, fontWeight: 800, color: '#a8740a', animation: 'fw-coin 1100ms ease-out forwards' }}>
              +{coin.n}
            </span>
          )}
        </div>

        {/* Meals */}
        <div style={{ position: 'relative', flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: 12, padding: 18, borderRadius: 22, background: 'var(--panel-2)' }}>
          <p style={{ margin: 0, display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 14, color: 'var(--muted)' }}>
            <span>
              <strong style={{ color: 'var(--ink)', fontSize: 18 }}>{mainMeals} of 3</strong> main meals
            </span>
            <span>{v.meals.includes('snack') ? 'Snack logged' : ''}</span>
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
            {D.MEALS.map(([key, label]: string[]) => {
              const on = v.meals.includes(key)
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={on}
                  className="fw-press"
                  onClick={() => paid(D.toggleMeal(id, key), 'meals')}
                  style={{ ...press(on ? '#14181f' : 'var(--panel)', on ? '#f3f1ea' : 'var(--ink)', on ? '#000' : 'var(--rule-strong)'), minHeight: 64, justifyContent: 'flex-start', padding: '0 14px', border: on ? 0 : '1.5px solid var(--rule)' }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={on ? '#f6c445' : 'currentColor'} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d={MEAL_ICON[key]} />
                  </svg>
                  <span style={{ flex: 1, textAlign: 'left' }}>{label}</span>
                  <span aria-hidden="true" style={{ display: 'grid', placeItems: 'center', width: 22, height: 22, borderRadius: 99, background: on ? '#f6c445' : 'transparent', border: on ? 0 : '1.5px solid var(--rule-strong)', color: '#14181f', fontSize: 13 }}>
                    {on ? '✓' : ''}
                  </span>
                </button>
              )
            })}
          </div>
          {coin?.where === 'meals' && (
            <span key={coin.k} aria-hidden="true" style={{ position: 'absolute', top: 10, right: 14, fontWeight: 800, color: '#a8740a', animation: 'fw-coin 1100ms ease-out forwards' }}>
              +{coin.n}
            </span>
          )}
        </div>
      </div>

      {/* The week of water, and a tip */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'stretch' }}>
        <figure style={{ margin: 0, flex: '1 1 300px', padding: '14px 16px', borderRadius: 18, border: '1px solid var(--rule)' }}>
          <figcaption style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 8 }}>Water, last 7 days (line is your goal)</figcaption>
          <div role="img" aria-label={`Water per day: ${v.week.map((w) => `${w.water} L`).join(', ')}`} style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', gap: 8, height: 84 }}>
            <span aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, bottom: `${(v.goal / maxWeek) * 70 + 14}px`, borderTop: '1.5px dashed var(--rule-strong)' }} />
            {v.week.map((w) => (
              <span key={w.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <span style={{ width: '100%', maxWidth: 28, height: Math.max(3, (w.water / maxWeek) * 70), borderRadius: 8, background: w.today ? 'linear-gradient(180deg, #4cc9f0, #0b3d91)' : w.water >= v.goal ? 'var(--ok)' : 'var(--rule-strong)', transition: 'height 500ms cubic-bezier(.22,1,.36,1)' }} />
                <span style={{ fontSize: 11, color: w.today ? 'var(--ink)' : 'var(--muted)', fontWeight: w.today ? 700 : 500 }}>{new Date(w.day + 'T12:00:00Z').toLocaleDateString([], { weekday: 'narrow' })}</span>
              </span>
            ))}
          </div>
        </figure>
        {t && (
          <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 10, padding: '14px 16px', borderRadius: 18, background: '#14181f', color: '#f3f1ea' }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#f6c445' }}>From NASA</p>
            <p key={tip} style={{ margin: 0, fontSize: 14.5, lineHeight: 1.5, animation: 'ms-pop 360ms ease both' }}>
              {t.text}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <a href={t.url} target="_blank" rel="noreferrer" style={{ color: '#9cbcff', fontSize: 12.5 }}>
                Source
              </a>
              <button type="button" onClick={() => setTip((n) => n + 1)} style={{ minHeight: 34, padding: '0 14px', borderRadius: 99, border: '1px solid rgba(243,241,234,.25)', background: 'transparent', color: '#f3f1ea', cursor: 'pointer', fontWeight: 650 }}>
                Next tip ({(tip % tips.length) + 1}/{tips.length})
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
