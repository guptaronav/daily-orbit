import { Suspense, lazy, useCallback, useEffect, useState, type ComponentType } from 'react'
import { DemoPanel } from './components/DemoPanel'
import { Footer } from './components/Footer'
import { TopBar } from './components/TopBar'
import { Landing } from './screens/Landing'
import { AppProvider, useApp } from './state/AppContext'

// Only the landing page is bundled with the app shell. Every other screen loads on demand, so the first
// paint downloads the minimum. (The camera pipeline and the charts split off further inside their screens.)
const lazyScreen = <K extends string>(load: () => Promise<Record<K, ComponentType>>, name: K) => lazy(() => load().then((m) => ({ default: m[name] })))

const BodyMap = lazyScreen(() => import('./screens/BodyMap'), 'BodyMap')
const MirrorCheck = lazyScreen(() => import('./screens/mirror/MirrorCheck'), 'MirrorCheck')
const Progress = lazyScreen(() => import('./screens/Progress'), 'Progress')
const Manual = lazyScreen(() => import('./screens/Manual'), 'Manual')
const Escalation = lazyScreen(() => import('./screens/Escalation'), 'Escalation')
const Radiation = lazyScreen(() => import('./screens/Radiation'), 'Radiation')
const Medical = lazyScreen(() => import('./screens/Medical'), 'Medical')
const Metrics = lazyScreen(() => import('./screens/Metrics'), 'Metrics')
const Sources = lazyScreen(() => import('./screens/Sources'), 'Sources')

/** The two screens a visitor almost always opens first, fetched in the background once the page is idle. */
function prefetchLikelyScreens() {
  const run = () => {
    void import('./screens/BodyMap')
    void import('./screens/mirror/MirrorCheck')
  }
  if ('requestIdleCallback' in window) window.requestIdleCallback(run, { timeout: 4000 })
  else setTimeout(run, 2000)
}

function Screen() {
  const { screen, ready } = useApp()
  if (!ready) return <main className="p-8 text-muted">Loading crew data…</main>
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
  const { screen, ready } = useApp()
  const [demoOpen, setDemoOpen] = useState(false)
  const toggleDemo = useCallback(() => setDemoOpen((o) => !o), [])

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
    <div className="flex min-h-screen flex-col">
      {screen !== 'landing' && <TopBar />}
      {/* Target for the TopBar's "Skip to content" link (A1 accessibility pass). */}
      <div id="main" tabIndex={-1} className="flex flex-1 flex-col outline-none">
        <Suspense fallback={<main className="p-8 text-muted">Loading…</main>}>
          <Screen />
        </Suspense>
      </div>
      {/* Not shown until the data is ready: it names the crew's data label, and showing it early made it jump off-screen when the page filled in. */}
      {ready && <Footer />}
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
