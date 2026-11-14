import { useEffect, useMemo, useState } from 'react'
import { BodyFigure } from '../components/BodyFigure'
import { IndicatorCard } from '../components/IndicatorCard'
import { Avatar } from '../components/kit/Avatar'
import { Icon, type IconName } from '../components/kit/Icon'
import { Sigma, Sparkline } from '../components/kit/Readout'
import { useCrewGame } from '../components/kit/useCrewGame'
import { CoinIcon } from '../components/kit/Wallet'
import { StatusDot, StatusSwatch } from '../components/StatusDot'
import type { Indicator, Measurement, Status } from '../contract/types'
import { listMeasurements } from '../db/repo'
import { readAll, regionStatus, worstStatus, type IndicatorReading } from '../lib/bodyStatus'
import { getContent } from '../lib/content'
import { formatValue } from '../lib/format'
import { dailyPlan } from '../lib/plan'
import { REGIONS, STATUS_LABEL, type Region, type RegionId } from '../lib/regions'
import { SYSTEMS, WEEKLY_GOAL_PER_CREW, pointsInWindow, systemsStatus } from '../lib/scoring'
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

const SEVERITY: Record<Status, number> = { gray: 0, green: 1, yellow: 2, red: 3 }

type Summary = {
  region: Region
  status: Status
  /** The indicator driving this region's status: the worst one that has data. */
  driver: IndicatorReading | null
  z: number | null
  spark: number[]
  withData: number
}

function summarize(region: Region, readings: Record<Indicator, IndicatorReading>): Summary {
  const all = region.indicators.map((i) => readings[i])
  const driver = all.filter((r) => r.latest).sort((a, b) => SEVERITY[b.status] - SEVERITY[a.status])[0] ?? null

  let z: number | null = null
  if (driver?.baseline && typeof driver.latest?.value === 'number') {
    z = (driver.latest.value - driver.baseline.mean) / driver.baseline.sd
  }

  return {
    region,
    status: regionStatus(region, readings),
    driver,
    z,
    spark: driver ? driver.history.flatMap((m) => (m.quality.passed && typeof m.value === 'number' ? [m.value] : [])).slice(-16) : [],
    withData: all.filter((r) => r.latest).length,
  }
}

function RegionCard({ s, selected, onSelect }: { s: Summary; selected: boolean; onSelect: () => void }) {
  const { driver } = s
  return (
    <button onClick={onSelect} aria-pressed={selected} className="card card-action w-full p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2.5 font-bold">
          <Icon name={REGION_ICON[s.region.id]} size={18} />
          {s.region.label}
        </span>
        <StatusDot status={s.status} />
      </div>

      {driver?.latest ? (
        <>
          <p className="mt-3 flex items-baseline gap-2">
            <span className="value" style={{ fontSize: '2rem' }}>
              {formatValue(driver.latest)}
            </span>
            <Sigma z={s.z} status={s.status} />
          </p>
          <div className="mt-1 flex items-end justify-between gap-3">
            <span className="text-sm text-muted">{getContent(driver.indicator).label}</span>
            <Sparkline values={s.spark} status={s.status} width={120} height={34} />
          </div>
        </>
      ) : (
        <p className="mt-3 text-[0.9375rem] text-muted">No reading has passed the quality check yet.</p>
      )}
    </button>
  )
}

