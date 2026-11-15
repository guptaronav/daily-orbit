import type { ReactNode } from 'react'
import { BodyMapView } from './BodyMapView'
import { useDC } from './dc'
import { EscalationView } from './EscalationView'
import { LandingView } from './LandingView'
import { BodyMapLogic } from './logic/BodyMap.logic'
import { EscalationLogic } from './logic/Escalation.logic'
import { LandingLogic } from './logic/Landing.logic'
import { ManualEntryLogic } from './logic/ManualEntry.logic'
import { MedicalViewLogic } from './logic/MedicalView.logic'
import { MetricsLogic } from './logic/Metrics.logic'
import { OnboardingLogic } from './logic/Onboarding.logic'
import { RewardsLogic } from './logic/Rewards.logic'
import { ManualView } from './ManualView'
import { MedicalView } from './MedicalView'
import { MetricsView } from './MetricsView'
import { OnboardingView } from './OnboardingView'
import * as P from './parts'
import { RewardsView } from './RewardsView'

/*
 * The overhaul pages. Each one is the prototype's own logic class feeding the prototype's own
 * markup, so what renders here is what the prototype renders, with real data underneath.
 */

const NO_PROPS = {}

export const LandingPage = () => <LandingView v={useDC(LandingLogic, NO_PROPS)} />
export const BodyMapPage = () => <BodyMapView v={useDC(BodyMapLogic, NO_PROPS)} />
export const ManualPage = () => <ManualView v={useDC(ManualEntryLogic, NO_PROPS)} />
export const EscalationPage = () => <EscalationView v={useDC(EscalationLogic, NO_PROPS)} />
export const MedicalPage = () => <MedicalView v={useDC(MedicalViewLogic, NO_PROPS)} />
export const MetricsPage = () => <MetricsView v={useDC(MetricsLogic, NO_PROPS)} />
export const RewardsPage = () => <RewardsView v={useDC(RewardsLogic, NO_PROPS)} />
export const OnboardingPage = () => <OnboardingView v={useDC(OnboardingLogic, NO_PROPS)} />

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
