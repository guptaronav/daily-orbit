import { useEffect, useRef, useState } from 'react'
import { APP_NAME } from '../config/app'
import { ENVIRONMENTS, formatDelay, type EnvId } from '../lib/environments'
import { useApp, type Screen } from '../state/AppContext'
import { Avatar } from './kit/Avatar'
import { Icon, type IconName } from './kit/Icon'
import { useCrewGame } from './kit/useCrewGame'
import { FlameIcon, Wallet } from './kit/Wallet'

type Link = { screen: Screen; label: string; icon: IconName; desc?: string }

const PRIMARY: Link[] = [
  { screen: 'bodymap', label: 'Console', icon: 'body' },
  { screen: 'mirror', label: 'Check', icon: 'eye' },
  { screen: 'manual', label: 'Log', icon: 'plus' },
  { screen: 'escalation', label: 'Escalate', icon: 'send' },
  { screen: 'medical', label: 'Crew', icon: 'heart' },
  { screen: 'progress', label: 'Rewards', icon: 'spark' },
]

const MORE: Link[] = [
  { screen: 'radiation', label: 'Radiation', icon: 'shield', desc: 'Replay a real solar particle event and its shelter prompt' },
  { screen: 'metrics', label: 'Metrics', icon: 'target', desc: 'Two labelled simulations, every assumption editable' },
  { screen: 'sources', label: 'Sources', icon: 'check', desc: 'Every NASA dataset and page this app uses' },
]

/** Closes a popover on an outside click and on Escape. */
function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close()
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, close])
  return ref
}

