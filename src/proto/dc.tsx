import { useEffect, useReducer, useRef } from 'react'
import type { Screen } from '../state/AppContext'
import { bridge, onChange } from './store'

/*
 * A tiny compatibility layer so the overhaul prototypes' own logic classes run inside React
 * unchanged. Each prototype page is a class with `state`, `setState`, `props`, the two mount
 * lifecycles and a `renderVals()` that returns everything its markup reads. `useDC` hosts one
 * instance per mounted component and re-renders when the instance calls setState or when the
 * app's data changes.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>

export class DCLogic<P extends AnyRecord = AnyRecord> {
  state: AnyRecord = {}
  props: P
  /** Set by useDC; calling it schedules a React render. */
  _rerender: () => void = () => {}

  constructor(props: P) {
    this.props = props
  }

  setState(patch: AnyRecord | ((prev: AnyRecord, props: P) => AnyRecord), cb?: () => void): void {
    const next = typeof patch === 'function' ? patch(this.state, this.props) : patch
    if (!next) return
    this.state = { ...this.state, ...next }
    this._rerender()
    cb?.()
  }

  componentDidMount(): void {}
  componentWillUnmount(): void {}
  renderVals(): AnyRecord {
    return {}
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useDC<P extends AnyRecord>(Logic: new (props: P) => DCLogic<P>, props: P): any {
  const [, force] = useReducer((x: number) => x + 1, 0)
  const ref = useRef<DCLogic<P> | null>(null)
  if (ref.current === null) ref.current = new Logic(props)
  const inst = ref.current
  inst.props = props
  inst._rerender = force

  useEffect(() => {
    inst.componentDidMount()
    const off = onChange(force)
    return () => {
      off()
      inst.componentWillUnmount()
    }
    // One instance for the component's lifetime, exactly like the prototype's runtime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return inst.renderVals()
}

/** The prototype links between pages by file name; this maps each to the app's screen. */
const PAGES: Record<string, Screen> = {
  'landing.dc.html': 'landing',
  'body map.dc.html': 'bodymap',
  'manual entry.dc.html': 'manual',
  'escalation.dc.html': 'escalation',
  'medical view.dc.html': 'medical',
  'metrics.dc.html': 'metrics',
  'rewards.dc.html': 'progress',
  'onboarding.dc.html': 'onboarding',
  'mirror.dc.html': 'mirror',
  'radiation.dc.html': 'radiation',
  'sources.dc.html': 'sources',
}

export function screenForHref(href: string | null | undefined): Screen | null {
  if (!href || href === '#') return null
  const file = decodeURIComponent(href.split('#')[0].split('?')[0].split('/').pop() ?? '').toLowerCase()
  return PAGES[file] ?? null
}

/** Route a prototype href through the app instead of the browser. */
export function navigate(href: string): void {
  const screen = screenForHref(href)
  if (screen) {
    bridge.go(screen)
    window.scrollTo({ top: 0 })
  }
}

/**
 * One capture-phase listener for the whole app: any click on a link to a prototype page becomes
 * an in-app navigation. Modified clicks (new tab) are left alone.
 */
export function usePrototypeLinks(): void {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = (e.target as HTMLElement | null)?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!a) return
      const href = a.getAttribute('href')
      if (href === '#') {
        e.preventDefault()
        return
      }
      if (!screenForHref(href)) return
      e.preventDefault()
      navigate(href!)
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [])
}
