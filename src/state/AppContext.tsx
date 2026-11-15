import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { CrewMember } from '../contract/types'
import { ensureSeeded, listCrew, resetAndReseed } from '../db/repo'
import { ENVIRONMENTS, type EnvId, type Environment } from '../lib/environments'

export type Screen =
  | 'landing'
  | 'onboarding'
  | 'bodymap'
  | 'progress'
  | 'mirror'
  | 'manual'
  | 'escalation'
  | 'radiation'
  | 'metrics'
  | 'sources'
  | 'medical'
  | 'demo'
  | 'schedule'
  | 'today'
  | 'report'

type AppState = {
  ready: boolean
  crew: CrewMember[]
  crewId: string
  currentCrew: CrewMember | undefined
  setCrewId: (id: string) => void
  environment: Environment
  setEnvironmentId: (id: EnvId) => void
  delaySec: number
  setDelaySec: (sec: number) => void
  screen: Screen
  go: (screen: Screen) => void
  /** Bumps whenever stored data changes so screens can re-read it. */
  dataVersion: number
  refresh: () => void
  resetDemo: () => Promise<void>
}

const Ctx = createContext<AppState | null>(null)

const SCREENS: readonly Screen[] = ['landing', 'bodymap', 'progress', 'mirror', 'manual', 'escalation', 'radiation', 'metrics', 'sources', 'medical', 'demo', 'schedule', 'today', 'report']

/** Development only (stripped from production builds): open the app on a given screen with ?screen=progress. */
/** Development only: start as a given crew member with ?crew=guest. */
const devCrew: string = (() => {
  if (!import.meta.env.DEV) return 'crew-1'
  return new URLSearchParams(location.search).get('crew') ?? 'crew-1'
})()

const devScreen: Screen = (() => {
  if (!import.meta.env.DEV) return 'landing'
  const wanted = new URLSearchParams(location.search).get('screen')
  return SCREENS.find((s) => s === wanted) ?? 'landing'
})()

export function AppProvider({ children }: { children: ReactNode }) {
  const [crew, setCrew] = useState<CrewMember[]>([])
  const [ready, setReady] = useState(false)
  const [crewId, setCrewId] = useState(devCrew)
  const [envId, setEnvId] = useState<EnvId>('mars')
  const [delayOverride, setDelayOverride] = useState<number | null>(null)
  const [screen, go] = useState<Screen>(devScreen)
  const [dataVersion, setDataVersion] = useState(0)

  const refresh = useCallback(() => setDataVersion((v) => v + 1), [])

  const loadCrew = useCallback(async () => {
    setCrew(await listCrew())
    setReady(true)
    refresh()
  }, [refresh])

  useEffect(() => {
    void ensureSeeded().then(loadCrew)
  }, [loadCrew])

  const resetDemo = useCallback(async () => {
    await resetAndReseed()
    setCrewId('crew-1')
    await loadCrew()
  }, [loadCrew])

  const environment = ENVIRONMENTS.find((e) => e.id === envId)!

  const value = useMemo<AppState>(
    () => ({
      ready,
      crew,
      crewId,
      currentCrew: crew.find((c) => c.id === crewId),
      setCrewId,
      environment,
      setEnvironmentId: (id) => {
        setEnvId(id)
        setDelayOverride(null)
      },
      delaySec: delayOverride ?? environment.oneWayDelaySec,
      setDelaySec: setDelayOverride,
      screen,
      go,
      dataVersion,
      refresh,
      resetDemo,
    }),
    [ready, crew, crewId, environment, delayOverride, screen, dataVersion, refresh, resetDemo],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useApp(): AppState {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
