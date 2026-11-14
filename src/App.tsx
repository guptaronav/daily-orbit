import { Footer } from './components/Footer'
import { TopBar } from './components/TopBar'
import { Landing } from './screens/Landing'
import { AppProvider, useApp } from './state/AppContext'

function Screen() {
  const { screen, ready } = useApp()
  if (!ready) return <main className="p-8 text-muted">Loading crew data…</main>
  if (screen === 'landing') return <Landing />
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
