import { useState } from 'react'
import { Avatar } from '../components/kit/Avatar'
import { Starfield } from '../components/kit/Chrome'
import { Icon } from '../components/kit/Icon'
import { CoinIcon } from '../components/kit/Wallet'
import { addEvent } from '../db/repo'
import { ENVIRONMENTS, formatDelay, type EnvId } from '../lib/environments'
import { GEAR_SUITS, GEAR_VISORS, setGear, type Gear } from '../lib/gear'
import { POINTS } from '../lib/scoring'
import { useApp } from '../state/AppContext'

/**
 * First-run setup.
 *
 * It only asks things the app genuinely uses: who you are acting as, where the mission is, and a
 * cosmetic visor and suit. It asks nothing medical, because anything it asked would become
 * unsourced health content, and the app's whole promise is that it does not invent those.
 *
 * Finishing opens the welcome supply drop, which is the same once-a-day crate the rewards screen
 * gives: credit for showing up, never for a health value.
 */
export function Onboarding({ onDone }: { onDone: () => void }) {
  const { crew, crewId, setCrewId, environment, setEnvironmentId, refresh } = useApp()
  const [step, setStep] = useState(0)
  const [gear, setGearState] = useState<Gear>({ visor: 'standard', suit: 'white' })
  const [awarded, setAwarded] = useState(0)

  const current = crew.find((c) => c.id === crewId)
  const steps = ['Who you are', 'Where you are', 'Make it yours', 'Ready']

  async function finish() {
    setGear(gear)
    await addEvent({ id: crypto.randomUUID(), crewId, timestamp: new Date().toISOString(), kind: 'supplyDrop' })
    setAwarded(POINTS.supplyDrop)
    setStep(3)
    refresh()
  }

  return (
    <main className="mx-auto w-full max-w-[900px] px-4 pb-16 pt-10 sm:px-8">
      <ol className="flex flex-wrap items-center gap-2" aria-label="Setup progress">
        {steps.map((s, i) => (
          <li key={s} className="flex items-center gap-2">
            <span
              className="pill"
              aria-current={i === step ? 'step' : undefined}
              style={
                i <= step
                  ? { background: 'var(--color-ink)', color: 'var(--color-paper)' }
                  : { background: 'var(--color-paper-deep)', color: 'var(--color-muted)' }
              }
            >
              {i < step && <Icon name="check" size={12} />}
              {s}
            </span>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <section className="animate-rise mt-8">
          <h1 className="display text-4xl sm:text-5xl">Your crew console, set up in a minute.</h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-soft">
            Thirty seconds a day keeps your own baseline honest. Nothing here is medical: the app only asks who you are and where the
            mission is, then measures what it can and tells you when it could not.
          </p>

          <h2 className="mt-8 text-xl font-bold tracking-tight">Who are you acting as?</h2>
          <p className="text-muted">Your own check-ins save to the guest profile, on this device only.</p>

          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {crew.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => setCrewId(c.id)}
                  aria-pressed={c.id === crewId}
                  className="card card-action flex w-full items-center gap-4 p-4"
                >
                  <Avatar crew={c} size={48} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold">{c.name}</span>
                    <span className="block text-sm text-muted">
                      {c.role} · {c.dataLabel}
                    </span>
                  </span>
                  {c.id === crewId && <Icon name="check" size={18} />}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {step === 1 && (
        <section className="animate-rise mt-8">
          <h1 className="display text-4xl sm:text-5xl">Where is the mission?</h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-soft">
            This sets the one-way comm delay, which is what makes the escalation ladder worth having. You can change it any time from the
            top bar.
          </p>

          <ul className="mt-6 grid gap-3">
            {ENVIRONMENTS.map((e) => (
              <li key={e.id}>
                <button
                  onClick={() => setEnvironmentId(e.id as EnvId)}
                  aria-pressed={e.id === environment.id}
                  className="card card-action flex w-full items-center justify-between gap-4 p-4"
                >
                  <span>
                    <span className="block font-bold">{e.label}</span>
                    <span className="block text-sm text-muted">One-way delay {formatDelay(e.oneWayDelaySec)}</span>
                  </span>
                  {e.id === environment.id && <Icon name="check" size={18} />}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {step === 2 && (
        <section className="animate-rise mt-8">
          <h1 className="display text-4xl sm:text-5xl">Make it yours.</h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-soft">
            Pick a starter visor and suit. These change how your portrait looks and nothing else &mdash; no reading, score or threshold
            depends on them.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-8">
            {current && <Avatar crew={current} size={110} gear={gear} />}

            <div className="min-w-[16rem] flex-1 space-y-5">
              <div>
                <p className="font-bold">Visor</p>
                <div className="track mt-2 w-fit">
                  {GEAR_VISORS.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setGearState((g) => ({ ...g, visor: v.id }))}
                      aria-pressed={gear.visor === v.id}
                      className="track-item"
                    >
                      {v.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="font-bold">Suit</p>
                <div className="track mt-2 w-fit">
                  {GEAR_SUITS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setGearState((g) => ({ ...g, suit: s.id }))}
                      aria-pressed={gear.suit === s.id}
                      className="track-item"
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="animate-rise mt-8">
          <div className="relative overflow-hidden rounded-[var(--r-panel)] p-8 text-center" style={{ background: '#0b1018', color: '#f3f1ea' }}>
            <div style={{ ['--star-o' as string]: 1 }}>
              <Starfield seed={5} count={70} />
            </div>
            <div className="relative">
              <p className="label" style={{ color: 'rgb(243 241 234 / 0.7)' }}>
                Setup complete
              </p>
              <p className="display mt-2 flex items-center justify-center gap-3 text-5xl">
                <CoinIcon size={38} />+{awarded}
              </p>
              <p className="mt-3" style={{ color: 'rgb(243 241 234 / 0.75)' }}>
                Your welcome supply drop. Coins come from showing up, never from what a reading says.
              </p>
            </div>
          </div>

          <dl className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              { k: 'Acting as', v: current?.name ?? '—' },
              { k: 'Mission', v: environment.label },
              { k: 'One-way delay', v: formatDelay(environment.oneWayDelaySec) },
            ].map((d) => (
              <div key={d.k} className="card p-4">
                <dt className="label">{d.k}</dt>
                <dd className="mt-1 text-lg font-bold">{d.v}</dd>
              </div>
            ))}
          </dl>

          <div className="card mt-4 p-5">
            <p className="font-bold">What happens next</p>
            <p className="mt-1.5 leading-relaxed text-muted">
              Take the mirror check. It reads what it can from the camera in about thirty seconds, compares it with your own baseline, and
              says so plainly when it could not get a clean reading.
            </p>
          </div>
        </section>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-3">
        {step > 0 && step < 3 && (
          <button onClick={() => setStep((s) => s - 1)} className="btn btn-secondary">
            Back
          </button>
        )}
        {step < 2 && (
          <button onClick={() => setStep((s) => s + 1)} className="btn btn-primary">
            Continue
            <Icon name="arrowRight" size={16} />
          </button>
        )}
        {step === 2 && (
          <button onClick={() => void finish()} className="btn btn-primary">
            Finish setup
            <Icon name="arrowRight" size={16} />
          </button>
        )}
        {step === 3 && (
          <button onClick={onDone} className="btn btn-primary">
            <Icon name="eye" size={16} />
            Take the mirror check
          </button>
        )}
        {step < 3 && (
          <button onClick={onDone} className="btn-quiet">
            Skip for now
          </button>
        )}
      </div>
    </main>
  )
}
