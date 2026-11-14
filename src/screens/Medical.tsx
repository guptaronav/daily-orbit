import { useEffect, useMemo, useState } from 'react'
import { Avatar } from '../components/kit/Avatar'
import { Icon } from '../components/kit/Icon'
import { CoinIcon, FlameIcon } from '../components/kit/Wallet'
import { STATUS_COLOR, STATUS_TEXT, STATUS_WASH } from '../components/StatusDot'
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
    rank: `Lv ${level.level} · ${level.title}`,
    level: level.level,
  }
}

export function Medical() {
  const { crew, setCrewId, go, dataVersion } = useApp()
  const [views, setViews] = useState<CrewView[] | null>(null)
  const [crewPoints, setCrewPoints] = useState(0)
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    let cancelled = false
    void Promise.all(crew.map(async (c) => ({ c, m: await listMeasurements(c.id), e: await listEvents(c.id) }))).then((rows) => {
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
  const goalPct = Math.round(Math.min(1, crewPoints / goal) * 100)
  const online = systemsStatus(crewPoints).filter((s) => s.online).length

  const FILTERS: { id: Filter; label: string }[] = [
    { id: 'all', label: `All ${views?.length ?? ''}`.trim() },
    { id: 'attention', label: `Outside baseline ${needAttention}` },
  ]

  return (
    <main
      className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 pb-[72px] pt-7"
      style={{ paddingLeft: 'clamp(16px, 3vw, 32px)', paddingRight: 'clamp(16px, 3vw, 32px)' }}
    >
      <div className="flex flex-wrap items-stretch gap-5">
        <div className="flex flex-col justify-center gap-3.5 py-2" style={{ flex: '2 1 520px' }}>
          <p className="m-0 text-sm text-muted">Crew lobby · medical officer view</p>
          <h1 className="m-0" style={{ fontSize: 'clamp(40px, 6vw, 76px)', lineHeight: 0.92, fontWeight: 750, letterSpacing: '-0.05em' }}>
            Everyone,
            <br />
            at once.
          </h1>
          <p className="m-0 text-ink-soft" style={{ fontSize: 16, lineHeight: 1.55 }}>
            The people with something outside their own baseline come first. Gray is never a verdict: it means no reading has passed the
            quality check yet. Pick anyone to open their console.
          </p>

          <div className="inline-flex w-fit gap-1 p-1" style={{ borderRadius: 999, background: 'var(--color-paper-deep)' }}>
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                aria-pressed={filter === f.id}
                className="px-4 transition-colors"
                style={{
                  minHeight: 42,
                  borderRadius: 999,
                  fontSize: 14,
                  fontWeight: 600,
                  background: filter === f.id ? 'var(--color-panel)' : 'transparent',
                  color: filter === f.id ? 'var(--color-ink)' : 'var(--color-muted)',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <section
          className="flex items-center gap-5 p-6"
          style={{ flex: '1 1 320px', borderRadius: 28, background: '#14181f', color: '#f3f1ea' }}
        >
          <span
            className="grid shrink-0 place-items-center rounded-full"
            style={{ width: 86, height: 86, background: `conic-gradient(${goalPct > 66 ? '#2fd39b' : '#f6c445'} ${goalPct * 3.6}deg, rgb(243 241 234 / 0.12) 0)` }}
          >
            <span className="grid place-items-center rounded-full" style={{ width: 68, height: 68, background: '#14181f' }}>
              <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em' }}>{goalPct}%</span>
            </span>
          </span>

          <div className="min-w-0">
            <p className="m-0 opacity-70" style={{ fontSize: 13.5 }}>
              Crew weekly goal
            </p>
            <p className="m-0 mt-0.5 flex items-baseline gap-1.5" style={{ fontSize: 26, fontWeight: 750, letterSpacing: '-0.03em' }}>
              <CoinIcon size={18} />
              {crewPoints}
              <span style={{ fontSize: 15, fontWeight: 500, opacity: 0.7 }}>/ {goal}</span>
            </p>
            <p className="m-0 mt-1.5 opacity-70" style={{ fontSize: 13.5, lineHeight: 1.45 }}>
              {online} of {SYSTEMS.length} ship systems online
            </p>
            <p className="m-0 mt-1.5 opacity-70" style={{ fontSize: 13.5 }}>
              <span style={{ fontWeight: 750 }}>{views?.length ?? 0}</span> crew ·{' '}
              <span style={{ fontWeight: 750 }}>{needAttention}</span> outside baseline
            </p>
          </div>
        </section>
      </div>

      {shown === null ? (
        <ul className="m-0 grid list-none gap-4 p-0" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))' }}>
          {[0, 1, 2, 3].map((i) => (
            <li key={i} className="h-80 animate-pulse border border-rule bg-panel" style={{ borderRadius: 28 }} />
          ))}
        </ul>
      ) : shown.length === 0 ? (
        <div className="border border-rule bg-panel p-10 text-center" style={{ borderRadius: 28 }}>
          <p className="m-0" style={{ fontSize: 26, fontWeight: 750, letterSpacing: '-0.03em' }}>
            Nobody is outside baseline
          </p>
          <p className="m-0 mt-2 text-lg text-muted">Every crew member with good data is inside their own normal.</p>
        </div>
      ) : (
        <ul className="m-0 grid list-none gap-4 p-0" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))' }}>
          {shown.map((v, i) => (
            <li key={v.crew.id} className="animate-rise" style={{ animationDelay: `${i * 70}ms` }}>
              <article className="card-action flex h-full flex-col overflow-hidden border border-rule bg-panel" style={{ borderRadius: 28 }}>
                {/* The banner carries the status color; the word under it carries the meaning. */}
                <div style={{ height: 8, background: STATUS_COLOR[v.worst] }} />

                <button
                  onClick={() => {
                    setCrewId(v.crew.id)
                    go('bodymap')
                  }}
                  className="flex flex-1 flex-col p-5 text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <Avatar crew={v.crew} size={56} level={v.level} />
                    <span className="flex flex-col items-end gap-2">
                      <span className="pill" style={{ background: STATUS_WASH[v.worst], color: STATUS_TEXT[v.worst] }}>
                        {STATUS_LABEL[v.worst]}
                      </span>
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

                  <p className="m-0 mt-4" style={{ fontSize: 22, fontWeight: 750, letterSpacing: '-0.025em' }}>
                    {v.crew.name}
                  </p>
                  <p className="m-0 text-sm text-muted">
                    {v.rank} · {v.crew.role}
                  </p>

                  <ul className="m-0 mt-4 flex flex-1 list-none flex-col gap-1.5 p-0">
                    {(v.flagged.length > 0
                      ? v.flagged
                      : REGIONS.slice(0, 3).map((r) => ({ id: r.id, label: r.label, status: v.statuses[r.id] }))
                    ).map((r) => (
                      <li key={r.id} className="flex items-center justify-between gap-2 text-[15px]">
                        <span>{r.label}</span>
                        <span className="pill" style={{ background: STATUS_WASH[r.status], color: STATUS_TEXT[r.status], fontSize: 12 }}>
                          {STATUS_LABEL[r.status]}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 border-t border-rule pt-3">
                    <div className="meter">
                      <span style={{ width: `${(v.measured / v.total) * 100}%`, background: 'var(--color-ink)' }} />
                    </div>
                    <p className="m-0 mt-2 flex items-center justify-between text-sm text-muted">
                      <span>
                        Measured {v.measured}/{v.total}
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-ink">
                        Open console
                        <Icon name="arrowRight" size={13} />
                      </span>
                    </p>
                  </div>
                </button>
              </article>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
