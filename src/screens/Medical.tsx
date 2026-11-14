import { useEffect, useMemo, useState } from 'react'
import { Avatar } from '../components/kit/Avatar'
import { Icon } from '../components/kit/Icon'
import { Gauge } from '../components/kit/Readout'
import { CoinIcon, FlameIcon } from '../components/kit/Wallet'
import { StatusDot, STATUS_TEXT, STATUS_WASH } from '../components/StatusDot'
import type { CrewMember, GameEvent, Measurement, Status } from '../contract/types'
import { listEvents, listMeasurements } from '../db/repo'
import { readAll, regionStatus, worstStatus } from '../lib/bodyStatus'
import { coinsFor, levelFor } from '../lib/levels'
import { REGIONS, STATUS_LABEL, type RegionId } from '../lib/regions'
import { SYSTEMS, WEEKLY_GOAL_PER_CREW, pointsInWindow, systemsStatus } from '../lib/scoring'
import { checkInDays, currentStreak } from '../lib/streak'
import { useApp } from '../state/AppContext'

type CrewView = {
  crew: CrewMember
  statuses: Record<RegionId, Status>
  worst: Status
  flagged: { id: RegionId; label: string; status: Status }[]
  measured: number
  total: number
  streak: number
  coins: number
  rank: string
  level: number
}

const SEVERITY: Record<Status, number> = { red: 0, yellow: 1, gray: 2, green: 3 }

type Filter = 'all' | 'attention'

function build(crew: CrewMember, measurements: Measurement[], events: GameEvent[], today: string): CrewView {
  const readings = readAll(measurements)
  const statuses = Object.fromEntries(REGIONS.map((r) => [r.id, regionStatus(r, readings)])) as Record<RegionId, Status>
  const flagged = REGIONS.map((r) => ({ id: r.id, label: r.label, status: statuses[r.id] }))
    .filter((r) => r.status === 'yellow' || r.status === 'red')
    .sort((a, b) => SEVERITY[a.status] - SEVERITY[b.status])
  const indicators = REGIONS.flatMap((r) => r.indicators)
  const coins = coinsFor(events)
  const level = levelFor(coins)
  return {
    crew,
    statuses,
    worst: worstStatus(Object.values(statuses)),
    flagged,
    measured: indicators.filter((i) => readings[i].latest).length,
    total: indicators.length,
    streak: currentStreak(checkInDays(events, crew.id), today),
    coins,
    rank: `Level ${level.level} · ${level.title}`,
    level: level.level,
  }
}

