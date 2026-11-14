import { useEffect, useMemo, useState } from 'react'
import { BodyFigure } from '../components/BodyFigure'
import { Avatar } from '../components/kit/Avatar'
import { Icon } from '../components/kit/Icon'
import { Counter } from '../components/kit/Readout'
import { StatusDot } from '../components/StatusDot'
import type { CrewMember, Measurement, Status } from '../contract/types'
import { listMeasurements } from '../db/repo'
import { readAll, regionStatus, worstStatus } from '../lib/bodyStatus'
import { REGIONS, STATUS_LABEL, type RegionId } from '../lib/regions'
import { useApp } from '../state/AppContext'

type CrewView = {
  crew: CrewMember
  statuses: Record<RegionId, Status>
  worst: Status
  /** Regions that are not green and not gray, worst first: what the officer reads first. */
  flagged: { id: RegionId; label: string; status: Status }[]
  indicatorsWithData: number
  indicatorsTotal: number
}

const SEVERITY: Record<Status, number> = { red: 0, yellow: 1, gray: 2, green: 3 }

function build(crew: CrewMember, measurements: Measurement[]): CrewView {
  const readings = readAll(measurements)
  const statuses = Object.fromEntries(REGIONS.map((r) => [r.id, regionStatus(r, readings)])) as Record<RegionId, Status>
  const flagged = REGIONS.map((r) => ({ id: r.id, label: r.label, status: statuses[r.id] }))
    .filter((r) => r.status === 'yellow' || r.status === 'red')
    .sort((a, b) => SEVERITY[a.status] - SEVERITY[b.status])
  const indicators = REGIONS.flatMap((r) => r.indicators)
  return {
    crew,
    statuses,
    worst: worstStatus(Object.values(statuses)),
    flagged,
    indicatorsWithData: indicators.filter((i) => readings[i].latest).length,
    indicatorsTotal: indicators.length,
  }
}

export function Medical() {
  const { crew, crewId, setCrewId, go, dataVersion } = useApp()
  const [rows, setRows] = useState<Record<string, Measurement[]> | null>(null)

  useEffect(() => {
    let cancelled = false
    void Promise.all(crew.map(async (c) => [c.id, await listMeasurements(c.id)] as const)).then((pairs) => {
      if (!cancelled) setRows(Object.fromEntries(pairs))
    })
    return () => {
      cancelled = true
    }
  }, [crew, dataVersion])

  // Worst first: the officer should not have to scan for the person who needs attention.
  const views = useMemo(
    () => (rows === null ? null : crew.map((c) => build(c, rows[c.id] ?? [])).sort((a, b) => SEVERITY[a.worst] - SEVERITY[b.worst])),
    [rows, crew],
  )

  const needAttention = views?.filter((v) => v.flagged.length > 0).length ?? 0

  const open = (id: string) => {
    setCrewId(id)
    go('bodymap')
  }

  return (
    <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 border-b border-rule pb-5">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Everyone, at once</h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">
            Every crew member&rsquo;s body map on one screen, the people with something outside their own baseline first. Select anyone to
            open their full console. Gray is never a verdict: it means no reading has passed the quality check yet.
          </p>
        </div>

        {views && (
          <dl className="flex flex-wrap items-end gap-x-8 gap-y-3">
            <div>
              <dt className="label">Crew</dt>
              <dd className="value mt-1" style={{ fontSize: '1.75rem' }}>
                <Counter value={views.length} />
              </dd>
            </div>
            <div>
              <dt className="label">Outside baseline</dt>
              <dd
                className="value mt-1"
                style={{ fontSize: '1.75rem', color: needAttention > 0 ? 'var(--color-watch-ink)' : 'var(--color-ok-ink)' }}
              >
                <Counter value={needAttention} />
                <span className="value-unit"> of {views.length}</span>
              </dd>
            </div>
          </dl>
        )}
      </div>

      {/* Never say "not enough data" while the data is still loading. */}
      {views === null ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="card h-80 animate-pulse" />
          ))}
        </div>
      ) : (
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {views.map((v, i) => (
            <li key={v.crew.id} className="animate-rise" style={{ animationDelay: `${i * 70}ms` }}>
              <button
                onClick={() => open(v.crew.id)}
                aria-current={v.crew.id === crewId ? 'true' : undefined}
                className={`card card-action bracketed flex h-full flex-col p-5 ${v.crew.id === crewId ? 'border-accent' : ''}`}
                style={v.crew.id === crewId ? { boxShadow: 'var(--glow)' } : undefined}
              >
                <div className="flex items-start gap-3">
                  <Avatar crew={v.crew} size={54} status={v.worst} badge />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold tracking-tight">{v.crew.name}</p>
                    <p className="truncate text-sm text-muted">{v.crew.role}</p>
                  </div>
                  {v.crew.id === crewId && <span className="label shrink-0">selected</span>}
                </div>

                <div className="mt-4 flex justify-center">
                  <BodyFigure
                    statuses={v.statuses}
                    selected={null}
                    onSelect={() => {}}
                    interactive={false}
                    markers
                    className="h-[180px] w-auto max-w-full"
                  />
                </div>

                <div className="mt-4 border-t border-rule pt-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="label">Worst region</span>
                    <StatusDot status={v.worst} short />
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {v.flagged.length === 0
                      ? 'No region outside baseline.'
                      : v.flagged.map((f) => `${f.label}: ${STATUS_LABEL[f.status].toLowerCase()}`).join(' · ')}
                  </p>
                  <div className="meter mt-3">
                    <span style={{ width: `${(v.indicatorsWithData / v.indicatorsTotal) * 100}%` }} />
                  </div>
                  <p className="mt-1.5 flex items-center justify-between text-sm text-muted">
                    <span>
                      {v.indicatorsWithData}/{v.indicatorsTotal} measured
                    </span>
                    <span className="inline-flex items-center gap-1">
                      open <Icon name="arrowRight" size={12} />
                    </span>
                  </p>
                  <p className="mt-2 text-sm text-muted">{v.crew.dataLabel}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
