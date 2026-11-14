import { Avatar } from '../components/kit/Avatar'
import { Starfield } from '../components/kit/Chrome'
import { Icon, type IconName } from '../components/kit/Icon'
import { useCrewGame } from '../components/kit/useCrewGame'
import { CoinIcon, FlameIcon } from '../components/kit/Wallet'
import { useApp, type Screen } from '../state/AppContext'

const CHIPS = ['NASA Space Apps Challenge 2026', 'Runs offline · No upload']

const FACTS: { value: string; label: string }[] = [
  { value: '30 s', label: 'One check, start to finish' },
  { value: '6', label: 'Body regions, each on its own baseline' },
  { value: '0', label: 'Frames or readings that leave this browser' },
]

const DOORS: { n: string; title: string; body: string; cta: string; screen: Screen; icon: IconName }[] = [
  {
    n: '01',
    title: 'Mirror check',
    body: 'Thirty seconds in front of the camera reads pulse and eyelid movement, then four short questions. If the light or the motion is wrong, it refuses to guess.',
    cta: 'Start the check',
    screen: 'mirror',
    icon: 'eye',
  },
  {
    n: '02',
    title: 'Crew console',
    body: 'Every indicator against that person’s own 30-day baseline, on one body map. Within baseline, watch, act — and gray when no reading passed the quality check.',
    cta: 'Open the console',
    screen: 'bodymap',
    icon: 'body',
  },
  {
    n: '03',
    title: 'Escalation',
    body: 'Four plain-language rungs from self-care to flight surgeon, with a packet small enough to cross a twenty-minute gap and a countdown while it does.',
    cta: 'See the ladder',
    screen: 'escalation',
    icon: 'send',
  },
]

/** Even spacing around a circle, starting at the top. */
const orbitAt = (i: number, count: number, radius: number) => {
  const angle = (i / count) * Math.PI * 2 - Math.PI / 2
  return { left: `${50 + Math.cos(angle) * radius}%`, top: `${50 + Math.sin(angle) * radius}%` }
}

export function Landing() {
  const { go, crew, crewId, setCrewId, resetDemo, currentCrew, dataVersion } = useApp()
  const game = useCrewGame(crewId, dataVersion)

  return (
    <main className="mx-auto w-full max-w-[1440px] px-4 pb-16 pt-10 sm:px-8">
      <div className="grid items-start gap-12 lg:grid-cols-[1.25fr_1fr]">
        <section aria-labelledby="landing-heading" className="animate-rise">
          <ul className="flex flex-wrap gap-2">
            {CHIPS.map((c) => (
              <li key={c} className="pill" style={{ background: 'var(--color-panel)', border: '1px solid var(--color-rule)' }}>
                {c}
              </li>
            ))}
          </ul>

          <h1 id="landing-heading" className="display mt-7" style={{ fontSize: 'var(--text-hero)' }}>
            Thirty seconds a day
            <br />
            keeps the crew flying.
          </h1>

          <p className="mt-7 max-w-2xl text-lg leading-relaxed text-ink-soft">
            On a long mission there is no clinic down the hall. This app reads what it can from your webcam, compares it with your own
            baseline, and tells you when to escalate &mdash; and when it cannot get a clean reading, it says so instead of guessing.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button onClick={() => go('mirror')} className="btn btn-primary">
              <Icon name="eye" size={17} />
              Start the mirror check
            </button>
            <button onClick={() => go('bodymap')} className="btn btn-secondary">
              Explore the crew console
            </button>
          </div>

          <dl className="mt-12 grid gap-x-10 gap-y-6 sm:grid-cols-3">
            {FACTS.map((f) => (
              <div key={f.label}>
                <dt className="value" style={{ fontSize: '2.25rem' }}>
                  {f.value}
                </dt>
                <dd className="mt-1.5 text-sm leading-snug text-muted">{f.label}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ---- The crew dock: who is aboard, and how they are doing on effort ---- */}
        <section aria-label="Crew" className="animate-rise" style={{ animationDelay: '120ms' }}>
          <div
            className="relative overflow-hidden"
            style={{ borderRadius: 'var(--r-panel)', background: '#0b1018', minHeight: 360, color: '#f3f1ea' }}
          >
            <div style={{ ['--star-o' as string]: 1 }}>
              <Starfield seed={21} count={90} />
            </div>

            <div aria-hidden className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ width: '62%', paddingBottom: '62%', border: '1px dashed rgb(243 241 234 / 0.18)' }} />

            {crew.map((c, i) => {
              const active = c.id === crewId
              const pos = orbitAt(i, crew.length, 31)
              return (
                <button
                  key={c.id}
                  onClick={() => setCrewId(c.id)}
                  aria-pressed={active}
                  title={c.name}
                  className="absolute -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-110"
                  style={{ ...pos, zIndex: active ? 2 : 1 }}
                >
                  <Avatar crew={c} size={active ? 92 : 54} ring={active ? 'var(--color-coin)' : 'rgb(243 241 234 / 0.35)'} />
                  <span className="sr-only">{c.name}</span>
                </button>
              )
            })}

            <p className="absolute inset-x-0 bottom-4 text-center text-sm" style={{ color: 'rgb(243 241 234 / 0.65)' }}>
              Acting as <span className="font-semibold" style={{ color: '#f3f1ea' }}>{currentCrew?.name}</span> · select anyone
            </p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="card p-4">
              <p className="label flex items-center gap-1.5">
                <FlameIcon size={14} />
                Streak
              </p>
              <p className="value mt-1.5" style={{ fontSize: '2rem' }}>
                {game.streak}
                <span className="value-unit"> days</span>
              </p>
            </div>
            <div className="card p-4">
              <p className="label flex items-center gap-1.5">
                <CoinIcon size={14} />
                Coins
              </p>
              <p className="value mt-1.5" style={{ fontSize: '2rem' }}>
                {game.coins}
              </p>
            </div>
          </div>

          <div className="card mt-3 flex flex-wrap items-center justify-between gap-3 p-4">
            <p className="text-sm text-muted">
              No login. Your own check-ins save to the guest profile, on this device only.
            </p>
            <div className="flex flex-wrap gap-4">
              <button onClick={() => void resetDemo()} className="btn-quiet">
                Reset demo data
              </button>
              {/* Ronav's demo control panel, also on Shift+D. */}
              <button onClick={() => window.dispatchEvent(new Event('demo:toggle'))} className="btn-quiet">
                Demo controls
              </button>
            </div>
          </div>
        </section>
      </div>

      <ol className="mt-16 grid gap-4 lg:grid-cols-3">
        {DOORS.map((d, i) => (
          <li key={d.n}>
            <button
              onClick={() => go(d.screen)}
              className="card card-action animate-rise flex h-full flex-col p-6"
              style={{ animationDelay: `${180 + i * 90}ms` }}
            >
              <div className="flex items-center justify-between gap-3">
                <span aria-hidden className="grid h-11 w-11 place-items-center rounded-2xl" style={{ background: 'var(--color-paper-deep)' }}>
                  <Icon name={d.icon} size={20} />
                </span>
                <span className="label font-semibold">{d.n}</span>
              </div>
              <h2 className="mt-4 text-xl font-bold tracking-tight">{d.title}</h2>
              <p className="mt-2 flex-1 text-[0.9375rem] leading-relaxed text-muted">{d.body}</p>
              <span className="btn-quiet mt-4">
                {d.cta}
                <Icon name="arrowRight" size={15} />
              </span>
            </button>
          </li>
        ))}
      </ol>
    </main>
  )
}
