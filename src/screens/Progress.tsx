import { useEffect, useMemo, useState } from 'react'
import { CrewGoal } from '../components/CrewGoal'
import type { GameEvent, Measurement } from '../contract/types'
import { addEvent, listEvents, listMeasurements } from '../db/repo'
import { readAll } from '../lib/bodyStatus'
import { dailyPlan, type PlanItem, type PlanScreen } from '../lib/plan'
import { EVENT_LABEL, POINTS, creditedEvents, crewProgress, systemsStatus } from '../lib/scoring'
import { checkInDays, currentStreak } from '../lib/streak'
import { useApp } from '../state/AppContext'

const RECENT = 8

const buttonClass = 'border border-ink px-3 py-1.5 text-sm font-medium hover:bg-ink hover:text-paper'

function PlanRow({ item, go, onConfirm }: { item: PlanItem; go: (screen: PlanScreen) => void; onConfirm: (item: PlanItem) => void }) {
  const action = item.action
  return (
    <li className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2 py-3">
      <div className="min-w-0 max-w-xl">
        <p className="font-medium">
          {item.title} <span className="ml-1 text-xs font-normal text-muted">+{item.points}</span>
        </p>
        {item.why && <p className="mt-0.5 text-sm">{item.why}</p>}
        <p className="mt-0.5 text-sm text-muted">{item.guidance}</p>
      </div>
      <div className="flex items-center gap-3 text-sm">
        {item.done ? (
          <span className="font-medium text-ok-ink">Done today</span>
        ) : action.type === 'go' ? (
          <button onClick={() => go(action.screen)} className={buttonClass}>
            Open
          </button>
        ) : (
          <>
            {action.link && (
              <button onClick={() => go(action.link as PlanScreen)} className="text-accent underline underline-offset-4 hover:text-ink">
                Escalation
              </button>
            )}
            <button onClick={() => onConfirm(item)} className={buttonClass}>
              I did this
            </button>
          </>
        )}
      </div>
    </li>
  )
}

export function Progress() {
  const { crew, crewId, currentCrew, dataVersion, go, refresh } = useApp()
  const [events, setEvents] = useState<GameEvent[] | null>(null)
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  // "Now" is refreshed with every data load. Frozen at mount, anything done afterwards fell outside the week window.
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    let cancelled = false
    void Promise.all(crew.map((c) => listEvents(c.id))).then((rows) => {
      if (cancelled) return
      setNow(new Date())
      setEvents(rows.flat())
    })
    void listMeasurements(crewId).then((rows) => !cancelled && setMeasurements(rows))
    return () => {
      cancelled = true
    }
  }, [crew, crewId, dataVersion])

  const view = useMemo(() => {
    if (!events) return null
    const mine = creditedEvents(events).filter((e) => e.crewId === crewId).sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    const progress = crewProgress(events, now, crew.length)
    return {
      progress,
      recent: mine.slice(0, RECENT),
      streak: currentStreak(checkInDays(events, crewId), now.toISOString().slice(0, 10)),
      systems: systemsStatus(progress.totalPoints),
      plan: dailyPlan({ crewId, readings: readAll(measurements), events, measurements, now }),
    }
  }, [events, measurements, crewId, crew.length, now])

  async function confirm(item: PlanItem) {
    await addEvent({ id: crypto.randomUUID(), crewId, timestamp: new Date().toISOString(), kind: item.kind, ...(item.detail ? { detail: item.detail } : {}) })
    refresh()
  }

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

      <section aria-labelledby="plan-heading" className="space-y-3">
        <h2 id="plan-heading" className="text-sm font-semibold uppercase tracking-[0.14em] text-muted">
          Today's plan for {currentCrew?.name ?? 'you'}
        </h2>
        <p className="max-w-2xl text-sm text-muted">
          Built from your own readings. Steps appear when something is off <em>your</em> usual, and you earn credit for doing them, never for any number. Each step counts once a day.
        </p>
        <ul className="divide-y divide-rule border-y border-rule">
          {view.plan.map((p) => (
            <PlanRow key={p.id} item={p} go={go} onConfirm={(i) => void confirm(i)} />
          ))}
        </ul>
      </section>

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
                <span className={s.online ? 'font-medium text-ok-ink' : 'text-muted'}>
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
