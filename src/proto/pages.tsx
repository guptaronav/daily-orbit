import { lazy, type ReactNode } from 'react'
import { useDC } from './dc'
import * as P from './parts'

/*
 * The overhaul pages. Each one is the prototype's own logic class feeding the prototype's own
 * markup, so what renders here is what the prototype renders, with real data underneath.
 */

const NO_PROPS = {}

/**
 * Each page loads its own view and logic on demand, so the first paint only downloads the page the
 * visitor is actually on (the views are 20 to 60 KB of markup each).
 */
const lazyPage = (load: () => Promise<{ View: (props: { v: never }) => ReactNode; Logic: never }>) =>
  lazy(async () => {
    const { View, Logic } = await load()
    function Page() {
      return <View v={useDC(Logic, NO_PROPS) as never} />
    }
    return { default: Page }
  })

export const LandingPage = lazyPage(async () => ({
  View: (await import('./LandingView')).LandingView,
  Logic: (await import('./logic/Landing.logic')).LandingLogic as never,
}))
export const BodyMapPage = lazyPage(async () => ({
  View: (await import('./BodyMapView')).BodyMapView,
  Logic: (await import('./logic/BodyMap.logic')).BodyMapLogic as never,
}))
export const ManualPage = lazyPage(async () => ({
  View: (await import('./ManualView')).ManualView,
  Logic: (await import('./logic/ManualEntry.logic')).ManualEntryLogic as never,
}))
/** The ladder, the ground packet and the ground link, drawn as a section of the Crew page. */
export const EscalationSection = lazy(async () => {
  const View = (await import('./EscalationView')).EscalationView
  const Logic = (await import('./logic/Escalation.logic')).EscalationLogic as never
  function Section() {
    return <View v={useDC(Logic, NO_PROPS) as never} embedded />
  }
  return { default: Section }
})
export const MedicalPage = lazyPage(async () => ({
  View: (await import('./MedicalView')).MedicalView,
  Logic: (await import('./logic/MedicalView.logic')).MedicalViewLogic as never,
}))
export const MetricsPage = lazyPage(async () => ({
  View: (await import('./MetricsView')).MetricsView,
  Logic: (await import('./logic/Metrics.logic')).MetricsLogic as never,
}))
export const RewardsPage = lazyPage(async () => ({
  View: (await import('./RewardsView')).RewardsView,
  Logic: (await import('./logic/Rewards.logic')).RewardsLogic as never,
}))
export const OnboardingPage = lazyPage(async () => ({
  View: (await import('./OnboardingView')).OnboardingView,
  Logic: (await import('./logic/Onboarding.logic')).OnboardingLogic as never,
}))

const ROOT_STYLE = P.S({
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  background: 'var(--paper)',
  color: 'var(--ink)',
  fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  fontVariantNumeric: 'tabular-nums',
})

/**
 * A screen the prototype did not draw (mirror check, radiation, sources), wearing the same
 * chrome the prototyped pages wear, so moving between them never changes the frame.
 */
export function ProtoFrame({ current, children }: { current: string; children: ReactNode }) {
  return (
    <div data-chm-root="1" style={ROOT_STYLE}>
      <P.TopBar current={current} />
      <div id="main" tabIndex={-1} style={{ flex: 1, outline: 'none' }}>
        {children}
      </div>
      <P.SiteFooter dock={true} />
      <P.CrewDock current={current} />
    </div>
  )
}
