import { useEffect, useState } from 'react'
import { Avatar } from '../components/kit/Avatar'
import { Icon, type IconName } from '../components/kit/Icon'
import { useCrewGame } from '../components/kit/useCrewGame'
import { CoinIcon } from '../components/kit/Wallet'
import { listEvents } from '../db/repo'
import { getGear, type Gear } from '../lib/gear'
import { SYSTEMS, WEEKLY_GOAL_PER_CREW, pointsInWindow, systemsStatus } from '../lib/scoring'
import { useApp, type Screen } from '../state/AppContext'

const CHIPS = ['NASA Space Apps Challenge 2026', 'Runs offline · No upload']

const STEPS: { n: string; title: string; body: string; cta: string; screen: Screen; icon: IconName }[] = [
  {
    n: '01',
    title: 'Mirror check',
    body: 'Thirty seconds of camera for pulse and eyelids, then four short questions. Bad light? It refuses to guess.',
    cta: 'Set up and start',
    screen: 'onboarding',
    icon: 'eye',
  },
  {
    n: '02',
    title: 'Body tour',
    body: 'Zoom through every region against your own 30-day normal.',
    cta: 'Open the console',
    screen: 'bodymap',
    icon: 'body',
  },
  {
    n: '03',
    title: 'Who to tell',
    body: 'Four rungs from self-care to flight surgeon, with a ground packet and a comm-delay countdown.',
    cta: 'See the ladder',
    screen: 'escalation',
    icon: 'send',
  },
  {
    n: '04',
    title: 'Earn the gear',
    body: 'Streaks, daily crates, a mission pass and a locker of visors, suits and patches.',
    cta: 'Open rewards',
    screen: 'progress',
    icon: 'spark',
  },
]

const PERKS: { t: string; icon: IconName }[] = [
  { t: 'Daily supply crate for opening the console', icon: 'shield' },
  { t: 'Streak rewards at 3, 7, 14 and 30 days', icon: 'flame' },
  { t: 'A 10-tier mission pass each season', icon: 'spark' },
  { t: 'Badges for honest reporting, never for numbers', icon: 'check' },
]

const FAQ: [string, string][] = [
  [
    'What does gray mean?',
    'Not enough good data. A reading that failed the quality check is never colored, and a region with no passing reading stays gray.',
  ],
  [
    'What is each reading compared with?',
    'That person’s own baseline: the spread of their earlier readings that passed quality. Watch and act mean it moved away from their own normal. These are not clinical thresholds.',
  ],
  ['Does my camera video leave the device?', 'No. Camera frames never leave the browser, and nothing is uploaded.'],
  ['Does it work without a connection?', 'Yes. It runs offline after first load.'],
  ['What do coins reward?', 'Doing the check, logging, and reporting honestly. Never the health values themselves.'],
  ['Is this a medical device?', 'No. Prototype. Not a medical device.'],
]

/** The locker preview: the same cosmetic kit the setup screen offers, shown as collectables. */
const SHOWCASE: { name: string; price: number; gear: Partial<Gear> }[] = [
  { name: 'Gold visor', price: 120, gear: { visor: 'gold' } },
  { name: 'Clear visor', price: 80, gear: { visor: 'clear' } },
  { name: 'Graphite suit', price: 150, gear: { suit: 'graphite' } },
  { name: 'Sand suit', price: 150, gear: { suit: 'sand' } },
  { name: 'Standard visor', price: 0, gear: { visor: 'standard' } },
  { name: 'White suit', price: 0, gear: { suit: 'white' } },
]

/** A decorative ECG trace, built so the rhythm stays even at any width. */
function ecgPath(cycles: number, w: number, mid: number): string {
  let d = `M0 ${mid}`
  for (let i = 0; i < cycles; i++) {
    const x = i * w
    d += ` H${x + w * 0.34} L${x + w * 0.4} ${mid - 6} L${x + w * 0.46} ${mid + 4} L${x + w * 0.52} ${mid - 26} L${x + w * 0.58} ${mid + 18} L${x + w * 0.64} ${mid} H${x + w}`
  }
  return d
}

