import type { CSSProperties } from 'react'
import { AvatarView } from './AvatarView'
import { BodyFigureView } from './BodyFigureView'
import { CrewDockView } from './CrewDockView'
import { useDC } from './dc'
import { AvatarLogic } from './logic/Avatar.logic'
import { BodyFigureLogic } from './logic/BodyFigure.logic'
import { CrewDockLogic } from './logic/CrewDock.logic'
import { SiteFooterLogic } from './logic/SiteFooter.logic'
import { TopBarLogic } from './logic/TopBar.logic'
import { SiteFooterView } from './SiteFooterView'
import { TopBarView } from './TopBarView'

/** The prototype's inline styles include custom properties; this lets them through the type check. */
export const S = (o: Record<string, unknown>): CSSProperties => o as CSSProperties

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Props = Record<string, any>

/** Each prototype component: its own logic class, run through the shim, feeding its own markup. */
export function Avatar(props: Props) {
  return <AvatarView v={useDC(AvatarLogic, props)} />
}

export function BodyFigure(props: Props) {
  return <BodyFigureView v={useDC(BodyFigureLogic, props)} />
}

export function TopBar(props: Props) {
  return <TopBarView v={useDC(TopBarLogic, props)} />
}

export function CrewDock(props: Props) {
  return <CrewDockView v={useDC(CrewDockLogic, props)} />
}

export function SiteFooter(props: Props) {
  return <SiteFooterView v={useDC(SiteFooterLogic, props)} />
}
