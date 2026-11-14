// @ts-nocheck
// GENERATED from the UI overhaul prototype: this is the prototype's own logic class, run
// unchanged through the DCLogic shim. Data comes from ../data, which reads the real database.
import React from 'react'
import * as D from '../data'
import { DCLogic, navigate } from '../dc'

export class CrewDockLogic extends DCLogic {
  state = { s: null, hover: null, hoverAct: -1, goal: false, collapsed: false, narrow: false }
  rootRef = React.createRef()
  componentDidMount() {
    try { this.setState({ collapsed: localStorage.getItem('chm-dock-min') === '1' }) } catch {}
    Promise.resolve(D).then((D) => { this.D = D; this.setState({ s: D.getState() }); this.off = D.onState(() => this.setState({ s: D.getState() })) })
    this.onKey = (e) => {
      const el = e.target
      if (!this.D || (el && (['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) || el.isContentEditable)) || e.metaKey || e.ctrlKey || e.altKey) return
      const n = Number(e.key)
      if (n >= 1 && n <= this.D.CREW.length) this.D.setState({ crewId: this.D.CREW[n - 1].id })
      if (e.key === 'Escape') this.setState({ goal: false, hover: null })
    }
    this.onDoc = (e) => { if (this.state.goal && this.rootRef.current && !this.rootRef.current.contains(e.target)) this.setState({ goal: false }) }
    this.onResize = () => { const n = window.innerWidth < 820; if (n !== this.state.narrow) this.setState({ narrow: n }) }
    this.onResize()
    window.addEventListener('resize', this.onResize)
    window.addEventListener('keydown', this.onKey)
    document.addEventListener('pointerdown', this.onDoc)
  }
  componentWillUnmount() { this.off && this.off(); window.removeEventListener('resize', this.onResize); window.removeEventListener('keydown', this.onKey); document.removeEventListener('pointerdown', this.onDoc) }
  renderVals() {
    const D = this.D, s = this.state.s
    const leave = () => this.setState({ hover: null, hoverAct: -1 })
    const toggleCollapse = () => this.setState((p) => { const c = !p.collapsed; try { localStorage.setItem('chm-dock-min', c ? '1' : '0') } catch {} return { collapsed: c, goal: false, hover: null } })
    if (!D || !s) return { crew: [], actions: [], systems: [], leave, toggleCollapse, expanded: true, collapsed: false, popCrew: false, popGoal: false, rootRef: this.rootRef }
    const hv = this.state.hover
    const hIdx = D.CREW.findIndex((c) => c.id === hv)
    const C = 2 * Math.PI * 22
    const crew = D.CREW.map((c, i) => {
      const g = D.game(c.id), st = D.STATUS[D.crewData(c.id).worst], active = c.id === s.crew.id
      const tasks = D.todayTasks(c.id).filter((t) => !t.optional)
      const frac = tasks.filter((t) => t.done).length / tasks.length
      const d = hIdx < 0 ? 9 : Math.abs(hIdx - i)
      return {
        crew: c, gear: D.gear(c.id), active: String(active), ring: st.swatch, ringColor: active ? 'var(--accent)' : 'var(--ink-soft)', dash: `${C * frac} ${C}`,
        streak: g.streak, labelColor: active ? 'var(--accent)' : 'var(--muted)',
        scale: d === 0 ? 'translateY(-6px) scale(1.16)' : d === 1 ? 'translateY(-2px) scale(1.06)' : active ? 'translateY(-2px)' : 'none',
        aria: `Act as ${c.name}. ${st.label}. ${g.streak} day streak. Press ${i + 1}.`,
        pick: () => D.setState({ crewId: c.id }), enter: () => this.setState({ hover: c.id, hoverAct: -1, goal: false }),
      }
    })
    let pop = {}
    if (hIdx >= 0) {
      const c = D.CREW[hIdx], g = D.game(c.id), st = D.STATUS[D.crewData(c.id).worst]
      pop = {
        crew: c, gear: D.gear(c.id), name: c.name, role: c.role, ring: st.swatch, word: st.label, ink: st.ink, chipBg: `color-mix(in srgb, ${st.swatch} 16%, transparent)`,
        streak: g.streak, week: g.week, days: g.days.map((x) => (x ? 'var(--accent)' : 'var(--paper-deep)')),
        hint: c.id === s.crew.id ? 'You are acting as this crew member' : 'Click or press to act as', key: String(hIdx + 1),
        left: 8 + 29 + hIdx * 60 + 'px', aria: `${c.name} summary`,
      }
    }
    const tasks = D.todayTasks(s.crew.id).filter((t) => !t.optional)
    const done = tasks.filter((t) => t.done).length
    const C2 = 2 * Math.PI * 17
    const here = this.props.current || ''
    const acts = [
      { label: 'Body map', href: 'Body%20Map.dc.html', icon: 'body' },
      { label: 'Log a reading', match: 'Manual entry', href: 'Manual%20Entry.dc.html', icon: 'pen' },
      { label: 'Escalate', match: 'Escalation', href: 'Escalation.dc.html', icon: 'send' },
      { label: 'Medical view', href: 'Medical%20View.dc.html', icon: 'users' },
    ]
    const actions = acts.map((a, j) => {
      const on = (a.match || a.label) === here
      return { ...a, path: D.ICONS[a.icon], current: on ? 'page' : undefined, hover: this.state.hoverAct === j, enter: () => this.setState({ hoverAct: j, hover: null }), bg: on ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'transparent', color: on ? 'var(--accent)' : 'var(--ink)' }
    })
    const goal = D.crewGoal()
    const pct = Math.round(goal.frac * 100)
    return {
      rootRef: this.rootRef, leave, toggleCollapse, collapsed: this.state.collapsed, expanded: !this.state.collapsed,
      crew, popCrew: hIdx >= 0 && !this.state.collapsed && !this.state.narrow, pop, activeCrew: s.crew, activeGear: D.gear(s.crew.id),
      crewDisplay: this.state.narrow ? 'none' : 'flex', goalDisplay: this.state.narrow ? 'none' : 'flex',
      checkIn: () => { const next = tasks.find((t) => !t.done); if (next) D.completeTask(s.crew.id, next.id) },
      checkAria: done === tasks.length ? 'All check-ins done today' : 'Complete the next check-in for today (demo)',
      actions, flameIcon: D.ICONS.flame, scanIcon: D.ICONS.scan, minIcon: D.ICONS.minimize, maxIcon: D.ICONS.maximize,
      checkLabel: done === tasks.length ? 'All done today' : 'Check in', todayText: done === tasks.length ? 'Come back tomorrow' : `${done} of ${tasks.length} today · +${D.POINTS.checkInComplete} coins`,
      todayDash: `${C2 * (done / tasks.length)} ${C2}`,
      popGoal: this.state.goal && !this.state.collapsed, goalOpenStr: String(this.state.goal), toggleGoal: () => this.setState((p) => ({ goal: !p.goal, hover: null })),
      goalBg: this.state.goal ? 'color-mix(in srgb, var(--ink) 6%, transparent)' : 'transparent',
      goalWeek: goal.week, goalTarget: goal.goal, goalPct: pct + '%', goalPctNum: pct,
      systems: goal.systems.map((x) => ({ name: x.name, state: x.online ? 'Online' : `Unlocks at ${x.threshold} pts`, color: x.online ? 'var(--ink)' : 'var(--muted)' })),
    }
  }
}