export function Landing() {
  const { go, crew, crewId, setCrewId, currentCrew, resetDemo, dataVersion } = useApp()
  const game = useCrewGame(crewId, dataVersion)
  const [hot, setHot] = useState(-1)
  const [faq, setFaq] = useState(0)
  const [crewWeek, setCrewWeek] = useState(0)
  const myGear = getGear()

  useEffect(() => {
    let cancelled = false
    void Promise.all(crew.map((c) => listEvents(c.id))).then((all) => {
      if (cancelled) return
      const now = new Date()
      setCrewWeek(all.reduce((sum, e) => sum + pointsInWindow(e, now, 7), 0))
    })
    return () => {
      cancelled = true
    }
  }, [crew, dataVersion])

  const goalPct = Math.round(Math.min(1, crewWeek / (WEEKLY_GOAL_PER_CREW * Math.max(1, crew.length))) * 100)
  const online = systemsStatus(game.coins).filter((s) => s.online).length
  const others = crew.filter((c) => c.id !== crewId)

  const heroStats = [
    { k: 'Daily check', v: '30 s' },
    { k: 'Crew goal this week', v: `${goalPct}%` },
    { k: 'Ship systems online', v: `${online} / ${SYSTEMS.length}` },
  ]

  const heroChips = [
    { k: 'Streak', v: `${game.streak} days`, color: '#ffb066' },
    { k: 'Coins', v: game.coins.toLocaleString(), color: '#f6c445' },
    { k: 'Rank', v: `${game.level.title} · Lv ${game.level.level}`, color: '#f3f1ea' },
  ]

  return (
    <main
      className="mx-auto flex w-full max-w-[1440px] flex-col gap-7 pb-20 pt-7"
      style={{ paddingLeft: 'clamp(16px, 3vw, 32px)', paddingRight: 'clamp(16px, 3vw, 32px)' }}
    >
      {/* ---- Hero -------------------------------------------------------- */}
      <section className="flex flex-wrap items-stretch gap-6">
        <div className="flex flex-col justify-center gap-5" style={{ flex: '1.35 1 520px' }}>
          <p className="animate-rise m-0 flex flex-wrap gap-2">
            {CHIPS.map((c) => (
              <span
                key={c}
                className="whitespace-nowrap rounded-full border border-rule bg-panel px-3 py-1.5 text-[13px] font-semibold"
              >
                {c}
              </span>
            ))}
          </p>

          <h1
            className="animate-rise m-0"
            style={{ fontSize: 'clamp(48px, 7.4vw, 104px)', lineHeight: 0.88, fontWeight: 800, letterSpacing: '-0.06em', animationDelay: '80ms' }}
          >
            Thirty seconds
            <br />
            a day keeps
            <br />
            the crew flying.
          </h1>

          <p
            className="animate-rise m-0 text-ink-soft"
            style={{ maxWidth: '54ch', fontSize: 'clamp(17px, 1.5vw, 20px)', lineHeight: 1.55, animationDelay: '160ms' }}
          >
            On a long mission there is no clinic down the hall. This app reads what it can from your webcam, compares it with your own
            baseline, and tells you when to escalate &mdash; and when it cannot get a clean reading, it says so instead of guessing.
          </p>

          <div className="animate-rise flex flex-wrap gap-3" style={{ animationDelay: '240ms' }}>
            <button onClick={() => go('mirror')} className="btn btn-primary btn-lg">
              <Icon name="eye" size={18} />
              Take the mirror check
            </button>
            <button onClick={() => go('bodymap')} className="btn btn-secondary btn-lg">
              <Icon name="body" size={18} />
              Explore the crew dashboard
            </button>
          </div>

          <dl className="animate-rise m-0 mt-1.5 flex flex-wrap gap-x-7 gap-y-2.5" style={{ animationDelay: '320ms' }}>
            {heroStats.map((h) => (
              <div key={h.k}>
                <dt className="text-[13px] text-muted">{h.k}</dt>
                <dd className="m-0 mt-0.5" style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.04em' }}>
                  {h.v}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* The crew, in orbit. Decorative motion only; the labels below carry the facts. */}
        <div
          className="animate-rise relative overflow-hidden"
          style={{
            flex: '1 1 380px',
            minHeight: 520,
            borderRadius: 36,
            background: 'radial-gradient(120% 90% at 50% 0%, #1f2530, #0b0d11 70%)',
            color: '#f3f1ea',
            animationDelay: '160ms',
          }}
        >
          <span
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(1px 1px at 12% 18%, #fff, transparent), radial-gradient(1px 1px at 72% 12%, #fff, transparent), radial-gradient(1.5px 1.5px at 86% 56%, #fff, transparent), radial-gradient(1px 1px at 28% 72%, #fff, transparent), radial-gradient(1px 1px at 54% 88%, #fff, transparent)',
              opacity: 0.7,
            }}
          />

          <div
            className="orbit absolute"
            style={{
              left: '50%',
              top: '46%',
              width: 340,
              height: 340,
              margin: '-170px 0 0 -170px',
              borderRadius: 999,
              border: '1px dashed rgb(243 241 234 / 0.18)',
            }}
          >
            {others.map((c, i) => {
              const a = (i / Math.max(1, others.length)) * Math.PI * 2 - Math.PI / 2
              return (
                <span
                  key={c.id}
                  className="absolute"
                  style={{ left: `${50 + Math.cos(a) * 50}%`, top: `${50 + Math.sin(a) * 50}%`, transform: 'translate(-50%, -50%)' }}
                >
                  <span className="orbit-counter block">
                    <button onClick={() => setCrewId(c.id)} title={c.name} className="rounded-full transition-transform hover:scale-110">
                      <Avatar crew={c} size={52} ring="rgb(243 241 234 / 0.4)" />
                      <span className="sr-only">{c.name}</span>
                    </button>
                  </span>
                </span>
              )
            })}
          </div>

          <div className="absolute" style={{ left: '50%', top: '46%', transform: 'translate(-50%, -50%)' }}>
            <div className="float-slow">{currentCrew && <Avatar crew={currentCrew} size={116} level={game.level.level} gear={myGear} />}</div>
          </div>

          <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2">
            {heroChips.map((c) => (
              <span
                key={c.k}
                className="flex flex-col gap-0.5 px-3.5 py-3"
                style={{ flex: '1 1 100px', borderRadius: 18, background: 'rgb(243 241 234 / 0.08)', backdropFilter: 'blur(8px)' }}
              >
                <span className="whitespace-nowrap text-[12.5px] opacity-70">{c.k}</span>
                <span className="whitespace-nowrap" style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', color: c.color }}>
                  {c.v}
                </span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Four doors ---------------------------------------------------- */}
      <section
        className="border border-rule bg-panel"
        style={{ padding: 'clamp(24px, 4vw, 44px)', borderRadius: 32 }}
      >
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
          <h2
            className="m-0"
            style={{ maxWidth: '18ch', fontSize: 'clamp(32px, 4vw, 52px)', lineHeight: 0.98, fontWeight: 800, letterSpacing: '-0.05em' }}
          >
            Check in. See what moved. Earn the gear.
          </h2>
          <p className="m-0 text-muted" style={{ maxWidth: '42ch', fontSize: 15.5, lineHeight: 1.55 }}>
            Coins reward showing up and being honest. A bad day logged pays the same as a good one, so nobody ever has a reason to hide one.
          </p>
        </div>

        <ol
          className="m-0 mt-8 grid list-none gap-3.5 p-0"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 230px), 1fr))' }}
          onMouseLeave={() => setHot(-1)}
        >
          {STEPS.map((s, i) => {
            const h = hot === i
            return (
              <li key={s.n}>
                <button
                  onMouseEnter={() => setHot(i)}
                  onFocus={() => setHot(i)}
                  onClick={() => go(s.screen)}
                  className="flex h-full w-full flex-col gap-3.5 p-5 text-left transition-transform"
                  style={{
                    borderRadius: 26,
                    background: h ? '#14181f' : 'var(--color-panel-2)',
                    color: h ? '#f3f1ea' : 'var(--color-ink)',
                    transform: h ? 'translateY(-6px)' : 'none',
                  }}
                >
                  <span className="flex items-center justify-between">
                    <span
                      aria-hidden
                      className="grid place-items-center"
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 16,
                        background: h ? '#f6c445' : '#14181f',
                        color: h ? '#3b2a00' : '#f3f1ea',
                        transform: 'rotate(-5deg)',
                      }}
                    >
                      <Icon name={s.icon} size={22} />
                    </span>
                    <span className="text-[13px] font-bold opacity-60">{s.n}</span>
                  </span>
                  <span style={{ fontSize: 22, fontWeight: 750, letterSpacing: '-0.025em' }}>{s.title}</span>
                  <span className="opacity-[0.78]" style={{ fontSize: 14.5, lineHeight: 1.5 }}>
                    {s.body}
                  </span>
                  <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-bold">
                    {s.cta}
                    <Icon name="arrowRight" size={15} className={h ? 'translate-x-1 transition-transform' : 'transition-transform'} />
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </section>

      {/* ---- Rewards and the locker ----------------------------------------- */}
      <section className="flex flex-wrap items-stretch gap-6">
        <div
          className="flex flex-col justify-center gap-4"
          style={{ flex: '1 1 360px', padding: 'clamp(24px, 4vw, 40px)', borderRadius: 32, background: '#14181f', color: '#f3f1ea' }}
        >
          <p className="m-0 text-sm opacity-70">Rewards</p>
          <h2 className="m-0" style={{ fontSize: 'clamp(30px, 3.6vw, 46px)', lineHeight: 1, fontWeight: 800, letterSpacing: '-0.045em' }}>
            Streaks, crates and a locker full of gear.
          </h2>
          <ul className="m-0 mt-1.5 flex list-none flex-col gap-2.5 p-0">
            {PERKS.map((p) => (
              <li key={p.t} className="flex items-center gap-3 text-[15px]">
                <span
                  aria-hidden
                  className="grid shrink-0 place-items-center"
                  style={{ width: 34, height: 34, borderRadius: 11, background: 'rgb(246 196 69 / 0.16)', color: '#f6c445' }}
                >
                  <Icon name={p.icon} size={17} />
                </span>
                {p.t}
              </li>
            ))}
          </ul>
          <button
            onClick={() => go('progress')}
            className="mt-2 inline-flex items-center gap-2 self-start font-bold"
            style={{ minHeight: 52, padding: '0 22px', borderRadius: 16, background: '#f6c445', color: '#3b2a00' }}
          >
            Open the locker
            <Icon name="arrowRight" size={16} />
          </button>
        </div>

        <ul
          className="m-0 grid list-none gap-3 p-0"
          style={{ flex: '1.3 1 460px', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}
        >
          {SHOWCASE.map((it) => (
            <li
              key={it.name}
              className="flex flex-col items-center gap-2.5 border border-rule bg-panel pb-3.5 pt-4"
              style={{ borderRadius: 24, paddingLeft: 12, paddingRight: 12 }}
            >
              <span className="grid w-full place-items-center" style={{ height: 96, borderRadius: 18, background: 'var(--color-panel-2)' }}>
                {currentCrew && <Avatar crew={currentCrew} size={72} gear={{ ...myGear, ...it.gear }} />}
              </span>
              <span className="text-center text-sm font-bold">{it.name}</span>
              <span className="inline-flex items-center gap-1 text-[13px] font-bold" style={{ color: 'var(--color-watch-ink)' }}>
                <CoinIcon size={13} />
                {it.price === 0 ? 'Owned' : it.price}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* ---- FAQ -------------------------------------------------------------- */}
      <section
        className="flex flex-wrap gap-x-12 gap-y-6 border border-rule bg-panel"
        style={{ padding: 'clamp(24px, 4vw, 44px)', borderRadius: 32 }}
      >
        <div style={{ flex: '1 1 280px' }}>
          <h2 className="m-0" style={{ fontSize: 'clamp(30px, 3.6vw, 46px)', lineHeight: 1, fontWeight: 800, letterSpacing: '-0.045em' }}>
            What it does, and what it won&rsquo;t.
          </h2>
        </div>
        <div style={{ flex: '2 1 480px' }}>
          {FAQ.map(([q, a], i) => {
            const open = faq === i
            return (
              <div key={q} className="border-b border-rule">
                <button
                  onClick={() => setFaq(open ? -1 : i)}
                  aria-expanded={open}
                  className="grid w-full items-center gap-4 py-3.5 text-left"
                  style={{ gridTemplateColumns: 'minmax(0, 1fr) 36px', minHeight: 68, fontSize: 17, fontWeight: 650 }}
                >
                  {q}
                  <span
                    aria-hidden
                    className="grid place-items-center"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 999,
                      background: open ? '#14181f' : 'var(--color-paper-deep)',
                      color: open ? '#f3f1ea' : 'var(--color-ink)',
                      transform: open ? 'rotate(45deg)' : 'none',
                      transition: 'transform 300ms cubic-bezier(.34,1.56,.64,1)',
                    }}
                  >
                    <Icon name="plus" size={17} />
                  </span>
                </button>
                {open && (
                  <p className="animate-rise m-0 pb-5 pr-12 text-ink-soft" style={{ maxWidth: '64ch', fontSize: 16, lineHeight: 1.6 }}>
                    {a}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* ---- Closing band ------------------------------------------------------ */}
      <section
        className="relative flex flex-wrap items-center justify-between gap-6 overflow-hidden"
        style={{ padding: 'clamp(28px, 5vw, 56px) clamp(28px, 5vw, 56px) 84px', borderRadius: 32, background: '#14181f', color: '#f3f1ea' }}
      >
        <svg aria-hidden viewBox="0 0 1200 80" preserveAspectRatio="none" className="absolute bottom-3.5 left-0 right-0 h-11 w-full opacity-35">
          <path className="trace" pathLength={1000} style={{ ['--len' as string]: 1000 }} d={ecgPath(6, 200, 40)} fill="none" stroke="#f6c445" strokeWidth={2} vectorEffect="non-scaling-stroke" />
        </svg>

        <div className="relative" style={{ maxWidth: '24ch' }}>
          <h2 className="m-0" style={{ fontSize: 'clamp(30px, 3.6vw, 46px)', lineHeight: 1, fontWeight: 800, letterSpacing: '-0.045em' }}>
            Ready when you are.
          </h2>
          <p className="m-0 mt-3 opacity-75" style={{ fontSize: 16, lineHeight: 1.55 }}>
            No account, no upload, nothing to install. Set up takes a minute and the first check takes thirty seconds.
          </p>
        </div>

        <div className="relative flex flex-wrap gap-3">
          <button
            onClick={() => go('onboarding')}
            className="inline-flex items-center gap-2 font-bold"
            style={{ minHeight: 58, padding: '0 26px', borderRadius: 18, background: '#f6c445', color: '#3b2a00' }}
          >
            Set up in a minute
            <Icon name="arrowRight" size={17} />
          </button>
          <button
            onClick={() => void resetDemo()}
            className="inline-flex items-center gap-2 font-semibold"
            style={{ minHeight: 58, padding: '0 24px', borderRadius: 18, background: 'rgb(243 241 234 / 0.1)', color: '#f3f1ea' }}
          >
            Reset demo data
          </button>
        </div>
      </section>
    </main>
  )
}
