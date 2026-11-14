import { useEffect, useMemo, useState } from 'react'
import { BodyFigure } from '../components/BodyFigure'
import { IndicatorCard } from '../components/IndicatorCard'
import { STATUS_COLOR, StatusDot } from '../components/StatusDot'
import type { Measurement, Status } from '../contract/types'
import { listMeasurements } from '../db/repo'
import { readAll, regionStatus } from '../lib/bodyStatus'
import { getContent } from '../lib/content'
import { formatValue } from '../lib/format'
import { REGIONS, STATUS_LABEL, type RegionId } from '../lib/regions'
import { useApp } from '../state/AppContext'

const LEGEND: Status[] = ['green', 'yellow', 'red', 'gray']

export function BodyMap() {
  const { crewId, currentCrew, dataVersion } = useApp()
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

  // Never claim "not enough data" while data is still loading.
  if (measurements === null) return <main className="p-8 text-muted">Loading readings…</main>

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 sm:px-8 md:grid-cols-[280px_1fr]">
      <section aria-labelledby="map-heading" className="md:sticky md:top-6 md:self-start">
        <h1 id="map-heading" className="text-2xl font-semibold tracking-tight">
          {currentCrew?.name ?? 'Crew'}
        </h1>
        <p className="mb-4 text-sm text-muted">Select a region. Colors compare each reading to this person's own baseline.</p>
        <BodyFigure statuses={statuses} selected={selected} onSelect={setSelected} />
        <ul className="mt-4 space-y-1">
          {LEGEND.map((s) => (
            <li key={s} className="flex items-center gap-2 text-xs text-muted">
              <span aria-hidden className="inline-block h-3 w-3" style={{ background: STATUS_COLOR[s] }} />
              {STATUS_LABEL[s]}
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Region details">
        {!region ? (
          <ul className="divide-y divide-rule border-y border-rule">
            {REGIONS.map((r) => (
              <li key={r.id}>
                <button onClick={() => setSelected(r.id)} className="flex w-full items-center justify-between gap-4 py-3 text-left hover:bg-panel">
                  <span className="font-medium">{r.label}</span>
                  <StatusDot status={statuses[r.id]} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="space-y-5">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-xl font-semibold tracking-tight">{region.label}</h2>
              <button onClick={() => setSelected(null)} className="text-sm text-accent underline underline-offset-4 hover:text-ink">
                All regions
              </button>
            </div>
            <ul className="text-sm text-muted">
              {region.indicators.map((i) => (
                <li key={i}>
                  {getContent(i).label}: {readings[i].latest ? formatValue(readings[i].latest) : 'no good reading'}
                </li>
              ))}
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
