import { useEffect, useMemo, useState } from 'react'
import { BodyFigure } from '../components/BodyFigure'
import { IndicatorCard } from '../components/IndicatorCard'
import { Avatar } from '../components/kit/Avatar'
import { Icon, type IconName } from '../components/kit/Icon'
import { Panel } from '../components/kit/Panel'
import { Counter, Gauge, Sigma, Sparkline } from '../components/kit/Readout'
import { StatusDot, StatusSwatch } from '../components/StatusDot'
import { linkBtn } from '../components/ui'
import type { Indicator, Measurement, Status } from '../contract/types'
import { listMeasurements } from '../db/repo'
import { readAll, regionStatus, worstStatus, type IndicatorReading } from '../lib/bodyStatus'
import { getContent } from '../lib/content'
import { formatValue } from '../lib/format'
import { REGIONS, STATUS_LABEL, type Region, type RegionId } from '../lib/regions'
import { useApp } from '../state/AppContext'

const LEGEND: Status[] = ['green', 'yellow', 'red', 'gray']

const REGION_ICON: Record<RegionId, IconName> = {
  head: 'head',
  eyes: 'eye',
  heart: 'heart',
  skeleton: 'bone',
  body: 'body',
  gut: 'gut',
}

/** Which column a region's callout sits in on a wide screen. */
const LEFT: RegionId[] = ['head', 'heart', 'skeleton']
const RIGHT: RegionId[] = ['eyes', 'body', 'gut']

const SEVERITY: Record<Status, number> = { gray: 0, green: 1, yellow: 2, red: 3 }

type Summary = {
  region: Region
  status: Status
  /** The indicator driving this region's status: the worst one that has data. */
  driver: IndicatorReading | null
  /** Signed deviation of the driver from its own baseline, in SD. Null when there is no baseline. */
  z: number | null
  spark: number[]
  withData: number
}

function summarize(region: Region, readings: Record<Indicator, IndicatorReading>): Summary {
  const all = region.indicators.map((i) => readings[i])
  const withData = all.filter((r) => r.latest).length
  const driver =
    all
      .filter((r) => r.latest)
      .sort((a, b) => SEVERITY[b.status] - SEVERITY[a.status])[0] ?? null

  let z: number | null = null
  if (driver?.baseline && typeof driver.latest?.value === 'number') {
    z = (driver.latest.value - driver.baseline.mean) / driver.baseline.sd
  }

  const spark = driver
    ? driver.history.flatMap((m) => (m.quality.passed && typeof m.value === 'number' ? [m.value] : [])).slice(-14)
    : []

  return { region, status: regionStatus(region, readings), driver, z, spark, withData }
}

