// @ts-nocheck
// GENERATED from the UI overhaul prototype: this is the prototype's own logic class, run
// unchanged through the DCLogic shim. Data comes from ../data, which reads the real database.
import React from 'react'
import * as D from '../data'
import { DCLogic, navigate } from '../dc'

export class TopBarLogic extends DCLogic {
  state = { open: null, s: null, w: null, bump: 0, float: '', narrow: false }
  rootRef = React.createRef()
  componentDidMount() {
    Promise.resolve(D).then((D) => {
      this.D = D
      const load = () => { const s = D.getState(); this.setState({ s, w: D.wallet(s.crew.id) }) }
      load()
      this.off = D.onState(load)
    })
    this.onCoins = (e) => { const n = e.detail && e.detail.n; this.setState((p) => ({ bump: p.bump + 1, float: n ? `+${n}` : '' })) }
    this.onDoc = (e) => { if (this.state.open && this.rootRef.current && !this.rootRef.current.contains(e.target)) this.setState({ open: null }) }
    this.onKey = (e) => { if (e.key === 'Escape') this.setState({ open: null }) }
    this.onResize = () => { const n = window.innerWidth < 1100; if (n !== this.state.narrow) this.setState({ narrow: n }) }
    this.onResize()
    window.addEventListener('chm:coins', this.onCoins)
    window.addEventListener('resize', this.onResize)
    document.addEventListener('pointerdown', this.onDoc)
    document.addEventListener('keydown', this.onKey)
  }
  componentWillUnmount() {
    this.off && this.off()
    window.removeEventListener('chm:coins', this.onCoins); window.removeEventListener('resize', this.onResize)
    document.removeEventListener('pointerdown', this.onDoc); document.removeEventListener('keydown', this.onKey)
  }
  tog(k) { return () => this.setState((s) => ({ open: s.open === k ? null : k })) }
  renderVals() {
    const D = this.D, s = this.state.s, w = this.state.w, open = this.state.open
    const base = { rootRef: this.rootRef, toggleMore: this.tog('more'), toggleEnv: this.tog('env'), toggleMe: this.tog('me'), moreOpen: open === 'more', envOpen: open === 'env', meOpen: open === 'me', navOrder: this.state.narrow ? 3 : 1, navFlex: this.state.narrow ? '1 1 100%' : '0 1 auto' }
    if (!D || !s || !w) return { ...base, links: [], more: [], envItems: [], crewItems: [], coins: '', streak: '', envShort: '', delayText: '' }
    const here = this.props.current || ''
    const L = [
      ['Console', 'Body map', 'Body%20Map.dc.html', 'body'], ['Log', 'Manual entry', 'Manual%20Entry.dc.html', 'pen'],
      ['Escalate', 'Escalation', 'Escalation.dc.html', 'send'], ['Crew', 'Medical view', 'Medical%20View.dc.html', 'users'],
      ['Rewards', 'Rewards', 'Rewards.dc.html', 'award'],
    ]
    const links = L.map(([label, match, href, icon]) => {
      const on = here === match
      return { label, href, icon: D.ICONS[icon], current: on ? 'page' : undefined, bg: on ? 'var(--panel)' : 'transparent', color: on ? 'var(--ink)' : 'var(--muted)', shadow: on ? '0 1px 2px rgba(20,24,31,.1), 0 4px 12px -6px rgba(20,24,31,.25)' : 'none', weight: on ? 600 : 500 }
    })
    // Departure from the prototype: it disabled screens it had not drawn. They exist in the app, so they link.
    const M = [
      ['Metrics', 'Two simulated numbers, assumptions open', 'Metrics.dc.html', 'chart'],
      ['Set up again', 'Replay the one-minute onboarding', 'Onboarding.dc.html', 'spark'],
      ['Mirror check', 'Thirty seconds of camera, then four questions', 'Mirror.dc.html', 'scan'],
      ['Crew progress', 'Points for effort, never for values', 'Rewards.dc.html', 'award'],
      ['Radiation', 'Replay a historical solar particle event', 'Radiation.dc.html', 'shield'],
      ['Sources', 'Every NASA dataset and page used', 'Sources.dc.html', 'book'],
    ]
    const more = M.map(([label, desc, href, icon]) => ({ label, desc: href ? desc : `${desc} · not in this pass`, href: href || undefined, disabled: href ? undefined : 'true', op: href ? 1 : 0.5, cursor: href ? 'pointer' : 'not-allowed', path: D.ICONS[icon], tileBg: href ? 'var(--ink)' : 'var(--paper-deep)', tileColor: href ? 'var(--paper)' : 'var(--muted)' }))
    const g = D.game(s.crew.id), lv = D.level(w.xp), gr = D.gear(w)
    const envItems = D.ENVS.map((e) => { const a = e.id === s.env.id; return { ...e, active: String(a), delayText: D.formatDelay(e.delay), checkOp: a ? 1 : 0, bg: a ? 'var(--panel-2)' : 'transparent', pick: () => D.setState({ envId: e.id }) } })
    const adjustable = s.env.min !== undefined
    const crewItems = D.CREW.map((c) => { const a = c.id === s.crew.id; return { crew: c, gear: D.gear(c.id), active: String(a), ring: D.STATUS[D.crewData(c.id).worst].swatch, bg: a ? 'var(--panel-2)' : 'transparent', border: a ? 'var(--ink)' : 'transparent', pick: () => D.setState({ crewId: c.id }) } })
    const deck = s.theme === 'deck'
    return {
      ...base, links, more, moreBg: open === 'more' ? 'var(--panel)' : 'transparent', moreRot: open === 'more' ? 'rotate(180deg)' : 'none',
      envShort: s.env.id === 'iss' ? 'ISS' : s.env.id === 'lunar' ? 'Moon' : 'Mars', delayText: D.formatDelay(s.delay), envItems, adjustable,
      delay: s.delay, dMin: s.env.min, dMax: s.env.max, dPct: adjustable ? ((s.delay - s.env.min) / (s.env.max - s.env.min)) * 100 + '%' : '0%',
      dMinText: adjustable ? D.formatDelay(s.env.min) : '', dMaxText: adjustable ? D.formatDelay(s.env.max) : '', setDelay: (e) => D.setState({ delay: Number(e.target.value) }),
      coins: w.coins.toLocaleString(), streak: g.streak, flameIcon: D.ICONS.flame, walletAria: `${g.streak} day streak, ${w.coins} coins. Open rewards.`,
      bumpKey: this.state.bump, bumpAnim: this.state.bump ? 'chm-bump 520ms cubic-bezier(.34,1.56,.64,1)' : 'none', floatText: this.state.bump ? this.state.float : '',
      crew: s.crew, gear: gr, lvl: lv.n, ring: D.STATUS[D.crewData(s.crew.id).worst].swatch, meAria: `${s.crew.name}, level ${lv.n}. Open profile menu.`,
      crewName: s.crew.name, crewRole: s.crew.role, rank: lv.rank, nextLvl: lv.n + 1, xpText: `${lv.into} / ${lv.need} XP`, xpPct: lv.frac * 100 + '%', xpPctNum: Math.round(lv.frac * 100),
      bannerBg: gr.banner.bg, crewItems,
      isDeck: String(deck), swBg: deck ? 'var(--ink)' : 'var(--rule-strong)', swX: deck ? 'translateX(18px)' : 'none',
      toggleTheme: () => D.setState({ theme: deck ? 'paper' : 'deck' }),
    }
  }
}
