import { Footer } from './components/Footer'
import { TopBar } from './components/TopBar'
import { BodyMap } from './screens/BodyMap'
import { Escalation } from './screens/Escalation'
import { Landing } from './screens/Landing'
import { Manual } from './screens/Manual'
import { Medical } from './screens/Medical'
import { Metrics } from './screens/Metrics'
import { Radiation } from './screens/Radiation'
import { Sources } from './screens/Sources'
import { MirrorCheck } from './screens/mirror/MirrorCheck'
import { AppProvider, useApp } from './state/AppContext'

function Screen() {
  const { screen, ready } = useApp()
  if (!ready) return <main className="p-8 text-muted">Loading crew data…</main>
  if (screen === 'landing') return <Landing />
  if (screen === 'bodymap') return <BodyMap />
  if (screen === 'mirror') return <MirrorCheck />
  if (screen === 'manual') return <Manual />
  if (screen === 'escalation') return <Escalation />
  if (screen === 'radiation') return <Radiation />
  if (screen === 'medical') return <Medical />
  if (screen === 'metrics') return <Metrics />
  if (screen === 'sources') return <Sources />
  // Remaining screens land in later plan tasks.
  return <main className="p-8 text-muted">Screen "{screen}" is not built yet.</main>
}

function Shell() {
  const { screen } = useApp()
  return (
    <div className="flex min-h-screen flex-col">
      {screen !== 'landing' && <TopBar />}
      <Screen />
      <Footer />
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
