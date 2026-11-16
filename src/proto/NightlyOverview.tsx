import { planFor, type CustomBlock } from '../lib/schedule'
import * as D from './data'
import { navigate } from './dc'

/*
 * Tonight's wrap-up: from 6 pm (or with ?night=1 for a demo), Today opens with the day in one
 * card: what got done, what is still open (each with its button), whether the streak is safe, and
 * how tomorrow starts. A plain summary, never a guilt message.
 */

type Goal = { id: string; label: string; points: number; done: boolean; optional?: boolean; href: string }

export function isEvening(now = new Date()): boolean {
  try {
    if (new URLSearchParams(location.search).get('night') === '1') return true
  } catch {
    // No URL: go by the clock.
  }
  return now.getHours() >= 18
}

export function NightlyOverview({ crewId, role, call }: { crewId: string; role: string; call: { label: string; color: string } }) {
  const goals = D.todayTasks(crewId) as Goal[]
  const req = goals.filter((g) => !g.optional)
  const done = goals.filter((g) => g.done)
  const open = req.filter((g) => !g.done)
  const earned = done.reduce((a, g) => a + g.points, 0)
  const streak = (D.game(crewId) as { streak: number }).streak
  const checked = goals.find((g) => g.id === 'checkIn')?.done
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const first = planFor(role, D.scheduleStore(crewId).custom as CustomBlock[], tomorrow)[0] as { start: string; title: string } | undefined

  return (
    <section aria-labelledby="night-heading" className="night">
      <span className="night-stars" aria-hidden="true" />
      <div style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', gap: '6px 16px' }}>
        <div>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 750, letterSpacing: '.08em', textTransform: 'uppercase', color: '#f6c445' }}>Tonight's wrap-up</p>
          <h2 id="night-heading" style={{ margin: '4px 0 0', fontSize: 'clamp(22px, 2.6vw, 30px)', fontWeight: 750, letterSpacing: '-0.03em' }}>
            {open.length === 0 ? 'Every goal done. Rest well.' : `${req.length - open.length} of ${req.length} goals done today.`}
          </h2>
        </div>
        <span style={{ fontSize: 13.5, color: 'rgba(243,241,234,.75)' }}>
          Today's call: <strong style={{ color: call.color }}>{call.label}</strong>
        </span>
      </div>
      <div className="night-grid">
        <div>
          <p className="night-k">Done</p>
          {done.length ? (
            <ul className="night-list">
              {done.map((g) => (
                <li key={g.id}>
                  <span aria-hidden="true" style={{ color: '#7ef0c5' }}>✓</span> {g.label}
                </li>
              ))}
            </ul>
          ) : (
            <p className="night-p">Nothing yet today.</p>
          )}
          <p className="night-p">+{earned} coins earned for doing, not for the numbers.</p>
        </div>
        <div>
          <p className="night-k">Still open</p>
          {open.length ? (
            <ul className="night-list">
              {open.map((g) => (
                <li key={g.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span>{g.label}</span>
                  <button type="button" onClick={() => navigate(g.href)} className="night-btn">
                    Do it · +{g.points}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="night-p">Nothing. Tomorrow starts fresh.</p>
          )}
        </div>
        <div>
          <p className="night-k">Tomorrow</p>
          <p className="night-p" style={{ color: '#f3f1ea' }}>
            {checked ? <>Your {streak}-day streak is safe.</> : <>Do the mirror check before midnight to keep your {streak}-day streak.</>}
          </p>
          <p className="night-p">
            Start with the mirror check{first ? <>, then <strong style={{ color: '#f3f1ea' }}>{first.title}</strong> at {first.start}</> : ''}.
          </p>
        </div>
      </div>
    </section>
  )
}
