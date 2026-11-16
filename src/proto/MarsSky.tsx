import { CONJUNCTION_SOURCE, heliocentric, marsLink, nextBlackout, ORBIT_SOURCE } from '../lib/orbit'
import * as D from './data'

/*
 * Where Earth and Mars are today (JPL planet positions), drawn from above, with the real light
 * time between them and the next solar conjunction, when the Sun blocks the link for about two
 * weeks and the crew is on its own. Shown on a Mars mission only.
 */

const fmtDay = (d: Date) => d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })

export function MarsSky() {
  const env = D.getState().env.id as string
  if (env !== 'mars' && env !== 'marsSurface') return null
  const now = new Date()
  const link = marsLink(now)
  const next = nextBlackout(now)
  const e = heliocentric('earth', now)
  const m = heliocentric('mars', now)
  const S = 52 // px per au
  const c = 92
  const p = (v: number[]) => [c + v[0] * S, c - v[1] * S]
  const [ex, ey] = p(e)
  const [mx, my] = p(m)
  const days = next ? Math.round((next.start.getTime() - now.getTime()) / 86_400_000) : null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, padding: 14, borderRadius: 20, background: 'rgba(232,238,252,.05)', border: '1px solid rgba(232,238,252,.12)' }}>
      <svg viewBox="0 0 184 184" width="150" height="150" role="img" aria-label={`Earth and Mars today, ${link.au.toFixed(2)} astronomical units apart`} style={{ flex: '0 0 auto' }}>
        <circle cx={c} cy={c} r={1 * S} fill="none" stroke="rgba(76,201,240,.35)" strokeDasharray="2 3" />
        <circle cx={c} cy={c} r={1.524 * S} fill="none" stroke="rgba(232,116,44,.35)" strokeDasharray="2 3" />
        <line x1={ex} y1={ey} x2={mx} y2={my} stroke={link.blackout ? '#ff6b6b' : '#f6c445'} strokeWidth="1.5" strokeDasharray={link.blackout ? '3 3' : undefined} />
        <circle cx={c} cy={c} r="9" fill="#f6c445" />
        <circle cx={c} cy={c} r="14" fill="rgba(246,196,69,.18)" />
        <circle cx={ex} cy={ey} r="5.5" fill="#4cc9f0" />
        <circle cx={mx} cy={my} r="5" fill="#e8742c" />
        <text x={ex + 8} y={ey + 4} fill="#e8eefc" fontSize="10">Earth</text>
        <text x={mx + 8} y={my + 4} fill="#e8eefc" fontSize="10">Mars</text>
      </svg>
      <div style={{ flex: '1 1 220px', display: 'grid', gap: 6, fontSize: 14, lineHeight: 1.5 }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 750, letterSpacing: '.06em', textTransform: 'uppercase', color: '#f6c445' }}>Mars today</p>
        <p style={{ margin: 0 }}>
          <strong style={{ fontSize: 22, letterSpacing: '-0.02em' }}>{(link.delaySec / 60).toFixed(1)} min</strong> each way · {Math.round(link.km / 1e6)} million km
        </p>
        {link.blackout ? (
          <p style={{ margin: 0, color: '#ffb4b4', fontWeight: 650 }}>Solar conjunction now: the Sun is between Earth and Mars and nothing gets through. The crew decides alone.</p>
        ) : next ? (
          <p style={{ margin: 0, color: 'rgba(232,238,252,.8)' }}>
            Next blackout: <strong>{fmtDay(next.start)} to {fmtDay(next.end)}</strong>, in {days} days. The Sun sits between Earth and Mars and no message gets through, so the crew handles everything alone.
          </p>
        ) : null}
        <p style={{ margin: 0, fontSize: 12, color: 'rgba(232,238,252,.6)' }}>
          Planet positions from{' '}
          <a href={ORBIT_SOURCE} target="_blank" rel="noreferrer" style={{ color: 'inherit' }}>
            JPL
          </a>
          ; blackout when the Sun is within 2° of Mars, as{' '}
          <a href={CONJUNCTION_SOURCE} target="_blank" rel="noreferrer" style={{ color: 'inherit' }}>
            NASA describes
          </a>
          .
        </p>
      </div>
    </div>
  )
}
