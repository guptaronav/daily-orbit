import { APP_NAME } from '../config/app'
import { ENVIRONMENTS, formatDelay, type EnvId } from '../lib/environments'
import { useApp, type Screen } from '../state/AppContext'
import { Avatar } from './kit/Avatar'
import { ThemeToggle } from './kit/Chrome'
import { Icon, type IconName } from './kit/Icon'

const NAV: { screen: Screen; label: string; icon: IconName }[] = [
  { screen: 'bodymap', label: 'Body map', icon: 'body' },
  { screen: 'mirror', label: 'Mirror check', icon: 'eye' },
  { screen: 'progress', label: 'Crew progress', icon: 'spark' },
  { screen: 'manual', label: 'Manual entry', icon: 'plus' },
  { screen: 'escalation', label: 'Escalation', icon: 'send' },
  { screen: 'radiation', label: 'Radiation', icon: 'shield' },
  { screen: 'medical', label: 'Medical view', icon: 'heart' },
  { screen: 'metrics', label: 'Metrics', icon: 'target' },
  { screen: 'sources', label: 'Sources', icon: 'check' },
]

export function TopBar() {
  const { screen, go, crew, crewId, setCrewId, environment, setEnvironmentId, delaySec, setDelaySec } = useApp()
  const adjustable = environment.minDelaySec !== undefined && environment.maxDelaySec !== undefined

  return (
    <header className="sticky top-0 z-30 border-b border-rule bg-panel/95 backdrop-blur">
      <a href="#main" className="btn btn-primary sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50">
        Skip to content
      </a>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 px-4 py-2.5 sm:px-6">
        <button onClick={() => go('landing')} className="group mr-auto flex min-h-[44px] items-center gap-2.5 text-left">
          <span
            aria-hidden
            className="grid h-7 w-7 place-items-center border border-accent text-accent transition-colors group-hover:bg-accent group-hover:text-paper-deep"
            style={{ clipPath: 'polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%)' }}
          >
            <Icon name="spark" size={14} />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight">{APP_NAME}</span>
            <span className="label" style={{ fontSize: '0.5625rem' }}>
              crew console
            </span>
          </span>
        </button>

        {/* Crew selector as a row of portraits: one tap, no menu, and you can see who is selected. */}
        <div role="group" aria-label="Acting as crew member" className="flex items-center gap-2">
          <span className="label hidden sm:inline">Crew</span>
          {crew.map((c) => {
            const active = c.id === crewId
            return (
              <button
                key={c.id}
                onClick={() => setCrewId(c.id)}
                aria-pressed={active}
                title={c.name}
                className="grid h-12 w-12 place-items-center transition-transform hover:scale-105"
                style={active ? { filter: 'drop-shadow(0 0 10px color-mix(in srgb, var(--color-accent) 60%, transparent))' } : undefined}
              >
                <Avatar crew={c} size={40} badge ring={active ? 'var(--color-accent)' : 'var(--color-rule)'} />
                <span className="sr-only">{c.name}</span>
              </button>
            )
          })}
        </div>

        <label className="flex items-center gap-2">
          <span className="label hidden md:inline">Env</span>
          <select
            className="field h-11 w-auto py-0 text-sm"
            aria-label="Mission environment"
            value={environment.id}
            onChange={(e) => setEnvironmentId(e.target.value as EnvId)}
          >
            {ENVIRONMENTS.map((env) => (
              <option key={env.id} value={env.id}>
                {env.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-2">
          <Icon name="clock" size={14} className="text-muted" />
          <span className="label hidden lg:inline">One-way</span>
          <span className="mono text-sm font-semibold" style={{ color: 'var(--color-accent)' }}>
            {formatDelay(delaySec)}
          </span>
          {adjustable && (
            <input
              aria-label="One-way comm delay in seconds"
              className="h-11 w-20 accent-accent lg:w-28"
              type="range"
              min={environment.minDelaySec}
              max={environment.maxDelaySec}
              step={30}
              value={delaySec}
              onChange={(e) => setDelaySec(Number(e.target.value))}
            />
          )}
        </div>

        <ThemeToggle compact />
      </div>

      <nav aria-label="Main navigation" className="border-t border-rule">
        <div className="flex gap-x-1 overflow-x-auto px-2 sm:px-4">
          {NAV.map((item) => {
            const active = screen === item.screen
            return (
              <button
                key={item.screen}
                onClick={() => go(item.screen)}
                aria-current={active ? 'page' : undefined}
                className={`label relative flex min-h-[44px] shrink-0 items-center gap-2 px-3 transition-colors ${
                  active ? 'text-accent' : 'hover:text-ink'
                }`}
              >
                <Icon name={item.icon} size={14} />
                {item.label}
                <span
                  aria-hidden
                  className="absolute inset-x-2 bottom-0 h-[2px] transition-opacity"
                  style={{ background: 'var(--color-accent)', opacity: active ? 1 : 0 }}
                />
              </button>
            )
          })}
        </div>
      </nav>
    </header>
  )
}
