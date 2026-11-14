// @ts-nocheck
// GENERATED from the UI overhaul prototype: this is the prototype's own logic class, run
// unchanged through the DCLogic shim. Data comes from ../data, which reads the real database.
import React from 'react'
import * as D from '../data'
import { DCLogic, navigate } from '../dc'

export class MedicalViewLogic extends DCLogic {
  state = { s: null, hot: null, only: false }
  componentDidMount() {
    Promise.resolve(D).then((D) => {
      this.D = D
      const s = D.getState()
      D.applyTheme(s.theme)
      this.setState({ s })
      this.off = D.onState(() => this.setState({ s: D.getState() }))
    })
  }
  componentWillUnmount() { this.off && this.off() }
  renderVals() {
    const D = this.D, s = this.state.s, only = this.state.only
    const filters = [['Everyone', false], ['Needs attention', true]].map(([label, v]) => { const on = only === v; return { label, on: String(on), pick: () => this.setState({ only: v }), bg: on ? 'var(--panel)' : 'transparent', color: on ? 'var(--ink)' : 'var(--muted)', shadow: on ? '0 1px 2px rgba(20,24,31,.1), 0 4px 12px -6px rgba(20,24,31,.25)' : 'none' } })
    const leave = () => this.setState({ hot: null })
    if (!D || !s) return { filters, views: [], leave }
    const SEV = { red: 0, yellow: 1, gray: 2, green: 3 }
    const chip = (st) => `color-mix(in srgb, ${D.STATUS[st].swatch} 16%, transparent)`
    const all = D.CREW.map((c) => ({ c, d: D.crewData(c.id) })).sort((a, b) => SEV[a.d.worst] - SEV[b.d.worst])
    const nAttn = all.filter((x) => x.d.flagged.length).length
    const shown = only ? all.filter((x) => x.d.flagged.length) : all
    const views = shown.map(({ c, d }, i) => {
      const st = D.STATUS[d.worst], hot = this.state.hot === c.id, cur = c.id === s.crew.id, w = D.wallet(c.id), lv = D.level(w.xp), gr = D.gear(w)
      return {
        crew: c, name: c.id === 'guest' ? 'Guest' : c.name, gear: gr, banner: gr.banner.bg, lvl: lv.n, rank: lv.rank, streak: D.game(c.id).streak, coins: w.coins,
        uid: 'mv' + c.id.replace(/\W/g, ''), statuses: d.statuses, word: st.label, chipBg: 'rgba(251,250,246,.92)', chipInk: st.ink,
        regions: D.REGIONS.map((g) => { const rs = d.statuses[g.id]; return { label: g.label === 'Gut and nutrition' ? 'Gut' : g.label, word: { green: 'Normal', yellow: 'Watch', red: 'Act', gray: 'No data' }[rs], bg: chip(rs), ink: D.STATUS[rs].ink } }),
        cells: D.REGIONS.flatMap((g) => g.indicators).map((ind) => (d.readings[ind].latest ? D.STATUS[d.readings[ind].status].swatch : 'var(--paper-deep)')),
        measured: `${d.withData} of ${d.total}`, delay: i * 90 + 'ms',
        border: cur ? 'var(--ink)' : hot ? 'var(--rule-strong)' : 'var(--rule)', lift: hot ? 'translateY(-6px)' : 'none', shadow: hot ? '0 24px 40px -24px rgba(20,24,31,.45)' : 'none',
        btn: cur ? 'Back to your console' : `Open ${c.id === 'guest' ? 'guest' : c.name} console`, btnBg: cur ? 'var(--ink)' : 'var(--panel)', btnInk: cur ? 'var(--paper)' : 'var(--ink)', btnShadow: cur ? '#000' : 'var(--rule-strong)',
        arrowX: hot ? 'translateX(4px)' : 'none',
        enter: () => this.setState({ hot: c.id }), open: () => D.setState({ crewId: c.id }),
      }
    })
    const goal = D.crewGoal(), C = 2 * Math.PI * 50
    const online = goal.systems.filter((x) => x.online).length, next = goal.systems.find((x) => !x.online)
    return {
      filters, leave, views, flame: D.ICONS.flame, nCrew: all.length, nAttn, emptyFilter: only && shown.length === 0,
      goalDash: `${C * goal.frac} ${C}`, goalPct: Math.round(goal.frac * 100) + '%', goalWeek: goal.week, goalTarget: goal.goal,
      systemsText: `${online} of ${goal.systems.length} ship systems online`,
    }
  }
}
