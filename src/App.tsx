import { Suspense, lazy, useCallback, useEffect, useState } from 'react'
import { DemoPanel } from './components/DemoPanel'
import { Footer } from './components/Footer'
import { TopBar } from './components/TopBar'
import { Escalation } from './screens/Escalation'
import { Landing } from './screens/Landing'
import { Manual } from './screens/Manual'
import { Medical } from './screens/Medical'
import { Metrics } from './screens/Metrics'
import { Onboarding } from './screens/Onboarding'
import { Progress } from './screens/Progress'
import { Radiation } from './screens/Radiation'
import { Sources } from './screens/Sources'
import { AppProvider, useApp } from './state/AppContext'

// The charts (body map) and the camera pipeline (mirror check) are the heavy parts: load them on demand.
const BodyMap = lazy(() => import('./screens/BodyMap').then((m) => ({ default: m.BodyMap })))
const MirrorCheck = lazy(() => import('./screens/mirror/MirrorCheck').then((m) => ({ default: m.MirrorCheck })))

const ONBOARDED_KEY = 'chm-onboarded'

const hasOnboarded = (): boolean => {
  try {
    return localStorage.getItem(ONBOARDED_KEY) === '1'
  } catch {
    // Blocked storage: treat the person as set up rather than trapping them in setup forever.
    return true
  }
}

/** Marks setup done and sends you straight into the thing setup was for. */
function OnboardingGate({ onFinished }: { onFinished: () => void }) {
  const { go } = useApp()
  return (
    <Onboarding
      onDone={() => {
        onFinished()
        try {
          localStorage.setItem(ONBOARDED_KEY, '1')
        } catch {
          // Not remembering is fine; the landing page always offers setup again.
        }
        go('mirror')
      }}
    />
  )
}

function Screen() {
  const { screen, ready } = useApp()
  // First visit lands in setup instead of the hero; afterwards the hero is the home screen.
  const [setupDone, setSetupDone] = useState(hasOnboarded)
  if (!ready) return <main className="p-8 text-muted">Loading crew data…</main>
  if (screen === 'onboarding' || (screen === 'landing' && !setupDone)) return <OnboardingGate onFinished={() => setSetupDone(true)} />
  if (screen === 'landing') return <Landing />
  if (screen === 'bodymap') return <BodyMap />
  if (screen === 'mirror') return <MirrorCheck />
  if (screen === 'progress') return <Progress />
  if (screen === 'manual') return <Manual />
  if (screen === 'escalation') return <Escalation />
  if (screen === 'radiation') return <Radiation />
  if (screen === 'medical') return <Medical />
  if (screen === 'metrics') return <Metrics />
  if (screen === 'sources') return <Sources />
  // Remaining screens land in later plan tasks.
  return <main className="p-8 text-muted">Screen "{screen}" is not built yet.</main>
}

// Shift+D (or the "Demo controls" link on the landing page) toggles the demo panel.
const DEMO_EVENT = 'demo:toggle'

function Shell() {
  const { screen } = useApp()
  const [demoOpen, setDemoOpen] = useState(false)
  const toggleDemo = useCallback(() => setDemoOpen((o) => !o), [])

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
    <div className="flex min-h-screen flex-col">
      {screen !== 'onboarding' && <TopBar />}
      {/* Target for the TopBar's "Skip to content" link (A1 accessibility pass). */}
      <div id="main" tabIndex={-1} className="flex flex-1 flex-col outline-none">
        <Suspense fallback={<main className="p-8 text-muted">Loading…</main>}>
          <Screen />
        </Suspense>
      </div>
      <Footer />
      <DemoPanel open={demoOpen} onClose={() => setDemoOpen(false)} />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  )
}