export function Medical() {
  const { crew, crewId, setCrewId, go, dataVersion } = useApp()
  const [views, setViews] = useState<CrewView[] | null>(null)
  const [crewPoints, setCrewPoints] = useState(0)
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    let cancelled = false
    void Promise.all(
      crew.map(async (c) => ({ c, m: await listMeasurements(c.id), e: await listEvents(c.id) })),
    ).then((rows) => {
      if (cancelled) return
      const now = new Date()
      const today = now.toISOString().slice(0, 10)
      // Worst first: the officer should not have to scan for the person who needs attention.
      setViews(rows.map((r) => build(r.c, r.m, r.e, today)).sort((a, b) => SEVERITY[a.worst] - SEVERITY[b.worst]))
      setCrewPoints(rows.reduce((sum, r) => sum + pointsInWindow(r.e, now, 7), 0))
    })
    return () => {
      cancelled = true
    }
  }, [crew, dataVersion])

  const needAttention = views?.filter((v) => v.flagged.length > 0).length ?? 0
  const shown = useMemo(
    () => (views === null ? null : filter === 'attention' ? views.filter((v) => v.flagged.length > 0) : views),
    [views, filter],
  )

  const goal = WEEKLY_GOAL_PER_CREW * Math.max(1, crew.length)
  const goalPct = Math.min(1, crewPoints / goal)
  const online = systemsStatus(crewPoints).filter((s) => s.online).length

  return (
    <main className="mx-auto w-full max-w-[1440px] px-4 pb-10 pt-8 sm:px-8">
      <p className="label">Crew lobby · medical officer view</p>
      <h1 className="display mt-2 text-4xl sm:text-5xl">Everyone, at once.</h1>
      <p className="mt-4 max-w-3xl text-lg leading-relaxed text-ink-soft">
        The people with something outside their own baseline come first. Gray is never a verdict: it means no reading has passed the quality
        check yet. Pick anyone to open their console.
      </p>

      <div className="mt-7 grid gap-5 lg:grid-cols-[1fr_auto]">
        <div className="flex flex-wrap items-center gap-3">
          <div className="track">
            {(
              [
                { id: 'all' as Filter, label: `All ${views?.length ?? ''}`.trim() },
                { id: 'attention' as Filter, label: `Outside baseline ${needAttention}` },
              ]
            ).map((f) => (
              <button key={f.id} onClick={() => setFilter(f.id)} aria-pressed={filter === f.id} className="track-item">
                {f.label}
              </button>
            ))}
          </div>
          <p className="text-[0.9375rem] text-muted">
            {views?.length ?? 0} crew · {needAttention} outside baseline
          </p>
        </div>

        <div className="card flex items-center gap-5 p-5">
          <Gauge value={goalPct} label="" caption="" size={104} status={goalPct > 0.66 ? 'green' : goalPct > 0.33 ? 'yellow' : 'gray'} />
          <div>
            <p className="font-bold">Crew weekly goal</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-[0.9375rem] text-muted">
              <CoinIcon size={14} />
              {crewPoints} / {goal}
            </p>
            <p className="mt-1 text-sm text-muted">
              {online} of {SYSTEMS.length} ship systems online
            </p>
          </div>
        </div>
      </div>

      {shown === null ? (
        <div className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="card h-80 animate-pulse" />
          ))}
        </div>
      ) : shown.length === 0 ? (
        <div className="card mt-7 p-10 text-center">
          <p className="text-2xl font-bold tracking-tight">Nobody is outside baseline</p>
          <p className="mt-2 text-lg text-muted">Every crew member with good data is inside their own normal.</p>
        </div>
      ) : (
        <ul className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {shown.map((v, i) => (
            <li key={v.crew.id} className="animate-rise" style={{ animationDelay: `${i * 70}ms` }}>
              <button
                onClick={() => {
                  setCrewId(v.crew.id)
                  go('bodymap')
                }}
                data-selected={v.crew.id === crewId ? 'true' : undefined}
                className="card card-action flex h-full flex-col p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <Avatar crew={v.crew} size={56} status={v.worst} />
                  <span className="flex flex-col items-end gap-1.5">
                    <StatusDot status={v.worst} short />
                    <span className="flex items-center gap-3 text-sm font-semibold text-muted">
                      <span className="flex items-center gap-1">
                        <FlameIcon size={13} />
                        {v.streak}
                      </span>
                      <span className="flex items-center gap-1">
                        <CoinIcon size={13} />
                        {v.coins}
                      </span>
                    </span>
                  </span>
                </div>

                <p className="mt-4 text-xl font-bold tracking-tight">{v.crew.name}</p>
                <p className="text-sm text-muted">
                  {v.rank} · {v.crew.role}
                </p>

                <ul className="mt-4 flex-1 space-y-1.5">
                  {(v.flagged.length > 0 ? v.flagged : REGIONS.slice(0, 3).map((r) => ({ id: r.id, label: r.label, status: v.statuses[r.id] }))).map(
                    (r) => (
                      <li key={r.id} className="flex items-center justify-between gap-2 text-[0.9375rem]">
                        <span>{r.label}</span>
                        <span
                          className="pill"
                          style={{ background: STATUS_WASH[r.status], color: STATUS_TEXT[r.status], fontSize: '0.75rem' }}
                        >
                          {STATUS_LABEL[r.status]}
                        </span>
                      </li>
                    ),
                  )}
                </ul>

                <div className="mt-4 border-t border-rule pt-3">
                  <div className="meter">
                    <span style={{ width: `${(v.measured / v.total) * 100}%` }} />
                  </div>
                  <p className="mt-2 flex items-center justify-between text-sm text-muted">
                    <span>
                      Measured {v.measured}/{v.total}
                    </span>
                    <span className="flex items-center gap-1 font-semibold" style={{ color: 'var(--color-accent)' }}>
                      Open console
                      <Icon name="arrowRight" size={13} />
                    </span>
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
