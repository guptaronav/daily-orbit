import { useEffect, useMemo, useState } from 'react'
import { CrewGoal } from '../components/CrewGoal'
import { Avatar } from '../components/kit/Avatar'
import { Icon } from '../components/kit/Icon'
import { CoinIcon, FlameIcon } from '../components/kit/Wallet'
import type { GameEvent, Measurement } from '../contract/types'
import { addEvent, listEvents, listMeasurements } from '../db/repo'
import { readAll } from '../lib/bodyStatus'
import { coinsFor, levelFor } from '../lib/levels'
import { dailyPlan, type PlanItem, type PlanScreen } from '../lib/plan'
import {
  activityHeatmap,
  badgesFor,
  dropAvailable,
  milestonesFor,
  msToNextDay,
  PASS_TIERS,
  passProgress,
  shieldsFor,
  weeklyChallenge,
  type Milestone,
} from '../lib/rewards'
import { EVENT_LABEL, POINTS, creditedEvents, crewProgress, systemsStatus } from '../lib/scoring'
import { checkInDays, currentStreak } from '../lib/streak'
import { useApp } from '../state/AppContext'

const RECENT = 8

const hhmm = (ms: number) => {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function PlanRow({ item, go, onConfirm }: { item: PlanItem; go: (screen: PlanScreen) => void; onConfirm: (item: PlanItem) => void }) {
  const action = item.action
  return (
    <li
      className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 rounded-2xl p-4"
      style={{ background: item.done ? 'var(--color-ok-wash)' : 'var(--color-panel-2)' }}
    >
      <div className="min-w-0 max-w-xl">
        <p className="flex items-center gap-2 font-bold">
          <span
            aria-hidden
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full"
            style={item.done ? { background: 'var(--color-ok)', color: '#fff' } : { background: 'var(--color-paper-deep)' }}
          >
            <Icon name={item.done ? 'check' : 'plus'} size={14} />
          </span>
          {item.title}
        </p>
        {item.why && <p className="mt-1.5 text-[0.9375rem] leading-relaxed">{item.why}</p>}
        <p className="mt-1 text-[0.9375rem] leading-relaxed text-muted">{item.guidance}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="pill" style={{ background: 'var(--color-ink)', color: 'var(--color-paper)' }}>
          <CoinIcon size={13} />+{item.points}
        </span>
        {item.done ? (
          <span className="font-semibold" style={{ color: 'var(--color-ok-ink)' }}>
            Done today
          </span>
        ) : action.type === 'go' ? (
          <button onClick={() => go(action.screen)} className="btn btn-secondary btn-sm">
            Open
          </button>
        ) : (
          <>
            {action.link && (
              <button onClick={() => go(action.link as PlanScreen)} className="btn-quiet">
                Escalation
              </button>
            )}
            <button onClick={() => onConfirm(item)} className="btn btn-primary btn-sm">
              I did this
            </button>
          </>
        )}
      </div>
    </li>
  )
}

export function Progress() {
  const { crew, crewId, currentCrew, dataVersion, go, refresh } = useApp()
  const [events, setEvents] = useState<GameEvent[] | null>(null)
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  // "Now" is refreshed with every data load. Frozen at mount, anything done afterwards fell outside the week window.
  const [now, setNow] = useState(() => new Date())
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void Promise.all(crew.map((c) => listEvents(c.id))).then((rows) => {
      if (cancelled) return
      setNow(new Date())
      setEvents(rows.flat())
    })
    void listMeasurements(crewId).then((rows) => !cancelled && setMeasurements(rows))
    return () => {
      cancelled = true
    }
  }, [crew, crewId, dataVersion])

  const view = useMemo(() => {
    if (!events) return null
    const mineAll = events.filter((e) => e.crewId === crewId)
    const mine = creditedEvents(events)
      .filter((e) => e.crewId === crewId)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    const progress = crewProgress(events, now, crew.length)
    const coins = coinsFor(mineAll)
    const streak = currentStreak(checkInDays(events, crewId), now.toISOString().slice(0, 10))
    return {
      progress,
      recent: mine.slice(0, RECENT),
      streak,
      coins,
      level: levelFor(coins),
      systems: systemsStatus(progress.totalPoints),
      plan: dailyPlan({ crewId, readings: readAll(measurements), events, measurements, now }),
      heat: activityHeatmap(mineAll, now),
      week: weeklyChallenge(mineAll, now),
      shields: shieldsFor(streak),
      pass: passProgress(coins),
      drop: dropAvailable(mineAll, now),
      milestones: milestonesFor(streak, mineAll),
      badges: badgesFor(mineAll, streak),
    }
  }, [events, measurements, crewId, crew.length, now])

  async function log(kind: GameEvent['kind'], detail: string | undefined, message: string) {
    await addEvent({ id: crypto.randomUUID(), crewId, timestamp: new Date().toISOString(), kind, ...(detail ? { detail } : {}) })
    setToast(message)
    refresh()
  }

  if (!view) return <main className="mx-auto w-full max-w-[1440px] px-4 pb-10 pt-8 text-muted sm:px-8">Loading progress…</main>

  const earnedBadges = view.badges.filter((b) => b.earned).length
  const stats = [
    { k: 'Coins', v: String(view.coins), icon: <CoinIcon size={16} /> },
    { k: 'Streak', v: `${view.streak}`, icon: <FlameIcon size={15} /> },
    { k: 'Badges', v: `${earnedBadges} / ${view.badges.length}`, icon: <Icon name="shield" size={15} /> },
  ]

  return (
    <main className="mx-auto w-full max-w-[1440px] px-4 pb-10 pt-8 sm:px-8">
      {/* ---- Level header ---------------------------------------------------- */}
      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-6 p-6">
          {currentCrew && <Avatar crew={currentCrew} size={92} level={view.level.level} />}
          <div className="min-w-0 flex-1">
            <p className="label">
              Level {view.level.level} · {view.level.title} &middot; {currentCrew?.role}
            </p>
            <h1 className="display mt-1 text-4xl sm:text-5xl">{currentCrew?.name}</h1>

            <div className="mt-4 max-w-xl">
              <div className="flex items-baseline justify-between gap-4 text-[0.9375rem]">
                <span className="font-semibold">
                  {view.level.into} / {view.level.span}
                </span>
                <span className="text-muted">
                  {view.level.toNext === null ? 'Top rank reached' : `${view.level.toNext} to level ${view.level.level + 1}`}
                </span>
              </div>
              <div className="meter mt-2" style={{ height: 12 }}>
                <span style={{ width: `${view.level.pct * 100}%`, background: 'var(--color-ink)' }} />
              </div>
            </div>
          </div>

          <dl className="flex gap-x-8 gap-y-3">
            {stats.map((s) => (
              <div key={s.k}>
                <dt className="label flex items-center gap-1.5">
                  {s.icon}
                  {s.k}
                </dt>
                <dd className="value mt-1" style={{ fontSize: '2rem' }}>
                  {s.v}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <p className="mt-5 max-w-3xl text-lg leading-relaxed text-ink-soft">
        Coins reward what you <em>do</em>: checking in on a bad day, reporting a symptom early, exercising, retaking a reading we could not
        trust. They never depend on your health numbers, and nobody is ranked against anyone else.
      </p>

      {/* ---- Today's plan ----------------------------------------------------- */}
      <section aria-labelledby="plan-heading" className="card mt-6 p-6">
        <h2 id="plan-heading" className="text-xl font-bold tracking-tight">
          Today&rsquo;s plan
        </h2>
        <ul className="mt-4 space-y-2">
          {view.plan.map((item) => (
            <PlanRow
              key={item.id}
              item={item}
              go={go}
              onConfirm={(i) => void log(i.kind, i.detail, `${i.title}: +${i.points} coins`)}
            />
          ))}
        </ul>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* ---- Proof of consistency ------------------------------------------- */}
        <section aria-labelledby="heat-heading" className="card p-6">
          <h2 id="heat-heading" className="text-xl font-bold tracking-tight">
            Proof of consistency
          </h2>
          <p className="mt-1 text-muted">Last 30 days · darker means more done</p>

          <ul className="mt-4 grid gap-1.5" style={{ gridTemplateColumns: 'repeat(10, minmax(0, 1fr))' }}>
            {view.heat.map((d) => (
              <li
                key={d.day}
                title={`${d.day}: ${d.count} credited`}
                className="aspect-square rounded-md"
                style={{
                  background:
                    d.count === 0
                      ? 'var(--color-paper-deep)'
                      : `color-mix(in srgb, var(--color-ok) ${Math.min(100, 30 + d.count * 22)}%, var(--color-panel))`,
                }}
              />
            ))}
          </ul>

          <div className="mt-5 rounded-2xl p-4" style={{ background: 'var(--color-panel-2)' }}>
            <p className="font-bold">Weekly challenge</p>
            <p className="text-[0.9375rem] text-muted">Check in 6 of 7 days</p>
            <div className="mt-2 flex items-center justify-between gap-4">
              <span className="font-semibold">
                {view.week.days} of {view.week.target} days
              </span>
              <span className="pill" style={{ background: view.week.met ? 'var(--color-ok-wash)' : 'var(--color-paper-deep)', color: view.week.met ? 'var(--color-ok-ink)' : undefined }}>
                {view.week.met ? 'Complete' : `+${view.week.reward} coins`}
              </span>
            </div>
            <div className="meter mt-2">
              <span style={{ width: `${Math.min(100, (view.week.days / view.week.target) * 100)}%`, background: 'var(--color-ink)' }} />
            </div>
          </div>

          <div className="mt-3 flex items-start gap-3 rounded-2xl p-4" style={{ background: 'var(--color-panel-2)' }}>
            <Icon name="shield" size={20} className="mt-0.5" />
            <p className="text-[0.9375rem] leading-relaxed">
              <span className="font-bold">
                {view.shields} streak shield{view.shields === 1 ? '' : 's'}
              </span>
              <br />
              <span className="text-muted">A shield covers one missed day so the streak survives. Earn one every 7 days in a row.</span>
            </p>
          </div>
        </section>

        {/* ---- Mission pass ---------------------------------------------------- */}
        <section aria-labelledby="pass-heading" className="card p-6">
          <p className="label">Season 1 · Mars transit</p>
          <h2 id="pass-heading" className="mt-1 text-xl font-bold tracking-tight">
            Mission pass
          </h2>
          <p className="mt-1 text-muted">
            Tier {view.pass.tier.n} of {PASS_TIERS.length}
            {view.pass.toNext !== null && ` · ${view.pass.toNext} coins to tier ${view.pass.tier.n + 1}`}
          </p>

          <ol className="no-bar mt-4 flex gap-2 overflow-x-auto pb-1">
            {PASS_TIERS.map((t) => {
              const reached = view.coins >= t.at
              return (
                <li
                  key={t.n}
                  className="flex w-24 shrink-0 flex-col items-center gap-1.5 rounded-2xl p-3 text-center"
                  style={{ background: reached ? 'var(--color-accent-wash)' : 'var(--color-panel-2)' }}
                >
                  <span className="label font-semibold">Tier {t.n}</span>
                  <span
                    aria-hidden
                    className="grid h-9 w-9 place-items-center rounded-full"
                    style={reached ? { background: 'var(--color-ink)', color: 'var(--color-paper)' } : { background: 'var(--color-paper-deep)' }}
                  >
                    <Icon name={reached ? 'check' : 'spark'} size={16} />
                  </span>
                  <span className="text-sm leading-snug">{t.name}</span>
                  <span className="flex items-center gap-1 text-sm text-muted">
                    <CoinIcon size={11} />
                    {t.at}
                  </span>
                </li>
              )
            })}
          </ol>
          <p className="mt-3 text-sm text-muted">Tiers are cosmetic. Nothing behind them changes how the app measures anything.</p>

          {/* ---- Daily supply drop --------------------------------------------- */}
          <div className="mt-5 rounded-2xl p-4" style={{ background: 'var(--color-panel-2)' }}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-bold">Daily supply drop</p>
                <p className="text-[0.9375rem] text-muted">
                  {view.drop ? `+${POINTS.supplyDrop} coins` : `Next drop in ${hhmm(msToNextDay(now))}`}
                </p>
              </div>
              <button
                className="btn btn-primary btn-sm"
                disabled={!view.drop}
                onClick={() => void log('supplyDrop', undefined, `Supply drop: +${POINTS.supplyDrop} coins`)}
              >
                {view.drop ? 'Open the crate' : 'Opened today'}
              </button>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted">One free crate a day, just for opening the console.</p>
          </div>
        </section>
      </div>

      {/* ---- Streak rewards --------------------------------------------------- */}
      <section aria-labelledby="streak-heading" className="card mt-6 p-6">
        <h2 id="streak-heading" className="text-xl font-bold tracking-tight">
          Streak rewards
        </h2>
        <p className="mt-1 text-muted">A missed day resets the streak, never your coins</p>

        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {view.milestones.map((m: Milestone) => (
            <li
              key={m.days}
              className="flex flex-col gap-2 rounded-2xl p-4"
              style={{ background: m.claimed ? 'var(--color-ok-wash)' : 'var(--color-panel-2)' }}
            >
              <span className="flex items-center gap-2">
                <FlameIcon size={15} />
                <span className="font-bold">{m.days} days</span>
              </span>
              <span className="text-[0.9375rem] text-muted">{m.label}</span>
              {m.claimed ? (
                <span className="font-semibold" style={{ color: 'var(--color-ok-ink)' }}>
                  Claimed
                </span>
              ) : (
                <button
                  className="btn btn-primary btn-sm"
                  disabled={!m.reached}
                  onClick={() => void log('streakMilestone', m.detail, `${m.days} day streak: +${m.coins} coins`)}
                >
                  {m.reached ? `Claim +${m.coins}` : `${m.days - view.streak} days to go`}
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* ---- Badges ------------------------------------------------------------ */}
      <section aria-labelledby="badges-heading" className="card mt-6 p-6">
        <h2 id="badges-heading" className="text-xl font-bold tracking-tight">
          Badges
        </h2>
        <p className="mt-1 text-muted">For things you did, never for a number</p>

        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {view.badges.map((b) => (
            <li
              key={b.id}
              className="flex items-start gap-3 rounded-2xl p-4"
              style={{ background: b.earned ? 'var(--color-accent-wash)' : 'var(--color-panel-2)', opacity: b.earned ? 1 : 0.6 }}
            >
              <span
                aria-hidden
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full"
                style={b.earned ? { background: 'var(--color-ink)', color: 'var(--color-paper)' } : { background: 'var(--color-paper-deep)' }}
              >
                <Icon name={b.earned ? 'check' : 'spark'} size={17} />
              </span>
              <span className="min-w-0">
                <span className="block font-bold">{b.name}</span>
                <span className="block text-sm leading-snug text-muted">{b.desc}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* ---- Crew goal, systems and the ledger --------------------------------- */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <CrewGoal progress={view.progress} />

          <section aria-labelledby="systems-heading" className="card p-6">
            <h2 id="systems-heading" className="text-xl font-bold tracking-tight">
              Ship systems
            </h2>
            <p className="mt-1 text-muted">Systems come online as the crew&rsquo;s total coins grow.</p>
            <ul className="mt-4 space-y-2">
              {view.systems.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-4 rounded-2xl p-3" style={{ background: 'var(--color-panel-2)' }}>
                  <span className="font-semibold">{s.name}</span>
                  {s.online ? (
                    <span className="pill" style={{ background: 'var(--color-ok-wash)', color: 'var(--color-ok-ink)' }}>
                      Online
                    </span>
                  ) : (
                    <span className="text-[0.9375rem] text-muted">needs {s.threshold - view.progress.totalPoints} more</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section aria-labelledby="credit-heading" className="card p-6">
          <h2 id="credit-heading" className="text-xl font-bold tracking-tight">
            How coins are earned
          </h2>
          <p className="mt-1 leading-relaxed text-muted">
            Only for showing up and being honest. A bad day logged pays the same as a good one, so nobody has a reason to hide it.
          </p>

          <ul className="mt-4 space-y-1.5">
            {(Object.keys(POINTS) as (keyof typeof POINTS)[]).map((kind) => (
              <li key={kind} className="flex items-center justify-between gap-4 text-[0.9375rem]">
                <span>{EVENT_LABEL[kind]}</span>
                <span className="flex items-center gap-1.5 font-bold">
                  <CoinIcon size={13} />+{POINTS[kind]}
                </span>
              </li>
            ))}
          </ul>

          <h3 className="mt-6 font-bold">Recent credit</h3>
          {view.recent.length === 0 ? (
            <p className="mt-2 text-muted">Nothing credited yet. Your first check-in starts the ledger.</p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {view.recent.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-4 text-[0.9375rem]">
                  <span>{EVENT_LABEL[e.kind]}</span>
                  <span className="text-muted">
                    {new Date(e.timestamp).toLocaleDateString()} · +{POINTS[e.kind]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-28 z-30 flex justify-center px-4">
        {toast && (
          <p
            key={toast}
            className="animate-rise pointer-events-auto rounded-full px-5 py-3 font-bold shadow-lg"
            style={{ background: 'var(--color-ink)', color: 'var(--color-paper)' }}
            onAnimationEnd={() => setTimeout(() => setToast(null), 2200)}
          >
            {toast}
          </p>
        )}
      </div>
    </main>
  )
}
