import { APP_NAME } from '../config/app'
import { ENVIRONMENTS, formatDelay, type EnvId } from '../lib/environments'
import { useApp, type Screen } from '../state/AppContext'

const NAV: { screen: Screen; label: string }[] = [
  { screen: 'bodymap', label: 'Body map' },
  { screen: 'mirror', label: 'Mirror check' },
  { screen: 'manual', label: 'Manual entry' },
  { screen: 'escalation', label: 'Escalation' },
  { screen: 'radiation', label: 'Radiation' },
  { screen: 'medical', label: 'Medical view' },
  { screen: 'metrics', label: 'Metrics' },
  { screen: 'sources', label: 'Sources' },
]

const selectClass = 'field h-11 w-auto min-w-0 bg-panel py-0 text-sm'

export function TopBar() {
  const { screen, go, crew, crewId, setCrewId, environment, setEnvironmentId, delaySec, setDelaySec } = useApp()
  const adjustable = environment.minDelaySec !== undefined && environment.maxDelaySec !== undefined

  return (
    <header className="border-b border-ink bg-panel">
      <a href="#main" className="btn btn-primary sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50">
        Skip to content
      </a>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-8">
        <button onClick={() => go('landing')} className="mr-auto flex items-baseline gap-2 text-left">
          <span className="text-base font-semibold tracking-tight">{APP_NAME}</span>
          <span className="label hidden sm:inline">home</span>
        </button>

        <label className="flex items-center gap-2 text-sm">
          <span className="label">Crew</span>
          <select className={selectClass} value={crewId} onChange={(e) => setCrewId(e.target.value)}>
            {crew.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm">
          <span className="label">Environment</span>
          <select className={selectClass} value={environment.id} onChange={(e) => setEnvironmentId(e.target.value as EnvId)}>
            {ENVIRONMENTS.map((env) => (
              <option key={env.id} value={env.id}>
                {env.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-2 text-sm">
          <span className="label">One-way delay</span>
          <span className="font-semibold">{formatDelay(delaySec)}</span>
          {adjustable && (
            <input
              aria-label="One-way comm delay in seconds"
              className="w-24 accent-accent sm:w-32"
              type="range"
              min={environment.minDelaySec}
              max={environment.maxDelaySec}
              step={30}
              value={delaySec}
              onChange={(e) => setDelaySec(Number(e.target.value))}
            />
          )}
        </div>
      </div>

      <nav aria-label="Main navigation" className="border-t border-rule">
        <div className="flex gap-x-5 overflow-x-auto px-4 sm:px-8">
          {NAV.map((item) => (
            <button
              key={item.screen}
              onClick={() => go(item.screen)}
              aria-current={screen === item.screen ? 'page' : undefined}
              className={`-mb-px shrink-0 whitespace-nowrap border-b-2 py-2.5 text-sm transition-colors ${
                screen === item.screen ? 'border-accent font-semibold text-ink' : 'border-transparent text-muted hover:border-rule-strong hover:text-ink'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>
    </header>
  )
}