function Callout({ s, side, selected, onSelect }: { s: Summary; side: 'left' | 'right'; selected: boolean; onSelect: () => void }) {
  const { driver } = s
  return (
    <button
      onClick={onSelect}
      aria-pressed={selected}
      className={`card card-action leader leader-${side} w-full p-4 ${selected ? 'border-accent' : ''}`}
      style={selected ? { boxShadow: 'var(--glow)' } : undefined}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="label inline-flex items-center gap-2">
          <Icon name={REGION_ICON[s.region.id]} size={17} />
          {s.region.label}
        </span>
        <StatusDot status={s.status} short />
      </div>

      {driver?.latest ? (
        <>
          <p className="mt-2.5 flex items-baseline gap-2">
            <span className="value" style={{ fontSize: '1.85rem' }}>
              {formatValue(driver.latest)}
            </span>
            <Sigma z={s.z} status={s.status} />
          </p>
          <div className="mt-1 flex items-end justify-between gap-3">
            <span className="text-sm text-muted">{getContent(driver.indicator).label}</span>
            <Sparkline values={s.spark} status={s.status} width={118} height={36} />
          </div>
        </>
      ) : (
        <p className="mt-2.5 text-sm text-muted">No reading has passed the quality check yet.</p>
      )}
    </button>
  )
}

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
  const summaries = useMemo(
    () => Object.fromEntries(REGIONS.map((r) => [r.id, summarize(r, readings)])) as Record<RegionId, Summary>,
    [readings],
  )
  const statuses = useMemo(
    () => Object.fromEntries(REGIONS.map((r) => [r.id, summaries[r.id].status])) as Record<RegionId, Status>,
    [summaries],
  )

  const region = REGIONS.find((r) => r.id === selected)
  const worst = worstStatus(Object.values(statuses))
  const flagged = REGIONS.filter((r) => statuses[r.id] === 'yellow' || statuses[r.id] === 'red')
  const allIndicators = REGIONS.flatMap((r) => r.indicators)
  const withData = allIndicators.filter((i) => readings[i].latest).length
  const completeness = allIndicators.length === 0 ? 0 : withData / allIndicators.length

  // Never claim "not enough data" while data is still loading.
  if (measurements === null) {
    return (
      <main className="mx-auto w-full max-w-[1500px] px-4 py-8 sm:px-6">
        <p className="text-lg text-muted">Reading telemetry…</p>
        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card h-40 animate-pulse" />
          ))}
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6">
      {/* ---- Mission strip -------------------------------------------------- */}
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 border-b border-rule pb-5">
        <div className="flex items-center gap-4">
          {currentCrew && <Avatar crew={currentCrew} size={64} status={worst} />}
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{currentCrew?.name ?? 'Crew'}</h1>
            <p className="mt-1 text-sm text-muted">
              {currentCrew?.role} · {currentCrew?.dataLabel}
            </p>
          </div>
        </div>

        <dl className="flex flex-wrap items-end gap-x-8 gap-y-3">
          <div>
            <dt className="label">Worst region</dt>
            <dd className="mt-1.5">
              <StatusDot status={worst} size="md" />
            </dd>
          </div>
          <div>
            <dt className="label">Outside baseline</dt>
            <dd className="value mt-1" style={{ fontSize: '1.5rem' }}>
              <Counter value={flagged.length} />
              <span className="value-unit"> of {REGIONS.length} regions</span>
            </dd>
          </div>
          <div>
            <dt className="label">Indicators with good data</dt>
            <dd className="value mt-1" style={{ fontSize: '1.5rem' }}>
              <Counter value={withData} />
              <span className="value-unit"> of {allIndicators.length}</span>
            </dd>
          </div>
        </dl>
      </div>

      {/* ---- Console: callouts around the figure ---------------------------- */}
      <div className="mt-8 grid items-start gap-x-14 gap-y-5 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <div className="flex flex-col gap-5">
          {LEFT.map((id, i) => (
            <div key={id} className="animate-rise" style={{ animationDelay: `${i * 70}ms` }}>
              <Callout s={summaries[id]} side="right" selected={selected === id} onSelect={() => setSelected(id)} />
            </div>
          ))}
        </div>

        <div className="order-first flex flex-col items-center rounded-[var(--r-panel)] bg-panel-2 px-4 py-6 lg:order-none">
          <BodyFigure
            statuses={statuses}
            selected={selected}
            onSelect={setSelected}
            markers
            className="h-[clamp(320px,46vh,440px)] w-auto max-w-full"
          />
          <p className="mt-3 text-base text-muted">
            Live · compared with this person&rsquo;s own baseline
          </p>
          <ul className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1.5">
            {LEGEND.map((s) => (
              <li key={s}>
                <StatusSwatch status={s} label={STATUS_LABEL[s]} />
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-5">
          {RIGHT.map((id, i) => (
            <div key={id} className="animate-rise" style={{ animationDelay: `${i * 70}ms` }}>
              <Callout s={summaries[id]} side="left" selected={selected === id} onSelect={() => setSelected(id)} />
            </div>
          ))}
        </div>
      </div>

      {/* ---- Readiness and next action -------------------------------------- */}
      <div className="mt-8 grid gap-5 lg:grid-cols-[auto_1fr]">
        <Panel label="Data completeness" delay={160} className="flex items-center justify-center p-6">
          <div className="text-center">
            <Gauge
              value={completeness}
              label={`${withData} of ${allIndicators.length} indicators`}
              caption="measured"
              status={completeness > 0.75 ? 'green' : completeness > 0.4 ? 'yellow' : 'gray'}
              size={150}
            />
            <p className="mt-3 max-w-[18rem] text-sm leading-relaxed text-muted">
              How much of this person is actually being measured right now. It says nothing about how healthy they are.
            </p>
          </div>
        </Panel>

        <Panel label="Next action" delay={220} className="p-6">
          {flagged.length === 0 ? (
            <div className="flex items-start gap-3">
              <Icon name="check" size={22} className="mt-0.5" />
              <div>
                <h2 className="text-xl font-semibold tracking-tight">Nothing needs doing</h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
                  Every region with good data is inside this person&rsquo;s own baseline. A daily check-in is what keeps that baseline
                  honest, so the next useful thing is simply the next check.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <Icon name="alert" size={22} className="mt-0.5" />
              <div>
                <h2 className="text-xl font-semibold tracking-tight">
                  {flagged.length} region{flagged.length > 1 ? 's' : ''} outside baseline
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
                  {flagged.map((r) => r.label).join(', ')} moved away from this person&rsquo;s own normal. Open the region for the readings
                  behind it, or take the escalation ladder to decide who to tell.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button onClick={() => setSelected(flagged[0].id)} className={linkBtn}>
                    Open {flagged[0].label.toLowerCase()}
                    <Icon name="arrowRight" size={14} />
                  </button>
                  <button onClick={() => go('escalation')} className={linkBtn}>
                    Escalation ladder
                    <Icon name="arrowRight" size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </Panel>
      </div>

      {/* ---- Region detail --------------------------------------------------- */}
      <section aria-label="Region detail" className="mt-10">
        {!region ? (
          <Panel label="All regions" aside={<span className="ticker">select one to open its readings</span>}>
            <ul className="divide-y divide-rule">
              {REGIONS.map((r) => {
                const s = summaries[r.id]
                return (
                  <li key={r.id}>
                    <button
                      onClick={() => setSelected(r.id)}
                      className="flex min-h-[56px] w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-panel-2"
                    >
                      <span className="inline-flex items-center gap-3">
                        <Icon name={REGION_ICON[r.id]} size={16} className="text-muted" />
                        <span className="font-medium">{r.label}</span>
                        <span className="text-sm text-muted">
                          {s.withData} of {r.indicators.length} measured
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-4">
                        <Sparkline values={s.spark} status={s.status} width={96} height={28} />
                        <StatusDot status={s.status} short />
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </Panel>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-3">
              <div>
                <h2 className="inline-flex items-center gap-3 text-2xl font-semibold tracking-tight">
                  <Icon name={REGION_ICON[region.id]} size={22} className="text-accent" />
                  {region.label}
                </h2>
              </div>
              <button onClick={() => setSelected(null)} className={linkBtn}>
                All regions
              </button>
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
              {region.indicators.map((i) => (
                <IndicatorCard key={i} reading={readings[i]} />
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  )
}