export function TopBar() {
  const { screen, go, crew, crewId, setCrewId, currentCrew, environment, setEnvironmentId, delaySec, setDelaySec, dataVersion } = useApp()
  const game = useCrewGame(crewId, dataVersion)

  const [moreOpen, setMoreOpen] = useState(false)
  const [envOpen, setEnvOpen] = useState(false)
  const [meOpen, setMeOpen] = useState(false)

  const moreRef = useDismiss(moreOpen, () => setMoreOpen(false))
  const envRef = useDismiss(envOpen, () => setEnvOpen(false))
  const meRef = useDismiss(meOpen, () => setMeOpen(false))

  const adjustable = environment.minDelaySec !== undefined && environment.maxDelaySec !== undefined
  const envShort = environment.label.split(' ')[0]
  const pct = adjustable
    ? ((delaySec - environment.minDelaySec!) / (environment.maxDelaySec! - environment.minDelaySec!)) * 100
    : 0

  const openScreen = (next: Screen) => {
    go(next)
    setMoreOpen(false)
  }

  return (
    <header className="sticky top-0 z-30 px-2.5 pt-3 sm:px-6" style={{ pointerEvents: 'none' }}>
      <a
        href="#main"
        className="btn btn-primary sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50"
        style={{ pointerEvents: 'auto' }}
      >
        Skip to content
      </a>

      <div className="floating mx-auto flex max-w-[1440px] flex-wrap items-center gap-2 p-1.5 pl-2" style={{ pointerEvents: 'auto' }}>
        <button onClick={() => go('landing')} aria-label={`${APP_NAME}, home`} className="flex min-h-[44px] items-center gap-2.5 pr-2">
          <span
            aria-hidden
            className="grid h-9 w-9 place-items-center rounded-full"
            style={{ background: 'var(--color-ink)', color: 'var(--color-paper)' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(-24 12 12)" />
              <circle cx="12" cy="12" r="3.2" fill="currentColor" stroke="none" />
            </svg>
          </span>
          <span className="whitespace-nowrap text-base font-bold tracking-tight">Crew Health</span>
        </button>

        <nav aria-label="Main navigation" className="order-3 min-w-0 flex-1 basis-full sm:order-none sm:basis-auto">
          <div className="track no-bar max-w-full overflow-x-auto">
            {PRIMARY.map((l) => (
              <button
                key={l.screen}
                onClick={() => openScreen(l.screen)}
                aria-current={screen === l.screen ? 'page' : undefined}
                className="track-item"
              >
                <Icon name={l.icon} size={15} />
                {l.label}
              </button>
            ))}

            <div className="relative" ref={moreRef}>
              <button
                onClick={() => setMoreOpen((o) => !o)}
                aria-expanded={moreOpen}
                aria-haspopup="true"
                aria-current={MORE.some((m) => m.screen === screen) ? 'page' : undefined}
                className="track-item"
              >
                More
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  style={{ transform: moreOpen ? 'rotate(180deg)' : 'none', transition: 'transform 200ms ease' }}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {moreOpen && (
                <div role="menu" className="menu absolute left-0 top-11 z-40 w-[min(22rem,calc(100vw-2rem))] p-2">
                  {MORE.map((m) => (
                    <button
                      key={m.screen}
                      role="menuitem"
                      onClick={() => openScreen(m.screen)}
                      className="grid w-full grid-cols-[40px_1fr] items-center gap-3 rounded-2xl p-2 text-left hover:bg-panel-2"
                    >
                      <span aria-hidden className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: 'var(--color-paper-deep)' }}>
                        <Icon name={m.icon} size={18} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[0.9375rem] font-semibold">{m.label}</span>
                        <span className="block text-sm leading-snug text-muted">{m.desc}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </nav>

        <div className="order-2 ml-auto flex items-center gap-1.5">
          <div className="relative" ref={envRef}>
            <button
              onClick={() => setEnvOpen((o) => !o)}
              aria-expanded={envOpen}
              aria-haspopup="true"
              aria-label="Mission environment and comm delay"
              className="btn btn-secondary"
            >
              <Icon name="globe" size={16} />
              <span className="font-semibold">{envShort}</span>
              <span className="hidden font-normal text-muted sm:inline">{formatDelay(delaySec)}</span>
            </button>

            {envOpen && (
              <div className="menu absolute right-0 top-12 z-40 w-[min(20rem,calc(100vw-2rem))] p-2">
                <p className="px-2.5 pb-1.5 pt-1 text-sm text-muted">Mission environment</p>
                <div role="radiogroup" aria-label="Mission environment">
                  {ENVIRONMENTS.map((e) => (
                    <button
                      key={e.id}
                      role="radio"
                      aria-checked={e.id === environment.id}
                      onClick={() => setEnvironmentId(e.id as EnvId)}
                      className="flex min-h-[52px] w-full items-center justify-between gap-3 rounded-2xl px-3 text-left hover:bg-panel-2"
                    >
                      <span>
                        <span className="block font-semibold">{e.label}</span>
                        <span className="block text-sm text-muted">One-way delay {formatDelay(e.oneWayDelaySec)}</span>
                      </span>
                      {e.id === environment.id && <Icon name="check" size={18} />}
                    </button>
                  ))}
                </div>

                {adjustable && (
                  <div className="mt-1.5 border-t border-rule px-2.5 pt-3">
                    <div className="flex items-baseline justify-between">
                      <label htmlFor="chm-delay" className="text-sm text-muted">
                        Mars distance today
                      </label>
                      <span className="font-semibold">{formatDelay(delaySec)}</span>
                    </div>
                    <input
                      id="chm-delay"
                      className="range"
                      type="range"
                      min={environment.minDelaySec}
                      max={environment.maxDelaySec}
                      step={30}
                      value={delaySec}
                      onChange={(e) => setDelaySec(Number(e.target.value))}
                      style={{ ['--pct' as string]: `${pct}%` }}
                    />
                    <div className="flex justify-between text-sm text-muted">
                      <span>Closest · {formatDelay(environment.minDelaySec!)}</span>
                      <span>Farthest · {formatDelay(environment.maxDelaySec!)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <Wallet streak={game.streak} coins={game.coins} onClick={() => go('progress')} />

          <div className="relative" ref={meRef}>
            <button
              onClick={() => setMeOpen((o) => !o)}
              aria-expanded={meOpen}
              aria-haspopup="true"
              aria-label={`Acting as ${currentCrew?.name ?? 'crew'}. Switch crew member.`}
              className="grid h-12 w-12 place-items-center rounded-full"
            >
              {currentCrew && <Avatar crew={currentCrew} size={42} level={game.level.level} />}
            </button>

            {meOpen && (
              <div className="menu absolute right-0 top-14 z-40 w-[min(19rem,calc(100vw-2rem))] p-2">
                <p className="px-2.5 pb-1.5 pt-1 text-sm text-muted">Acting as</p>
                {crew.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setCrewId(c.id)
                      setMeOpen(false)
                    }}
                    aria-current={c.id === crewId ? 'true' : undefined}
                    className="flex min-h-[56px] w-full items-center gap-3 rounded-2xl px-2.5 text-left hover:bg-panel-2"
                  >
                    <Avatar crew={c} size={36} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{c.name}</span>
                      <span className="block truncate text-sm text-muted">{c.role}</span>
                    </span>
                    {c.id === crewId && <Icon name="check" size={18} />}
                  </button>
                ))}
                <div className="mt-1.5 flex items-center gap-2 border-t border-rule px-2.5 pt-3 text-sm text-muted">
                  <FlameIcon size={14} />
                  {game.streak} day streak · level {game.level.level} {game.level.title.toLowerCase()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
