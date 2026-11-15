import { Suspense, lazy, useCallback, useEffect, useState } from 'react'
import { DemoPanel } from './components/DemoPanel'
import { usePrototypeLinks } from './proto/dc'
import {
  BodyMapPage,
  EscalationPage,
  LandingPage,
  ManualPage,
  MedicalPage,
  MetricsPage,
  OnboardingPage,
  ProtoFrame,
  RewardsPage,
} from './proto/pages'
import './proto/proto.css'
import { bridge, useProtoStore } from './proto/store'
import { AppProvider, useApp } from './state/AppContext'

// Everything beyond the shell loads on demand. The camera pipeline is the heaviest part.
const MirrorCheck = lazy(() => import('./screens/mirror/MirrorCheck').then((m) => ({ default: m.MirrorCheck })))
const SchedulePage = lazy(() => import('./proto/SchedulePage').then((m) => ({ default: m.SchedulePage })))
const Radiation = lazy(() => import('./screens/Radiation').then((m) => ({ default: m.Radiation })))
const Sources = lazy(() => import('./screens/Sources').then((m) => ({ default: m.Sources })))

/** The pages a visitor almost always opens next, fetched in the background once the browser is idle. */
function prefetchLikelyScreens() {
  const run = () => {
    void import('./proto/BodyMapView')
    void import('./screens/mirror/MirrorCheck')
  }
  if ('requestIdleCallback' in window) window.requestIdleCallback(run, { timeout: 4000 })
  else setTimeout(run, 2000)
}

const PAGE_FALLBACK = <main style={{ padding: 32, color: 'var(--muted)' }}>Loading…</main>

const ONBOARDED_KEY = 'chm-onboarded'

const hasOnboarded = (): boolean => {
  try {
    return localStorage.getItem(ONBOARDED_KEY) === '1'
  } catch {
    // Blocked storage: treat the person as set up rather than trapping them in setup forever.
    return true
  }
}

/** First-run setup. Leaving it, by finishing or skipping, marks setup done. */
function OnboardingGate({ onFinished }: { onFinished: () => void }) {
  useEffect(
    () => () => {
      try {
        localStorage.setItem(ONBOARDED_KEY, '1')
      } catch {
        // Not remembering is fine; the landing page always offers setup again.
      }
      onFinished()
    },
    [onFinished],
  )
  return <OnboardingPage />
}

function Screen() {
  const { screen, ready, crew, dataVersion } = useApp()
  const storeReady = useProtoStore(crew, dataVersion)
  // First visit lands in setup instead of the hero; afterwards the hero is the home screen.
  const [setupDone, setSetupDone] = useState(hasOnboarded)
  const finish = useCallback(() => setSetupDone(true), [])

  if (!ready || !storeReady) return <main style={{ padding: 32, color: 'var(--muted)' }}>Loading crew data…</main>
  if (screen === 'onboarding' || (screen === 'landing' && !setupDone)) return <OnboardingGate onFinished={finish} />
  if (screen === 'landing') return <LandingPage />
  if (screen === 'bodymap') return <BodyMapPage />
  if (screen === 'manual') return <ManualPage />
  if (screen === 'escalation') return <EscalationPage />
  if (screen === 'medical') return <MedicalPage />
  if (screen === 'metrics') return <MetricsPage />
  if (screen === 'progress') return <RewardsPage />
  if (screen === 'mirror') {
    return (
      <ProtoFrame current="Mirror check">
        <Suspense fallback={<main style={{ padding: 32, color: 'var(--muted)' }}>Loading…</main>}>
          <MirrorCheck />
        </Suspense>
      </ProtoFrame>
    )
  }
  if (screen === 'schedule') {
    return (
      <ProtoFrame current="Mission schedule">
        <SchedulePage />
      </ProtoFrame>
    )
  }
  if (screen === 'radiation') {
    return (
      <ProtoFrame current="Radiation">
        <Radiation />
      </ProtoFrame>
    )
  }
  if (screen === 'sources') {
    return (
      <ProtoFrame current="Sources">
        <Sources />
      </ProtoFrame>
    )
  }
  return <main style={{ padding: 32, color: 'var(--muted)' }}>Screen "{screen}" is not built yet.</main>
}

// Shift+D (or the "Demo controls" link on the landing page) toggles the demo panel.
const DEMO_EVENT = 'demo:toggle'

function Shell() {
  const app = useApp()
  const [demoOpen, setDemoOpen] = useState(false)
  const toggleDemo = useCallback(() => setDemoOpen((o) => !o), [])

  // The prototype pages read and change app state through the store's bridge.
  bridge.crewId = app.crewId
  bridge.envId = app.environment.id
  bridge.delaySec = app.delaySec
  bridge.setCrewId = app.setCrewId
  bridge.setEnvironmentId = app.setEnvironmentId
  bridge.setDelaySec = app.setDelaySec
  bridge.go = app.go
  bridge.refresh = app.refresh

  usePrototypeLinks()
  useEffect(() => prefetchLikelyScreens(), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      const typing = el && (['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) || el.isContentEditable)
      if (e.shiftKey && e.key === 'D' && !typing) toggleDemo()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener(DEMO_EVENT, toggleDemo)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener(DEMO_EVENT, toggleDemo)
    }
  }, [toggleDemo])

  return (
    <>
      <Suspense fallback={PAGE_FALLBACK}>
        <Screen />
      </Suspense>
      <DemoPanel open={demoOpen} onClose={() => setDemoOpen(false)} />
    </>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  )
}
