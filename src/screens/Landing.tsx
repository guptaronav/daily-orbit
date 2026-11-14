import { BodyFigure } from '../components/BodyFigure'
import { Starfield, ThemeToggle } from '../components/kit/Chrome'
import { Icon, type IconName } from '../components/kit/Icon'
import { Panel } from '../components/kit/Panel'
import { btnPrimary, btnSecondary, linkBtn } from '../components/ui'
import { APP_NAME } from '../config/app'
import type { Status } from '../contract/types'
import { REGIONS, type RegionId } from '../lib/regions'
import { useApp, type Screen } from '../state/AppContext'

// Decorative silhouette in the brief panel: every region gray, nothing claimed, nothing clickable.
const BLANK = Object.fromEntries(REGIONS.map((r) => [r.id, 'gray' as Status])) as Record<RegionId, Status>

const FACTS = ['Runs offline after first load', 'Camera frames never leave the browser', 'No account, no upload']

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
    body: 'Every indicator against that person’s own 30-day baseline, on one body map. Green, watch, act — and gray when no reading passed the quality check.',
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

/** A decorative ECG trace. Built, not drawn by hand, so the rhythm stays even at any width. */
function ecgPath(cycles: number, cycleWidth: number, mid: number): string {
  let d = `M0 ${mid}`
  for (let i = 0; i < cycles; i++) {
    const x = i * cycleWidth
    d +=
      ` H${x + cycleWidth * 0.34}` +
      ` L${x + cycleWidth * 0.4} ${mid - 6}` +
      ` L${x + cycleWidth * 0.46} ${mid + 4}` +
      ` L${x + cycleWidth * 0.52} ${mid - 26}` +
      ` L${x + cycleWidth * 0.58} ${mid + 18}` +
      ` L${x + cycleWidth * 0.64} ${mid}` +
      ` H${x + cycleWidth}`
  }
  return d
}

export function Landing() {
  const { go, crew, crewId, setCrewId, resetDemo } = useApp()

  return (
    <main className="relative w-full overflow-hidden">
      <Starfield seed={11} count={120} />

      <div className="relative">
        <div className="border-b border-rule">
          <div className="mx-auto flex w-full max-w-[1400px] flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-8">
            <ul className="flex flex-wrap gap-x-6 gap-y-1">
              {FACTS.map((f) => (
                <li key={f} className="label">
                  {f}
                </li>
              ))}
            </ul>
            <ThemeToggle />
          </div>
        </div>

        <div className="gridded">
          <div className="mx-auto grid w-full max-w-[1400px] gap-10 px-4 py-14 sm:px-8 lg:grid-cols-[1.6fr_1fr] lg:py-20">
            <section aria-labelledby="landing-heading" className="animate-rise">
              <p className="label" style={{ color: 'var(--color-accent)' }}>
                NASA Space Apps Challenge 2026 &middot; health monitoring software
              </p>
              <h1
                id="landing-heading"
                className="mt-5 font-semibold leading-[0.92] tracking-tight"
                style={{ fontSize: 'var(--text-hero)', textShadow: '0 0 60px color-mix(in srgb, var(--color-accent) 22%, transparent)' }}
              >
                {APP_NAME}
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft sm:text-xl">
                On a long mission there is no clinic down the hall. This app reads what it can from your webcam, compares it with your own
                baseline, and tells you when to escalate &mdash; and when it cannot get a clean reading, it says so instead of guessing.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <button onClick={() => go('mirror')} className={btnPrimary}>
                  <Icon name="eye" size={16} />
                  Take the mirror check
                </button>
                <button onClick={() => go('bodymap')} className={btnSecondary}>
                  <Icon name="body" size={16} />
                  Explore the crew dashboard
                </button>
              </div>

              <div aria-hidden className="mt-12 h-20 w-full overflow-hidden">
                <svg viewBox="0 0 1200 80" preserveAspectRatio="none" className="h-full w-full">
                  <path
                    className="trace"
                    /* pathLength normalizes the dash maths, so the trace always draws exactly once. */
                    pathLength={1000}
                    style={{ ['--len' as string]: 1000 }}
                    d={ecgPath(6, 200, 40)}
                    fill="none"
                    stroke="var(--color-accent)"
                    strokeWidth={1.5}
                    strokeOpacity={0.7}
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
              </div>
            </section>

            <Panel label="Mission brief" className="animate-rise self-start" delay={120}>
              <div className="flex items-start justify-between gap-4 p-5">
                <div>
                  <h2 className="text-base font-semibold tracking-tight">Judge mode</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    No login. Pick who you are acting as. Your own check-ins are saved to the guest profile, on this device only.
                  </p>
                </div>
                <div aria-hidden className="w-14 shrink-0 opacity-30">
                  <BodyFigure statuses={BLANK} selected={null} onSelect={() => {}} interactive={false} className="w-full" />
                </div>
              </div>

              <div className="border-t border-rule p-5">
                <label className="block">
                  <span className="label">Acting as</span>
                  <select className="field mt-2" value={crewId} onChange={(e) => setCrewId(e.target.value)}>
                    {crew.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="mt-3">
                  <button onClick={() => void resetDemo()} className={linkBtn}>
                    Reset demo data
                  </button>
                </div>
              </div>
            </Panel>
          </div>
        </div>

        <div className="border-t border-rule">
          <ol className="mx-auto grid w-full max-w-[1400px] gap-5 px-4 py-10 sm:px-8 lg:grid-cols-3">
            {DOORS.map((d, i) => (
              <li key={d.n}>
                <button
                  onClick={() => go(d.screen)}
                  className="card card-action bracketed animate-rise flex h-full flex-col p-6"
                  style={{ animationDelay: `${180 + i * 90}ms` }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="label" style={{ color: 'var(--color-accent)' }}>
                      Door {d.n}
                    </span>
                    <Icon name={d.icon} size={22} className="text-muted" />
                  </div>
                  <h3 className="mt-4 text-xl font-semibold tracking-tight">{d.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{d.body}</p>
                  <span className="label mt-5 inline-flex items-center gap-2" style={{ color: 'var(--color-accent)' }}>
                    {d.cta}
                    <Icon name="arrowRight" size={14} />
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </main>
  )
}
