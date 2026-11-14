import { useEffect, useMemo, useState } from 'react'
import { BodyFigure } from '../components/BodyFigure'
import { StatusDot } from '../components/StatusDot'
import { h1, page } from '../components/ui'
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

  const open = (id: string) => {
    setCrewId(id)
    go('bodymap')
  }

  return (
    <main className={page}>
      <p className="label">Medical officer view</p>
      <h1 className={`${h1} mt-1`}>Everyone, at once</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
        Every crew member&rsquo;s body map on one screen, the people with something outside their own baseline first. Select anyone to open
        their full body map. Gray is never a verdict: it means no reading has passed the quality check yet.
      </p>

      {/* Never say "not enough data" while the data is still loading. */}
      {views === null ? (
        <p className="mt-8 text-muted">Loading every crew member&rsquo;s readings…</p>
      ) : (
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {views.map((v) => (
            <li key={v.crew.id}>
              <button
                onClick={() => open(v.crew.id)}
                aria-current={v.crew.id === crewId ? 'true' : undefined}
                className={`card card-action h-full p-5 ${v.crew.id === crewId ? 'border-ink' : ''}`}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-base font-semibold tracking-tight">{v.crew.name}</span>
                  {v.crew.id === crewId && <span className="label">selected</span>}
                </div>
                <p className="mt-0.5 text-xs text-muted">{v.crew.role}</p>

                <div className="mt-4 flex justify-center">
                  <BodyFigure
                    statuses={v.statuses}
                    selected={null}
                    onSelect={() => {}}
                    interactive={false}
                    className="h-[190px] w-auto max-w-full"
                  />
                </div>

                <div className="mt-4 border-t border-rule pt-3">
                  <span className="label">Worst region</span>
                  <div className="mt-1">
                    <StatusDot status={v.worst} size="md" />
                  </div>
                  <p className="mt-2 text-xs text-muted">
                    {v.flagged.length === 0
                      ? 'No region outside baseline.'
                      : v.flagged.map((f) => `${f.label}: ${STATUS_LABEL[f.status].toLowerCase()}`).join(' · ')}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {v.indicatorsWithData} of {v.indicatorsTotal} indicators have a good reading
                  </p>
                  <p className="mt-2 text-xs text-muted">{v.crew.dataLabel}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
