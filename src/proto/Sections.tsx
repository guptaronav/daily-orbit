import { useEffect, useState, type ReactNode } from 'react'
import * as D from './data'
import { bridge } from './store'
import { useStoreTick } from './shared'

/*
 * Section tabs for the long pages (Body and Log): one row of tabs under the page header, and only
 * the chosen section is shown. Hidden sections stay mounted (display: none), so their scroll logic
 * and state keep working. Any button can open a page on a given section with openSection().
 */

export type BodyTab = 'tour' | 'readings' | 'patterns' | 'hazards' | 'forecast'
export type LogTab = 'readings' | 'food' | 'alertness' | 'checks'
type Page = 'body' | 'log'

const current: { body: BodyTab; log: LogTab } = { body: 'tour', log: 'readings' }
const SCREEN: Record<Page, string> = { body: 'bodymap', log: 'manual' }

export function setSection(page: 'body', tab: BodyTab): void
export function setSection(page: 'log', tab: LogTab): void
export function setSection(page: Page, tab: string) {
  ;(current as Record<Page, string>)[page] = tab
  window.dispatchEvent(new CustomEvent('section:change', { detail: { page, tab } }))
}

/** Go to a page and show one of its sections (scrolled to the top of the page). */
export function openSection(page: 'body', tab: BodyTab): void
export function openSection(page: 'log', tab: LogTab): void
export function openSection(page: Page, tab: string) {
  setSection(page as never, tab as never)
  bridge.go?.(SCREEN[page] as never)
  setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 60)
}

/** The radiation replay sits at the bottom of Body's Five hazards tab: open it and scroll to it. */
export function openRadiation() {
  openSection('body', 'hazards')
  scrollToWhenReady('radiation-replay')
}

/** Who to tell and the link to Earth sit at the bottom of the Crew page. */
export function openEarthLink() {
  bridge.go?.('medical' as never)
  scrollToWhenReady('earth-link')
}

/** Scroll to an element once a page (and any lazy part of it) has drawn it. */
function scrollToWhenReady(id: string) {
  let tries = 0
  const find = () => {
    const el = document.getElementById(id)
    // Wait for the scroll to the top and the layout to settle, then jump.
    if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 450)
    else if (tries++ < 40) setTimeout(find, 100)
  }
  setTimeout(find, 160)
}

export function useSection<T extends string>(page: Page): T {
  const [tab, setTab] = useState<string>(current[page])
  useEffect(() => {
    const on = (e: Event) => {
      const d = (e as CustomEvent).detail as { page: Page; tab: string }
      if (d.page === page) setTab(d.tab)
    }
    window.addEventListener('section:change', on)
    return () => window.removeEventListener('section:change', on)
  }, [page])
  return tab as T
}

export function SectionTabs<T extends string>({ page, tabs, label }: { page: Page; tabs: { id: T; label: string; badge?: string }[]; label: string }) {
  const tab = useSection<T>(page)
  return (
    <div role="tablist" aria-label={label} className="section-tabs">
      {tabs.map((t) => (
        <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setSection(page as never, t.id as never)} className="section-tab">
          {t.label}
          {t.badge && <span className="section-badge">{t.badge}</span>}
        </button>
      ))}
    </div>
  )
}

/** A section of a tabbed page: shown only when its tab is chosen, but kept mounted. */
export function Section({ page, id, children }: { page: Page; id: string; children: ReactNode }) {
  const tab = useSection(page)
  return (
    <div role="tabpanel" hidden={tab !== id} style={{ display: tab === id ? 'grid' : 'none', gridTemplateColumns: 'minmax(0, 1fr)', gap: 18 }}>
      {children}
    </div>
  )
}

/** The Body page's tabs, with how many patterns and hazards need a look. */
export function BodyTabs() {
  useStoreTick()
  const id = D.getState().crew.id as string
  const pats = (D.patterns(id) as unknown[]).length
  const hz = (D.hazards(id) as { status: string }[]).filter((h) => h.status === 'yellow' || h.status === 'red').length
  return (
    <SectionTabs<BodyTab>
      page="body"
      label="Body sections"
      tabs={[
        { id: 'tour', label: 'Body tour' },
        { id: 'readings', label: 'Readings' },
        { id: 'patterns', label: 'Patterns', badge: pats ? String(pats) : undefined },
        { id: 'hazards', label: 'Five hazards', badge: hz ? String(hz) : undefined },
        { id: 'forecast', label: 'Forecast' },
      ]}
    />
  )
}

/** The Log page's tabs. */
export function LogTabs() {
  useStoreTick()
  const id = D.getState().crew.id as string
  const weekly = D.weeklyCheckAge(id) as number | null
  const intake = D.intake(id) as { water: number; goal: number }
  return (
    <SectionTabs<LogTab>
      page="log"
      label="Log sections"
      tabs={[
        { id: 'readings', label: 'Readings' },
        { id: 'food', label: 'Food and water', badge: intake.water >= intake.goal ? undefined : `${Math.round((intake.water / Math.max(0.1, intake.goal)) * 100)}%` },
        { id: 'alertness', label: 'Alertness' },
        { id: 'checks', label: 'Body checks', badge: weekly === null || weekly >= 7 ? 'due' : undefined },
      ]}
    />
  )
}
