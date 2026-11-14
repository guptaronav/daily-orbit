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

const selectClass = 'rounded-sm border border-rule bg-panel px-2 py-1 text-sm'

export function TopBar() {
  const { screen, go, crew, crewId, setCrewId, environment, setEnvironmentId, delaySec, setDelaySec } = useApp()
  const adjustable = environment.minDelaySec !== undefined && environment.maxDelaySec !== undefined

  return (
    <header className="border-b border-ink bg-panel">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-8">
        <button onClick={() => go('landing')} className="mr-auto text-left text-base font-semibold tracking-tight">
          {APP_NAME}
        </button>
        <label className="flex items-center gap-2 text-sm text-muted">
          Crew
          <select className={selectClass} value={crewId} onChange={(e) => setCrewId(e.target.value)}>
            {crew.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-muted">
          Environment
          <select className={selectClass} value={environment.id} onChange={(e) => setEnvironmentId(e.target.value as EnvId)}>
            {ENVIRONMENTS.map((env) => (
              <option key={env.id} value={env.id}>
                {env.label}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-2 text-sm text-muted">
          One-way delay <span className="font-medium text-ink">{formatDelay(delaySec)}</span>
          {adjustable && (
            <input
              aria-label="One-way comm delay"
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
      <nav aria-label="Main navigation" className="flex flex-wrap gap-x-5 border-t border-rule px-4 sm:px-8">
        {NAV.map((item) => (
          <button
            key={item.screen}
            onClick={() => go(item.screen)}
            aria-current={screen === item.screen ? 'page' : undefined}
            className={`border-b-2 py-2 text-sm ${screen === item.screen ? 'border-accent font-medium text-ink' : 'border-transparent text-muted hover:text-ink'}`}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </header>
  )
}
