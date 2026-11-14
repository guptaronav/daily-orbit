import { BodyFigure } from '../components/BodyFigure'
import { btnPrimary, btnSecondary, linkBtn } from '../components/ui'
import { APP_NAME } from '../config/app'
import type { Status } from '../contract/types'
import { REGIONS, type RegionId } from '../lib/regions'
import { useApp } from '../state/AppContext'

// Decorative silhouette behind the hero: every region gray, nothing claimed, nothing clickable.
const BLANK = Object.fromEntries(REGIONS.map((r) => [r.id, 'gray' as Status])) as Record<RegionId, Status>

const FACTS = ['Runs offline after first load', 'Camera frames never leave the browser', 'Prototype, not a medical device']

const STEPS = [
  ['01', 'Mirror check', 'Thirty seconds in front of the camera reads pulse and eyelid movement, plus four short self-report questions.'],
  ['02', 'Your own baseline', 'Every reading is compared with your own 30-day history, not a population average. A reading we cannot trust is left gray.'],
  ['03', 'Escalation', 'Four plain-language rungs, from self-care to flight surgeon, with a small ground packet sized for a 20-minute delay.'],
] as const

export function Landing() {
  const { go, crew, crewId, setCrewId, resetDemo } = useApp()

  return (
    <main className="w-full">
      <div className="border-b border-rule bg-panel">
        <ul className="mx-auto flex w-full max-w-6xl flex-wrap gap-x-6 gap-y-1 px-4 py-2 sm:px-8">
          {FACTS.map((f) => (
            <li key={f} className="label">
              {f}
            </li>
          ))}
        </ul>
      </div>

      <div className="ruled">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:px-8 md:grid-cols-[1.55fr_1fr] md:py-20">
          <section aria-labelledby="landing-heading" className="relative">
            <p className="label" style={{ color: 'var(--color-accent)' }}>
              NASA Space Apps Challenge 2026 · Health monitoring software
            </p>
            <h1 id="landing-heading" className="mt-5 font-semibold leading-[0.95] tracking-tight" style={{ fontSize: 'var(--text-hero)' }}>
              {APP_NAME}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed sm:text-xl">
              On a long mission there is no clinic down the hall. This app reads what it can from your webcam, compares it with your own
              baseline, and tells you when to escalate — and when it cannot get a clean reading, it says so instead of guessing.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={() => go('mirror')} className={btnPrimary}>
                Take the mirror check
              </button>
              <button onClick={() => go('bodymap')} className={btnSecondary}>
                Explore the crew dashboard
              </button>
            </div>
          </section>

          <aside aria-label="Demo controls" className="panel self-start p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="label">Judge mode</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  No login. Choose who you are acting as. Your own check-ins are saved to the guest profile.
                </p>
              </div>
              <div aria-hidden className="w-16 shrink-0 opacity-25">
                <BodyFigure statuses={BLANK} selected={null} onSelect={() => {}} interactive={false} className="w-full" />
              </div>
            </div>
            <label className="mt-5 block">
              <span className="label">Acting as</span>
              <select className="field mt-1.5" value={crewId} onChange={(e) => setCrewId(e.target.value)}>
                {crew.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="mt-2">
              <button onClick={() => void resetDemo()} className={linkBtn}>
                Reset demo data
              </button>
            </div>
          </aside>
        </div>
      </div>

      <div className="border-t border-rule">
        <ol className="mx-auto grid w-full max-w-6xl gap-x-10 gap-y-8 px-4 py-10 sm:px-8 md:grid-cols-3">
          {STEPS.map(([n, title, body]) => (
            <li key={n} className="border-t-2 border-ink pt-4">
              <p className="label" style={{ color: 'var(--color-accent)' }}>
                {n}
              </p>
              <h3 className="mt-2 text-base font-semibold tracking-tight">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
            </li>
          ))}
        </ol>
      </div>
    </main>
  )
}
