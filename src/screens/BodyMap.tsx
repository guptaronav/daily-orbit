import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BodyFigure } from '../components/BodyFigure'
import { IndicatorCard } from '../components/IndicatorCard'
import { Avatar } from '../components/kit/Avatar'
import { Icon, type IconName } from '../components/kit/Icon'
import { Sparkline } from '../components/kit/Readout'
import { useCrewGame } from '../components/kit/useCrewGame'
import { CoinIcon } from '../components/kit/Wallet'
import { STATUS_TEXT, STATUS_WASH } from '../components/StatusDot'
import type { Indicator, Measurement, Status } from '../contract/types'
import { listMeasurements } from '../db/repo'
import { readAll, regionStatus, worstStatus, type IndicatorReading } from '../lib/bodyStatus'
import { getContent } from '../lib/content'
import { formatValue } from '../lib/format'
import { dailyPlan } from '../lib/plan'
import { REGIONS, STATUS_LABEL, type Region, type RegionId } from '../lib/regions'
import { SYSTEMS, WEEKLY_GOAL_PER_CREW, pointsInWindow, systemsStatus } from '../lib/scoring'
import { useApp } from '../state/AppContext'

const REGION_ICON: Record<RegionId, IconName> = {
  head: 'head',
  eyes: 'eye',
  heart: 'heart',
  skeleton: 'bone',
  body: 'body',
  gut: 'gut',
}

/**
 * What each stop of the tour says. `story` is what this region is for, `how` is how the app gets
 * at it. Neither makes a clinical claim: they describe the measurement, not the person.
 */
const TOUR: Record<RegionId, { story: string; how: string }> = {
  head: {
    story: 'Sleep, mood and stress set the tone for everything else on this page.',
    how: 'Four sliders you answer in the mirror check, plus blink rate and eyelid closure read from the camera. All of it is compared with your own last 30 days, never with anyone else.',
  },
  eyes: {
    story: 'Long missions are hard on eyes, and the changes are easy to miss day to day.',
    how: 'An Amsler grid for distortion and a near-acuity card you read at arm’s length. Both are self-reported, so they are only as good as the light and the distance you used.',
  },
  heart: {
    story: 'Pulse and blood pressure are the fastest signals that something changed.',
    how: 'Heart rate comes from tiny color changes in your face on camera. If the light or the motion is wrong, it refuses to give a number rather than guess one. Blood pressure comes from the cuff.',
  },
  skeleton: {
    story: 'Bone and muscle are the slow losses, and exercise is the countermeasure.',
    how: 'Minutes logged by hand. The app counts the doing, not the intensity, and the credit is the same whatever the number says.',
  },
  body: {
    story: 'Everything that is about the whole of you rather than one part.',
    how: 'Temperature from a thermometer, a simulated radiation dose from the replay, and whatever you told it in the symptom check.',
  },
  gut: {
    story: 'Appetite, digestion and mass drift quietly, and they drift together.',
    how: 'Short self-reports plus a glucose meter and a mass device when you have them. Gaps here are normal and are shown as gray rather than guessed.',
  },
}

const SEVERITY: Record<Status, number> = { gray: 0, green: 1, yellow: 2, red: 3 }