export function BodyMap() {
  const { crewId, currentCrew, dataVersion, go } = useApp()
  const [measurements, setMeasurements] = useState<Measurement[] | null>(null)
  const [selected, setSelected] = useState<RegionId | null>(null)
  const [showBand, setShowBand] = useState(true)
  const [pulseAlerts, setPulseAlerts] = useState(true)
  const game = useCrewGame(crewId, dataVersion)

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

  const plan = useMemo(() => {
    if (measurements === null || !game.ready) return []
    return dailyPlan({ crewId, readings, events: game.events, measurements, now: new Date() })
  }, [measurements, readings, game.events, game.ready, crewId])

  const region = REGIONS.find((r) => r.id === selected)
  const worst = worstStatus(Object.values(statuses))
  const flagged = REGIONS.filter((r) => statuses[r.id] === 'yellow' || statuses[r.id] === 'red')
  const allIndicators = REGIONS.flatMap((r) => r.indicators)
  const withData = allIndicators.filter((i) => readings[i].latest).length

  const nextSystem = systemsStatus(game.coins).find((s) => !s.online)
  const goalTarget = WEEKLY_GOAL_PER_CREW
  const goalWeek = game.ready ? pointsInWindow(game.events, new Date(), 7) : 0
  const planDone = plan.filter((p) => p.done).length

  if (measurements === null) {
    return (
      <main className="mx-auto w-full max-w-[1440px] px-4 pb-10 pt-8 sm:px-8">
        <p className="text-lg text-muted">Reading telemetry…</p>
        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card h-40 animate-pulse" />
          ))}
        </div>
      </main>
    )
  }

  const stats = [
    { k: 'Regions inside baseline', v: String(REGIONS.length - flagged.length), u: `of ${REGIONS.length}`, note: 'Each against this person’s own normal' },
    { k: 'Indicators measured', v: String(withData), u: `of ${allIndicators.length}`, note: 'Gray means no reading passed quality' },
    { k: 'Coins', v: String(game.coins), u: '', note: `Level ${game.level.level} · ${game.level.title}` },
  ]

  return (
    <main className="mx-auto w-full max-w-[1440px] px-4 pb-10 pt-8 sm:px-8">
      {/* ---- Who, and what to do next --------------------------------------- */}
      <div className="flex flex-wrap items-start justify-between gap-x-10 gap-y-6">
        <div className="flex items-start gap-5">
          {currentCrew && <Avatar crew={currentCrew} size={72} status={worst} />}
          <div>
            <p className="label">
              {currentCrew?.role} · {currentCrew?.dataLabel}
            </p>
            <h1 className="display mt-1 text-4xl sm:text-5xl">{currentCrew?.name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <StatusDot status={worst} size="md" />
              <span className="text-[0.9375rem] text-muted">
                {flagged.length === 0
                  ? 'Every region with good data is inside baseline'
                  : `${flagged.map((r) => r.label).join(', ')} moved away from this person’s own normal`}
              </span>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button onClick={() => go('mirror')} className="btn btn-primary">
                <Icon name="eye" size={16} />
                Start today&rsquo;s check
              </button>
              <button onClick={() => go('manual')} className="btn btn-secondary">
                <Icon name="plus" size={16} />
                Log a reading
              </button>
            </div>
          </div>
        </div>

        <dl className="grid gap-x-10 gap-y-5 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.k} className="max-w-[11rem]">
              <dt className="label">{s.k}</dt>
              <dd className="value mt-1" style={{ fontSize: '2.25rem' }}>
                {s.v}
                {s.u && <span className="value-unit"> {s.u}</span>}
              </dd>
              <dd className="mt-1 text-sm leading-snug text-muted">{s.note}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* ---- Today's check-ins and the crew goal ----------------------------- */}
      <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <section aria-labelledby="checkins" className="card p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <h2 id="checkins" className="text-xl font-bold tracking-tight">
              Today&rsquo;s check-ins
              {plan.length > 0 && (
                <span className="ml-2 font-semibold text-muted">
                  {planDone}/{plan.length}
                </span>
              )}
            </h2>
            <p className="text-sm text-muted">Coins reward doing, never the numbers</p>
          </div>

          {plan.length === 0 ? (
            <p className="mt-4 text-muted">Loading today&rsquo;s plan…</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {plan.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2 rounded-2xl p-3.5"
                  style={{ background: item.done ? 'var(--color-ok-wash)' : 'var(--color-panel-2)' }}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      aria-hidden
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-full"
                      style={
                        item.done
                          ? { background: 'var(--color-ok)', color: '#fff' }
                          : { background: 'var(--color-paper-deep)', color: 'var(--color-muted)' }
                      }
                    >
                      <Icon name={item.done ? 'check' : 'plus'} size={15} />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold">{item.title}</span>
                      {item.why && <span className="block text-sm leading-snug text-muted">{item.why}</span>}
                    </span>
                  </span>

                  <span className="flex shrink-0 items-center gap-3">
                    <span className="pill" style={{ background: 'var(--color-ink)', color: 'var(--color-paper)' }}>
                      <CoinIcon size={13} />+{item.points}
                    </span>
                    {item.action.type === 'go' && !item.done && (
                      <button onClick={() => go(item.action.type === 'go' ? item.action.screen : 'bodymap')} className="btn-quiet">
                        Open
                        <Icon name="arrowRight" size={14} />
                      </button>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="goal" className="card p-6">
          <h2 id="goal" className="text-xl font-bold tracking-tight">
            Crew weekly goal
          </h2>
          <p className="mt-2 flex items-center gap-2 text-lg font-bold">
            <CoinIcon size={18} />
            {goalWeek} of {goalTarget} coins
          </p>
          <div className="meter mt-3" style={{ height: 12 }}>
            <span style={{ width: `${Math.min(100, (goalWeek / goalTarget) * 100)}%`, background: 'var(--color-ink)' }} />
          </div>
          <p className="mt-2 text-sm text-muted">This week, for {currentCrew?.name}</p>
          <p className="mt-3 leading-relaxed text-muted">
            One shared goal, so nobody is ranked. Every check-in counts, including hard days.
          </p>
          <p className="mt-3 text-[0.9375rem] font-semibold">
            {nextSystem ? `Next system: ${nextSystem.name}` : `All ${SYSTEMS.length} ship systems online`}
          </p>
        </section>
      </div>

      {/* ---- The body map ---------------------------------------------------- */}
      <section aria-labelledby="map" className="card mt-6 p-6">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <div>
            <h2 id="map" className="text-xl font-bold tracking-tight">
              Body map
            </h2>
            <p className="mt-1 text-muted">
              Each region against {currentCrew?.name}&rsquo;s own 30-day baseline. Select one to open it.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowBand((b) => !b)} aria-pressed={showBand} className="track-item" style={{ border: '1px solid var(--color-rule)' }}>
              {showBand && <Icon name="check" size={14} />}
              Baseline band
            </button>
            <button onClick={() => setPulseAlerts((p) => !p)} aria-pressed={pulseAlerts} className="track-item" style={{ border: '1px solid var(--color-rule)' }}>
              {pulseAlerts && <Icon name="check" size={14} />}
              Pulse on alerts
            </button>
          </div>
        </div>

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <ul className="space-y-3">
            {REGIONS.map((r, i) => (
              <li key={r.id} className="animate-rise" style={{ animationDelay: `${i * 60}ms` }}>
                <RegionCard s={summaries[r.id]} selected={selected === r.id} onSelect={() => setSelected(r.id)} />
              </li>
            ))}
          </ul>

          <div
            className="flex flex-col items-center rounded-[var(--r-panel)] px-4 py-8 lg:sticky lg:top-28"
            style={{ background: 'var(--color-panel-2)' }}
          >
            <BodyFigure
              statuses={statuses}
              selected={selected}
              onSelect={setSelected}
              markers={pulseAlerts}
              className="h-[clamp(300px,42vh,420px)] w-auto max-w-full"
            />
            <ul className="mt-6 flex flex-wrap justify-center gap-2">
              {LEGEND.map((s) => (
                <li key={s}>
                  <StatusSwatch status={s} label={STATUS_LABEL[s]} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ---- Region detail ---------------------------------------------------- */}
      {region && (
        <section aria-label={`${region.label} detail`} className="mt-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="flex items-center gap-3 text-2xl font-bold tracking-tight">
              <Icon name={REGION_ICON[region.id]} size={24} />
              {region.label}
            </h2>
            <button onClick={() => setSelected(null)} className="btn-quiet">
              Close region
            </button>
          </div>
          <p className="mt-2 max-w-3xl text-muted">
            Green band: your normal (± 1 SD). Amber: watch (1 to 2 SD). Outside both: act.
          </p>

          <div className="mt-5 grid gap-5 xl:grid-cols-2">
            {region.indicators.map((i) => (
              <IndicatorCard key={i} reading={readings[i]} showBand={showBand} />
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
