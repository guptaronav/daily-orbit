import { useEffect, useMemo, useState } from 'react'
import { CrewGoal } from '../components/CrewGoal'
import type { GameEvent } from '../contract/types'
import { listEvents } from '../db/repo'
import { EVENT_LABEL, POINTS, crewProgress, systemsStatus } from '../lib/scoring'
import { checkInDays, currentStreak } from '../lib/streak'
import { useApp } from '../state/AppContext'

const RECENT = 8

export function Progress() {
  const { crew, crewId, currentCrew, dataVersion } = useApp()
  const [events, setEvents] = useState<GameEvent[] | null>(null)
  const [now] = useState(() => new Date())

  useEffect(() => {
    let cancelled = false
    void Promise.all(crew.map((c) => listEvents(c.id))).then((rows) => !cancelled && setEvents(rows.flat()))
    return () => {
      cancelled = true
    }
  }, [crew, dataVersion])

  const view = useMemo(() => {
    if (!events) return null
    const mine = events.filter((e) => e.crewId === crewId).sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    const progress = crewProgress(events, now, crew.length)
    return {
      progress,
      recent: mine.slice(0, RECENT),
      streak: currentStreak(checkInDays(events, crewId), now.toISOString().slice(0, 10)),
      systems: systemsStatus(progress.totalPoints),
    }
  }, [events, crewId, crew.length, now])

  if (!view) return <main className="p-8 text-muted">Loading progress…</main>

  return (
    <main className="mx-auto w-full max-w-4xl space-y-8 px-4 py-8 sm:px-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Crew progress</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Points reward what you <em>do</em>: checking in (even on a bad day), reporting symptoms early, exercising, and retaking a reading we could not trust. They never depend on
          your health numbers, and nobody is ranked against anyone else.
        </p>
      </header>

      <CrewGoal progress={view.progress} />

      <div className="grid gap-8 md:grid-cols-2">
        <section aria-labelledby="credit-heading">
          <h2 id="credit-heading" className="text-sm font-semibold uppercase tracking-[0.14em] text-muted">
            {currentCrew?.name ?? 'Your'} recent credit
          </h2>
          <p className="mt-2 text-sm">
            Streak: <strong>{view.streak}</strong> {view.streak === 1 ? 'day' : 'days'}
            <span className="text-muted"> (one missed day a week is forgiven)</span>
          </p>
          {view.recent.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No credit yet. Take a mirror check to earn your first points.</p>
          ) : (
            <ul className="mt-3 divide-y divide-rule border-y border-rule text-sm">
              {view.recent.map((e) => (
                <li key={e.id} className="flex items-baseline justify-between gap-4 py-2">
                  <span>
                    {EVENT_LABEL[e.kind]}
                    <span className="ml-2 text-xs text-muted">{new Date(e.timestamp).toLocaleDateString()}</span>
                  </span>
                  <span className="font-medium">+{POINTS[e.kind]}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="systems-heading">
          <h2 id="systems-heading" className="text-sm font-semibold uppercase tracking-[0.14em] text-muted">
            Ship systems
          </h2>
          <p className="mt-2 text-sm text-muted">Systems come online as the crew's total points grow.</p>
          <ul className="mt-3 divide-y divide-rule border-y border-rule text-sm">
            {view.systems.map((s) => (
              <li key={s.id} className="flex items-baseline justify-between gap-4 py-2">
                <span>{s.name}</span>
                <span className={s.online ? 'font-medium text-ok' : 'text-muted'}>
                  {s.online ? 'Online' : `Offline, needs ${s.threshold - view.progress.totalPoints} more points`}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  )
}