type Summary = {
  region: Region
  status: Status
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

/** How a reading was obtained, in one word, for the method chip. */
const methodOf = (r: IndicatorReading): string => {
  const source = r.latest?.source
  if (source === 'camera') return 'Camera'
  if (source === 'manual') return 'Logged'
  if (source === 'selfReport') return 'Self-report'
  if (source === 'simulated') return 'Simulated'
  if (source === 'nasa-bedrest' || source === 'nasa-osdr') return 'NASA data'
  return 'No reading'
}

/** Plain words for how far the latest reading sits from that person's own normal. */
function noteFor(r: IndicatorReading): string {
  if (!r.latest) return 'No reading has passed the quality check'
  if (!r.baseline || typeof r.latest.value !== 'number') return 'Building your normal'
  const diff = r.latest.value - r.baseline.mean
  const z = Math.abs(diff) / r.baseline.sd
  if (z <= 1) return 'Inside your normal range'
  const amount = Math.abs(diff).toFixed(1)
  return `${amount} ${r.latest.unit ?? ''} ${diff < 0 ? 'below' : 'above'} your normal`.replace('  ', ' ')
}

export function BodyMap() {
  const { crewId, currentCrew, dataVersion, go } = useApp()
  const [measurements, setMeasurements] = useState<Measurement[] | null>(null)
  const [tour, setTour] = useState<RegionId>('head')
  const [showBand, setShowBand] = useState(true)
  const [markers, setMarkers] = useState(true)
  const [scan, setScan] = useState(false)
  const [charts, setCharts] = useState<RegionId | null>(null)
  const game = useCrewGame(crewId, dataVersion)
  const chapterRefs = useRef<Partial<Record<RegionId, HTMLElement | null>>>({})

  useEffect(() => {
    let cancelled = false
    void listMeasurements(crewId).then((rows) => !cancelled && setMeasurements(rows))
    return () => {
      cancelled = true
    }
  }, [crewId, dataVersion])

  // The chapter nearest the middle of the viewport is the one the figure follows.
  const pick = useCallback(() => {
    const mid = window.innerHeight * 0.5
    let best: RegionId | null = null
    let bestDistance = Infinity
    for (const r of REGIONS) {
      const el = chapterRefs.current[r.id]
      if (!el) continue
      const box = el.getBoundingClientRect()
      const d = Math.abs(box.top + box.height / 2 - mid)
      if (d < bestDistance) {
        bestDistance = d
        best = r.id
      }
    }
    if (best) setTour((t) => (t === best ? t : (best as RegionId)))
  }, [])

  useEffect(() => {
    let frame = 0
    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        pick()
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    pick()
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [pick, measurements])

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

  const worst = worstStatus(Object.values(statuses))
  const flagged = REGIONS.filter((r) => statuses[r.id] === 'yellow' || statuses[r.id] === 'red')
  const allIndicators = REGIONS.flatMap((r) => r.indicators)
  const withData = allIndicators.filter((i) => readings[i].latest).length
  const nextSystem = systemsStatus(game.coins).find((s) => !s.online)
  const goalWeek = game.ready ? pointsInWindow(game.events, new Date(), 7) : 0
  const planDone = plan.filter((p) => p.done).length

  const goChapter = (id: RegionId) => {
    const el = chapterRefs.current[id]
    if (!el) return
    const box = el.getBoundingClientRect()
    window.scrollTo({ top: box.top + window.scrollY - (window.innerHeight * 0.5 - box.height / 2), behavior: 'smooth' })
  }

  if (measurements === null) {
    return (
      <main className="mx-auto w-full max-w-[1440px] px-4 pb-10 pt-8 text-lg text-muted sm:px-8">Reading telemetry…</main>
    )
  }

  const stats = [
    { k: 'Regions inside baseline', v: `${REGIONS.length - flagged.length}`, u: `of ${REGIONS.length}` },
    { k: 'Indicators measured', v: `${withData}`, u: `of ${allIndicators.length}` },
    { k: 'Coins', v: `${game.coins}`, u: `Lv ${game.level.level} · ${game.level.title}` },
  ]

  const toggles = [
    { label: 'Baseline band', on: showBand, flip: () => setShowBand((v) => !v) },
    { label: 'Pulse on alerts', on: markers, flip: () => setMarkers((v) => !v) },
    { label: 'Scan line', on: scan, flip: () => setScan((v) => !v) },
  ]

  return (
    <main
      className="mx-auto flex w-full max-w-[1440px] flex-col gap-7 pb-16 pt-7"
      style={{ paddingLeft: 'clamp(16px, 3vw, 32px)', paddingRight: 'clamp(16px, 3vw, 32px)' }}
    >
      {/* ---- Who, and what to do next --------------------------------------- */}
      <section className="flex flex-wrap items-start justify-between gap-x-10 gap-y-6">
        <div className="flex items-start gap-5">
          {currentCrew && <Avatar crew={currentCrew} size={76} status={worst} />}
          <div>
            <p className="text-sm text-muted">
              {currentCrew?.role} · {currentCrew?.dataLabel}
            </p>
            <h1 className="m-0 mt-1" style={{ fontSize: 'clamp(36px, 4.4vw, 60px)', lineHeight: 0.95, fontWeight: 800, letterSpacing: '-0.05em' }}>
              {currentCrew?.name}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="pill" style={{ background: STATUS_WASH[worst], color: STATUS_TEXT[worst] }}>
                {STATUS_LABEL[worst]}
              </span>
              <span className="text-[15px] text-muted">
                {flagged.length === 0
                  ? 'Every region with good data is inside baseline'
                  : `${flagged.map((r) => r.label).join(', ')} moved away from this person’s own normal`}
              </span>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button onClick={() => go('mirror')} className="btn btn-primary">
                <Icon name="eye" size={17} />
                Start today&rsquo;s check
              </button>
              <button onClick={() => go('manual')} className="btn btn-secondary">
                <Icon name="plus" size={17} />
                Log a reading
              </button>
            </div>
          </div>
        </div>

        <dl className="flex flex-wrap gap-x-9 gap-y-4">
          {stats.map((s) => (
            <div key={s.k} className="max-w-[12rem]">
              <dt className="text-[13px] text-muted">{s.k}</dt>
              <dd className="m-0 mt-1" style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.04em' }}>
                {s.v} <span className="text-base font-medium text-muted">{s.u}</span>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ---- Today's check-ins and the crew goal ----------------------------- */}
      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="card p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <h2 className="m-0 text-xl font-bold tracking-tight">
              Today&rsquo;s check-ins
              {plan.length > 0 && (
                <span className="ml-2 font-semibold text-muted">
                  {planDone}/{plan.length}
                </span>
              )}
            </h2>
            <p className="m-0 text-sm text-muted">Coins reward doing, never the numbers</p>
          </div>

          <ul className="mt-4 space-y-2">
            {plan.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2 p-3.5"
                style={{ borderRadius: 18, background: item.done ? 'var(--color-ok-wash)' : 'var(--color-panel-2)' }}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span
                    aria-hidden
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full"
                    style={item.done ? { background: 'var(--color-ok)', color: '#fff' } : { background: 'var(--color-paper-deep)' }}
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
        </div>

        <div className="card p-6">
          <h2 className="m-0 text-xl font-bold tracking-tight">Crew weekly goal</h2>
          <p className="m-0 mt-2 flex items-center gap-2 text-lg font-bold">
            <CoinIcon size={18} />
            {goalWeek} of {WEEKLY_GOAL_PER_CREW} coins
          </p>
          <div className="meter mt-3" style={{ height: 12 }}>
            <span style={{ width: `${Math.min(100, (goalWeek / WEEKLY_GOAL_PER_CREW) * 100)}%`, background: 'var(--color-ink)' }} />
          </div>
          <p className="m-0 mt-3 leading-relaxed text-muted">
            One shared goal, so nobody is ranked. Every check-in counts, including hard days.
          </p>
          <p className="m-0 mt-3 font-semibold">
            {nextSystem ? `Next system: ${nextSystem.name}` : `All ${SYSTEMS.length} ship systems online`}
          </p>
        </div>
      </section>

      {/* ---- The body tour --------------------------------------------------- */}
      <section aria-labelledby="tour-heading" className="border border-rule bg-panel" style={{ borderRadius: 32, padding: 'clamp(20px, 3vw, 36px)' }}>
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <div>
            <p className="m-0 text-sm text-muted">Body tour · scroll, or pick a region</p>
            <h2
              id="tour-heading"
              className="m-0 mt-1"
              style={{ fontSize: 'clamp(30px, 3.6vw, 46px)', lineHeight: 1, fontWeight: 800, letterSpacing: '-0.045em' }}
            >
              Inside {currentCrew?.name}
            </h2>
            <p className="m-0 mt-3 text-muted" style={{ maxWidth: '56ch', fontSize: 15.5, lineHeight: 1.55 }}>
              Each stop zooms into one region, marks every reading on the figure, and says in plain words what moved.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {toggles.map((t) => (
              <button
                key={t.label}
                onClick={t.flip}
                aria-pressed={t.on}
                className="inline-flex items-center gap-2 px-3.5 text-sm font-semibold"
                style={{
                  minHeight: 40,
                  borderRadius: 999,
                  background: t.on ? 'var(--color-ink)' : 'transparent',
                  color: t.on ? 'var(--color-paper)' : 'var(--color-ink)',
                  border: `1px solid ${t.on ? 'var(--color-ink)' : 'var(--color-rule-strong)'}`,
                }}
              >
                <Icon name="check" size={14} className={t.on ? '' : 'opacity-0'} />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Region tabs: the keyboard and small-screen path through the same tour. */}
        <div className="no-bar mt-5 flex gap-2 overflow-x-auto pb-1">
          {REGIONS.map((r, i) => {
            const s = summaries[r.id]
            const on = tour === r.id
            return (
              <button
                key={r.id}
                onClick={() => goChapter(r.id)}
                aria-pressed={on}
                className="inline-flex shrink-0 items-center gap-2 px-3.5 text-sm font-semibold"
                style={{
                  minHeight: 42,
                  borderRadius: 999,
                  background: on ? 'var(--color-ink)' : 'var(--color-panel-2)',
                  color: on ? 'var(--color-paper)' : 'var(--color-ink)',
                }}
              >
                <Icon name={REGION_ICON[r.id]} size={15} />
                {r.label}
                <span
                  aria-hidden
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: STATUS_TEXT[s.status], opacity: s.status === 'green' ? 0.45 : 1 }}
                />
                <span className="sr-only">
                  {STATUS_LABEL[s.status]}, stop {i + 1} of {REGIONS.length}
                </span>
              </button>
            )
          })}
        </div>

        <div className="mt-6 flex flex-wrap items-start gap-x-10 gap-y-6">
          {/* The viewer follows the tour. Sticky on wide screens, inline on narrow ones. */}
          <div className="viewer w-full lg:sticky lg:top-24">
            <div
              className="flex flex-col items-center px-4 py-6"
              style={{ borderRadius: 28, background: 'var(--color-panel-2)' }}
            >
              <BodyFigure
                statuses={statuses}
                selected={tour}
                onSelect={goChapter}
                markers={markers}
                scan={scan}
                className="w-auto max-w-full"
                style={{ height: 'clamp(260px, 38vh, 380px)' }}
              />
              <p className="m-0 mt-4 text-center text-sm text-muted">
                {REGIONS.findIndex((r) => r.id === tour) + 1} / {String(REGIONS.length).padStart(2, '0')} ·{' '}
                {REGIONS.find((r) => r.id === tour)?.label}
              </p>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            {REGIONS.map((r, i) => {
              const s = summaries[r.id]
              const active = tour === r.id
              const copy = TOUR[r.id]
              return (
                <article
                  key={r.id}
                  ref={(el) => {
                    chapterRefs.current[r.id] = el
                  }}
                  aria-labelledby={`chapter-${r.id}`}
                  className="flex flex-col justify-center gap-4"
                  style={{
                    minHeight: '72vh',
                    padding: '28px 4px 40px',
                    opacity: active ? 1 : 0.45,
                    transform: active ? 'none' : 'translateY(10px)',
                    transition: 'opacity 600ms ease, transform 700ms cubic-bezier(.22,1,.36,1)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="whitespace-nowrap text-sm font-semibold text-muted">
                      {String(i + 1).padStart(2, '0')} / {String(REGIONS.length).padStart(2, '0')}
                    </span>
                    <span className="pill" style={{ background: STATUS_WASH[s.status], color: STATUS_TEXT[s.status] }}>
                      {STATUS_LABEL[s.status]}
                    </span>
                  </div>

                  <h3
                    id={`chapter-${r.id}`}
                    className="m-0"
                    style={{ fontSize: 'clamp(36px, 4.6vw, 60px)', lineHeight: 0.95, fontWeight: 750, letterSpacing: '-0.045em' }}
                  >
                    {r.label}
                  </h3>

                  <p
                    className="m-0"
                    style={{ maxWidth: '40ch', fontSize: 'clamp(18px, 1.7vw, 21px)', lineHeight: 1.45, fontWeight: 500, letterSpacing: '-0.01em' }}
                  >
                    {copy.story}
                  </p>
                  <p className="m-0 text-muted" style={{ maxWidth: '56ch', fontSize: 14.5, lineHeight: 1.55 }}>
                    {copy.how}
                  </p>

                  <ul className="m-0 mt-1 flex list-none flex-col gap-2 p-0">
                    {r.indicators.map((ind) => {
                      const reading = readings[ind]
                      const content = getContent(ind)
                      const spark = reading.history
                        .flatMap((m) => (m.quality.passed && typeof m.value === 'number' ? [m.value] : []))
                        .slice(-16)
                      return (
                        <li
                          key={ind}
                          className="grid items-center gap-x-3.5 gap-y-1 border border-rule bg-panel px-4 py-3.5"
                          style={{ borderRadius: 18, gridTemplateColumns: 'minmax(0, 1fr) auto' }}
                        >
                          <span className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1.5">
                            <span style={{ fontSize: 15.5, fontWeight: 650 }}>{content.label}</span>
                            <span
                              className="whitespace-nowrap px-2 py-0.5 text-xs font-medium text-ink-soft"
                              style={{ borderRadius: 999, background: 'var(--color-paper-deep)' }}
                            >
                              {methodOf(reading)}
                            </span>
                          </span>

                          <span className="flex items-baseline gap-1.5 whitespace-nowrap">
                            <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', color: STATUS_TEXT[reading.status] }}>
                              {reading.latest ? formatValue(reading.latest) : '—'}
                            </span>
                          </span>

                          <span style={{ fontSize: 13.5, fontWeight: 600, color: STATUS_TEXT[reading.status] }}>{noteFor(reading)}</span>
                          <span className="justify-self-end">
                            <Sparkline values={spark} status={reading.status} width={96} height={26} />
                          </span>
                        </li>
                      )
                    })}
                  </ul>

                  <div className="mt-1 flex flex-wrap gap-3">
                    <button onClick={() => setCharts(charts === r.id ? null : r.id)} className="btn btn-secondary btn-sm">
                      {charts === r.id ? 'Hide the charts' : 'See the charts'}
                    </button>
                    {(s.status === 'yellow' || s.status === 'red') && (
                      <button onClick={() => go('escalation')} className="btn-quiet">
                        Who to tell
                        <Icon name="arrowRight" size={14} />
                      </button>
                    )}
                  </div>

                  {charts === r.id && (
                    <div className="animate-rise mt-2 grid gap-4">
                      {r.indicators.map((ind) => (
                        <IndicatorCard key={ind} reading={readings[ind]} showBand={showBand} />
                      ))}
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        </div>
      </section>
    </main>
  )
}
