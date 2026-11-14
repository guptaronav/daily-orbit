// @ts-nocheck
// GENERATED from the UI overhaul prototype: this is the prototype's own logic class, run
// unchanged through the DCLogic shim. Data comes from ../data, which reads the real database.
import React from 'react'
import * as D from '../data'
import { DCLogic, navigate } from '../dc'

export class LandingLogic extends DCLogic {
  state = { s: null, hot: -1, faq: 0 }
  componentDidMount() {
    Promise.resolve(D).then((D) => {
      this.D = D
      const s = D.getState()
      D.applyTheme(s.theme)
      this.setState({ s })
      setTimeout(() => D.reveal(), 60)
      this.off = D.onState(() => this.setState({ s: D.getState() }))
    })
  }
  componentWillUnmount() { this.off && this.off() }
  ecg() {
    let d = 'M0 40'
    for (let i = 0; i < 6; i++) { const x = i * 200, w = 200; d += ` H${x + w * 0.34} L${x + w * 0.4} 34 L${x + w * 0.46} 44 L${x + w * 0.52} 14 L${x + w * 0.58} 58 L${x + w * 0.64} 40 H${x + w}` }
    return d
  }
  renderVals() {
    const D = this.D, s = this.state.s
    const QA = [
      ['What does gray mean?', 'Not enough good data. A reading that failed the quality check is never colored, and a region with no passing reading stays gray.'],
      ['What is each reading compared with?', 'That person’s own baseline: the spread of their earlier readings that passed quality. Watch and act mean it moved away from their own normal. These are not clinical thresholds.'],
      ['Does my camera video leave the device?', 'No. Camera frames never leave the browser, and nothing is uploaded.'],
      ['Does it work without a connection?', 'Yes. It runs offline after first load.'],
      ['What do coins reward?', 'Doing the check, logging, and reporting honestly. Never the health values themselves.'],
      ['Is this a medical device?', 'No. Prototype. Not a medical device.'],
    ]
    const faq = QA.map(([q, a], i) => { const open = this.state.faq === i; return { q, a, isOpen: open, open: String(open), rot: open ? 'rotate(45deg)' : 'none', bg: open ? '#14181f' : 'var(--paper-deep)', ink: open ? '#f3f1ea' : 'var(--ink)', toggle: () => this.setState({ faq: open ? -1 : i }) } })
    const leave = () => this.setState({ hot: -1 })
    if (!D || !s) return { faq, leave, steps: [], orbit: [], heroChips: [], heroStats: [], perks: [], showcase: [], ecg: this.ecg() }
    const w = D.wallet(s.crew.id), g = D.game(s.crew.id), lv = D.level(w.xp), gr = D.gear(w)
    const S = [
      ['01', 'Mirror check', 'Thirty seconds of camera for pulse and eyelids, then four short questions. Bad light? It refuses to guess.', 'Start the check', 'Mirror.dc.html', 'scan'],
      ['02', 'Body tour', 'Zoom through an X-ray view of every region against your own 30-day normal.', 'Open the console', 'Body%20Map.dc.html', 'body'],
      ['03', 'Who to tell', 'Four rungs from self-care to flight surgeon, with a ground packet and a comm-delay countdown.', 'See the ladder', 'Escalation.dc.html', 'send'],
      ['04', 'Earn the gear', 'Streaks, daily crates, a mission pass and a locker of frames, visors and patches.', 'Open rewards', 'Rewards.dc.html', 'award'],
    ]
    const steps = S.map(([n, title, body, cta, href, icon], i) => {
      const h = this.state.hot === i
      return { n, title, body, cta, href, icon: D.ICONS[icon], enter: () => this.setState({ hot: i }), bg: h ? '#14181f' : 'var(--panel-2)', ink: h ? '#f3f1ea' : 'var(--ink)', tile: h ? '#f6c445' : '#14181f', tileInk: h ? '#3b2a00' : '#f3f1ea', lift: h ? 'translateY(-6px)' : 'none', arrow: h ? 'translateX(4px)' : 'none' }
    })
    const others = D.CREW.filter((c) => c.id !== s.crew.id)
    const orbit = others.map((c, i) => { const a = (i / others.length) * Math.PI * 2 - Math.PI / 2; return { crew: c, gear: D.gear(c.id), x: 50 + Math.cos(a) * 50 + '%', y: 50 + Math.sin(a) * 50 + '%' } })
    const SHOW = ['frame-holo', 'visor-gold', 'suit-orange', 'patch-mars', 'top-halo', 'banner-stars']
    const goal = D.crewGoal()
    return {
      faq, leave, steps, orbit, ecg: this.ecg(), scanIcon: D.ICONS.scan, bodyIcon: D.ICONS.body,
      me: s.crew, myGear: gr, myLvl: lv.n,
      heroChips: [
        { k: 'Streak', v: `${g.streak} days`, color: '#ffb066', delay: '500ms' },
        { k: 'Coins', v: w.coins.toLocaleString(), color: '#f6c445', delay: '600ms' },
        { k: 'Rank', v: `${lv.rank} · Lv ${lv.n}`, color: '#f3f1ea', delay: '700ms' },
      ],
      heroStats: [{ k: 'Daily check', v: '30 s' }, { k: 'Crew goal this week', v: Math.round(goal.frac * 100) + '%' }, { k: 'Ship systems online', v: `${goal.systems.filter((x) => x.online).length} / ${goal.systems.length}` }],
      perks: [
        { t: 'Daily supply crate, 10 to 30 coins', icon: D.ICONS.award },
        { t: 'Streak rewards at 3, 7, 14 and 30 days', icon: D.ICONS.flame },
        { t: 'A 10-tier mission pass each season', icon: D.ICONS.zap },
        { t: 'Badges for honest reporting, never for numbers', icon: D.ICONS.check },
      ],
      showcase: SHOW.map((id) => { const it = D.SHOP.find((x) => x.id === id); return { name: it.name, price: it.price, gear: { ...gr, [it.slot]: it }, stage: it.slot === 'banner' ? it.bg : 'var(--panel-2)' } }),
    }
  }
}
