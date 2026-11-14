import { APP_NAME } from '../config/app'
import { useApp } from '../state/AppContext'

export function Landing() {
  const { go, crew, crewId, setCrewId, resetDemo } = useApp()

  return (
    <main className="mx-auto grid w-full max-w-5xl gap-10 px-4 py-14 sm:px-8 md:grid-cols-[1.6fr_1fr] md:py-24">
      <section aria-labelledby="landing-heading">
        <p className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-accent">NASA Space Apps Challenge 2026</p>
        <h1 id="landing-heading" className="text-5xl font-semibold leading-[1.02] tracking-tight sm:text-7xl">
          {APP_NAME}
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed">
          On a long mission there is no clinic down the hall. This app reads what it can from your webcam, compares it to your own
          baseline, and tells you when to escalate. When it cannot get a clean reading, it says so instead of guessing.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button onClick={() => go('mirror')} className="bg-accent px-5 py-3 text-sm font-medium text-white hover:bg-ink">
            Take the mirror check
          </button>
          <button onClick={() => go('bodymap')} className="border border-ink px-5 py-3 text-sm font-medium hover:bg-ink hover:text-paper">
            Explore the crew dashboard
          </button>
        </div>
      </section>

      <aside aria-label="Demo controls" className="self-end border border-rule bg-panel p-5">
        <h2 className="text-sm font-semibold">Judge mode</h2>
        <p className="mt-1 text-sm text-muted">No login. Choose who you are acting as. Your own check-ins are saved to the guest profile.</p>
        <label className="mt-4 block text-sm text-muted">
          Acting as
          <select
            className="mt-1 block w-full rounded-sm border border-rule bg-paper px-2 py-2 text-ink"
            value={crewId}
            onChange={(e) => setCrewId(e.target.value)}
          >
            {crew.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1">
          <button onClick={() => void resetDemo()} className="text-sm text-accent underline underline-offset-4 hover:text-ink">
            Reset demo
          </button>
          <button onClick={() => window.dispatchEvent(new Event('demo:toggle'))} className="text-sm text-accent underline underline-offset-4 hover:text-ink">
            Demo controls (Shift+D)
          </button>
        </div>
      </aside>
    </main>
  )
}
