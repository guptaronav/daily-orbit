import { useEffect, useState } from 'react'
import type { GameEvent } from '../../contract/types'
import { listEvents } from '../../db/repo'
import { coinsFor, levelFor } from '../../lib/levels'
import { WEEKLY_GOAL_PER_CREW, pointsInWindow } from '../../lib/scoring'
import { checkInDays, currentStreak } from '../../lib/streak'
import { useApp, type Screen } from '../../state/AppContext'
import { Avatar } from './Avatar'
import { Icon, type IconName } from './Icon'
import { FlameIcon } from './Wallet'

type Quick = { screen: Screen; label: string; icon: IconName }

const QUICK: Quick[] = [
  { screen: 'mirror', label: 'Mirror check', icon: 'eye' },
  { screen: 'manual', label: 'Log a reading', icon: 'plus' },
  { screen: 'escalation', label: 'Escalation', icon: 'send' },
  { screen: 'medical', label: 'Whole crew', icon: 'heart' },
]

type Row = { id: string; streak: number; done: boolean; level: number }

/**
 * The crew dock: who is aboard, how each of them is doing on their streak, what you can start in
 * one tap, and how the crew is tracking against the weekly goal.
 *
 * It shows EFFORT only — streaks, coins, whether today's check is done. No health value appears
 * here, so nobody can read a crewmate's condition off the dock, which is the whole reason the
 * scoring works this way.
 */
export function CrewDock() {
  const { crew, crewId, setCrewId, go, dataVersion, screen } = useApp()
  const [rows, setRows] = useState<Row[] | null>(null)
  const [crewPoints, setCrewPoints] = useState(0)
  const [open, setOpen] = useState(true)

  useEffect(() => {
    let cancelled = false
    void Promise.all(crew.map((c) => listEvents(c.id))).then((all: GameEvent[][]) => {
      if (cancelled) return
      const today = new Date()
      const day = today.toISOString().slice(0, 10)
      setRows(
        crew.map((c, i) => ({
          id: c.id,
          streak: currentStreak(checkInDays(all[i], c.id), day),
          done: all[i].some((e) => e.timestamp.slice(0, 10) === day),
          level: levelFor(coinsFor(all[i])).level,
        })),
      )
      setCrewPoints(all.reduce((sum, events) => sum + pointsInWindow(events, today, 7), 0))
    })
    return () => {
      cancelled = true
    }
  }, [crew, dataVersion])

  if (!rows) return null

  const goal = WEEKLY_GOAL_PER_CREW * Math.max(1, crew.length)
  const goalPct = Math.min(100, Math.round((crewPoints / goal) * 100))
  const me = rows.find((r) => r.id === crewId)

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 px-2.5 pb-3 sm:px-6">
      <div className="floating pointer-events-auto mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-4 gap-y-3 p-2.5">
        {open && (
          <>
            <ul className="no-bar flex max-w-full items-end gap-2 overflow-x-auto">
              {crew.map((c) => {
                const row = rows.find((r) => r.id === c.id)
                const active = c.id === crewId
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => setCrewId(c.id)}
                      aria-pressed={active}
                      title={`${c.name}: ${row?.streak ?? 0} day streak`}
                      className="flex flex-col items-center gap-1 rounded-2xl px-1 py-1 transition-transform hover:-translate-y-0.5"
                    >
                      <Avatar crew={c} size={44} ring={active ? 'var(--color-ink)' : undefined} level={row?.level} />
                      <span className="flex items-center gap-1 text-sm font-semibold text-muted">
                        <FlameIcon size={12} />
                        {row?.streak ?? 0}
                      </span>
                      <span className="sr-only">{c.name}</span>
                    </button>
                  </li>
                )
              })}
            </ul>

            <button
              onClick={() => go('mirror')}
              className="flex min-h-[52px] items-center gap-3 rounded-full px-4 text-left"
              style={{ background: 'var(--color-ink)', color: 'var(--color-paper)' }}
            >
              <span aria-hidden className="grid h-8 w-8 place-items-center rounded-full" style={{ background: 'rgb(243 241 234 / 0.14)' }}>
                <Icon name={me?.done ? 'check' : 'eye'} size={17} />
              </span>
              <span>
                <span className="block text-[0.9375rem] font-bold leading-tight">{me?.done ? 'All done today' : "Start today's check"}</span>
                <span className="block text-sm opacity-70">{me?.done ? 'Come back tomorrow' : 'About thirty seconds'}</span>
              </span>
            </button>

            <div className="flex items-center gap-1">
              {QUICK.map((q) => (
                <button
                  key={q.screen}
                  onClick={() => go(q.screen)}
                  aria-label={q.label}
                  title={q.label}
                  aria-current={screen === q.screen ? 'page' : undefined}
                  className="btn btn-ghost btn-icon"
                  style={screen === q.screen ? { background: 'var(--color-accent-wash)', color: 'var(--color-accent)' } : undefined}
                >
                  <Icon name={q.icon} size={19} />
                </button>
              ))}
            </div>

            <div className="ml-auto flex min-w-[9rem] flex-col gap-1">
              <div className="flex items-baseline justify-between gap-3">
                <span className="label">Crew goal</span>
                <span className="font-bold">{goalPct}%</span>
              </div>
              <div className="meter">
                <span style={{ width: `${goalPct}%` }} />
              </div>
            </div>
          </>
        )}

        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={open ? 'Hide the crew dock' : 'Show the crew dock'}
          className="btn btn-ghost btn-icon ml-auto"
        >
          <Icon name="arrowRight" size={18} className={open ? 'rotate-90' : '-rotate-90'} />
        </button>
      </div>
    </div>
  )
}
