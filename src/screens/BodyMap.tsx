import { useEffect, useMemo, useState } from 'react'
import { BodyFigure } from '../components/BodyFigure'
import { IndicatorCard } from '../components/IndicatorCard'
import { STATUS_COLOR, StatusDot } from '../components/StatusDot'
import { h1, linkBtn, page } from '../components/ui'
import type { Measurement, Status } from '../contract/types'
import { listMeasurements } from '../db/repo'
import { readAll, regionStatus, worstStatus } from '../lib/bodyStatus'
import { getContent } from '../lib/content'
import { formatValue } from '../lib/format'
import { REGIONS, STATUS_LABEL, type RegionId } from '../lib/regions'
import { useApp } from '../state/AppContext'

const LEGEND: Status[] = ['green', 'yellow', 'red', 'gray']

export function BodyMap() {
  const { crewId, currentCrew, dataVersion, go } = useApp()
  const [measurements, setMeasurements] = useState<Measurement[] | null>(null)
  const [selected, setSelected] = useState<RegionId | null>(null)

  useEffect(() => {
    let cancelled = false
    void listMeasurements(crewId).then((rows) => !cancelled && setMeasurements(rows))
    return () => {
      cancelled = true
    }
  }, [crewId, dataVersion])

  const readings = useMemo(() => readAll(measurements ?? []), [measurements])
  const statuses = useMemo(
    () => Object.fromEntries(REGIONS.map((r) => [r.id, regionStatus(r, readings)])) as Record<RegionId, Status>,
    [readings],
  )
  const region = REGIONS.find((r) => r.id === selected)
  const worst = worstStatus(Object.values(statuses))

  // Never claim "not enough data" while data is still loading.
  if (measurements === null) return <main className={page}>
      <p className="text-muted">Loading readings…</p>
    </main>

  return (
    <main className={`${page} grid gap-10 md:grid-cols-[clamp(240px,26vw,300px)_1fr]`}>
      <section aria-labelledby="map-heading" className="md:sticky md:top-6 md:self-start">
        <p className="label">Body map</p>
        <h1 id="map-heading" className={`${h1} mt-1`}>
          {currentCrew?.name ?? 'Crew'}
        </h1>
        <p className="mt-1 text-sm text-muted">{currentCrew?.role}</p>
        <div className="mt-3 flex items-center gap-3 border-y border-rule py-2.5">
          <span className="label">Worst region</span>
          <StatusDot status={worst} size="md" />
        </div>

        <div className="mt-5 flex justify-center">
          <BodyFigure statuses={statuses} selected={selected} onSelect={setSelected} className="h-[clamp(300px,42vh,400px)] w-auto max-w-full" />
        </div>
        <p className="mt-3 text-sm text-muted">
          Select a region on the figure or in the list. Colors compare each reading with this person's own baseline, never a population
          average.
        </p>

        <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5">
          {LEGEND.map((s) => (
            <li key={s} className="flex items-center gap-2 text-xs text-muted">
              <span aria-hidden className="inline-block h-3 w-3" style={{ background: STATUS_COLOR[s], outline: '1px solid rgb(0 0 0 / 0.2)' }} />
              {STATUS_LABEL[s]}
            </li>
          ))}
        </ul>

        {(worst === 'yellow' || worst === 'red') && (
          <button onClick={() => go('escalation')} className={`${linkBtn} mt-3`}>
            Something is outside baseline — see the escalation ladder
          </button>
        )}
      </section>

      <section aria-label="Region details">
        {!region ? (
          <>
            <h2 className="label">All regions</h2>
            <ul className="mt-2 divide-y divide-rule border-y border-rule">
              {REGIONS.map((r) => {
                const withData = r.indicators.filter((i) => readings[i].latest).length
                return (
                  <li key={r.id}>
                    <button
                      onClick={() => setSelected(r.id)}
                      className="flex min-h-[56px] w-full items-center justify-between gap-4 px-1 py-3 text-left transition-colors hover:bg-panel"
                    >
                      <span>
                        <span className="font-medium">{r.label}</span>
                        <span className="ml-2 text-xs text-muted">
                          {withData} of {r.indicators.length} indicator(s) with a good reading
                        </span>
                      </span>
                      <StatusDot status={statuses[r.id]} />
                    </button>
                  </li>
                )
              })}
            </ul>
          </>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-ink pb-3">
              <div>
                <p className="label">Region</p>
                <h2 className={`${h1} mt-1`}>{region.label}</h2>
              </div>
              <button onClick={() => setSelected(null)} className={linkBtn}>
                All regions
              </button>
            </div>

            <ul className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
              {region.indicators.map((i) => {
                const r = readings[i]
                return (
                  <li key={i} className="flex items-baseline justify-between gap-3 border-b border-rule pb-1.5 text-sm">
                    <span>{getContent(i).label}</span>
                    <span className="text-right">
                      <span className="font-medium">{r.latest ? formatValue(r.latest) : '—'}</span>
                    </span>
                  </li>
                )
              })}
            </ul>

            {region.indicators.map((i) => (
              <IndicatorCard key={i} reading={readings[i]} />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
