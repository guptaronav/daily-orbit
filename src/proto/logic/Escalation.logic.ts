// @ts-nocheck
// GENERATED from the UI overhaul prototype: this is the prototype's own logic class, run
// unchanged through the DCLogic shim. Data comes from ../data, which reads the real database.
import React from 'react'
import * as D from '../data'
import { DCLogic, navigate } from '../dc'

export class EscalationLogic extends DCLogic {
  state = { s: null, rung: 0, json: false, sent: null, hold: 0 }
  componentDidMount() {
    Promise.resolve(D).then((D) => {
      this.D = D
      const s = D.getState()
      D.applyTheme(s.theme)
      this.setState({ s })
      setTimeout(() => D.reveal(), 60)
      this.off = D.onState(() => { const n = D.getState(); this.setState((p) => ({ s: n, sent: p.sent && p.sent.delay === n.delay && n.crew.id === p.s.crew.id ? p.sent : null })) })
    })
    this.tick = setInterval(() => { const t = this.state.sent; if (t && t.remaining > 0) this.setState({ sent: { ...t, remaining: t.remaining - 1 } }) }, 1000)
  }
  componentWillUnmount() { this.off && this.off(); clearInterval(this.tick); clearInterval(this.holdT) }
  send() {
    const sec = Math.round(this.state.s.delay)
    // Departure from the prototype: the transmission is kept, so the ground link can show when it lands.
    this.D.queuePacket(this.state.s.crew.id)
    this.setState({ sent: { remaining: sec, total: sec, delay: this.state.s.delay, arrival: new Date(Date.now() + sec * 1000).toLocaleTimeString() }, hold: 0 })
  }
  renderVals() {
    const D = this.D, s = this.state.s
    if (!D || !s) return { rungs: [], stats: [], changed: [], digits: [], crewName: '', envLabel: '', nChanged: '', txText: 'Hold to transmit (simulated)', idle: true }
    const pk = D.buildPacket(s.crew.id)
    const RUNGS = [
      ['01', 'Self-care', 'A reading moved a little and you already know what would help: rest, water, the scheduled exercise session, or simply retaking a reading the app could not trust.', 'check', 'This one moved a little. I’ll rest, drink some water and retake it later.'],
      ['02', 'Crewmate check', 'You want a second pair of eyes. Ask a crewmate to look at the same reading, or run the mirror check alongside you so you can compare.', 'eye', 'Can you look at this reading with me before I decide what to do?'],
      ['03', 'Crew medical officer', 'The change has stayed for more than a day or two, more than one indicator moved together, or you feel worse than the numbers suggest. The medical officer has the training and the onboard kit.', 'heart', 'This has stayed off for a couple of days, and I feel worse than the numbers say.'],
      ['04', 'Flight surgeon', 'The crew wants ground input. Send the change summary below, then keep going with onboard care while it crosses the gap: the answer cannot arrive sooner than the comm delay allows.', 'send', 'We’re sending the change summary to the ground and carrying on with onboard care while it travels.'],
    ]
    const rungs = RUNGS.map(([n, title, when, icon, quote], i) => {
      const open = this.state.rung === i, last = i === 3
      return {
        n, title, when, icon: D.ICONS[icon], quote, who: `${s.crew.name}, rung ${n}`, isOpen: open, open: String(open),
        toggle: () => this.setState({ rung: i }),
        shift: ['0px', '-56px', '28px', '-24px'][i], tag: i === 0 ? 'Start here' : 'You are here', aria: `Rung ${n}, ${title}`,
        nodeBg: ['#2f7d4f', '#0b3d91', '#b7791f', '#b3261e'][i], nodeShadow: ['#1b5b33', '#062559', '#7a4f00', '#6e1712'][i], nodeInk: '#ffffff', ring: ['#2f7d4f', '#0b3d91', '#b7791f', '#b3261e'][i],
        cardBg: ['#2f7d4f', '#0b3d91', '#7a4f00', '#8c1d18'][i], cardInk: '#ffffff',
        prev: () => this.setState({ rung: Math.max(0, i - 1) }), next: () => this.setState({ rung: Math.min(3, i + 1) }),
        noPrev: i === 0, noNext: i === 3, prevOp: i === 0 ? 0.35 : 1, nextOp: i === 3 ? 0.35 : 1,
      }
    })
    const t = this.state.sent
    const counting = !!(t && t.remaining > 0), delivered = !!(t && t.remaining <= 0)
    const prog = t && t.total > 0 ? (t.total - t.remaining) / t.total : 0
    const mm = t ? String(Math.floor(t.remaining / 60)).padStart(2, '0') + ':' + String(t.remaining % 60).padStart(2, '0') : '00:00'
    const holdStart = (e) => {
      if (this.state.sent) return
      clearInterval(this.holdT)
      const start = Date.now()
      this.holdT = setInterval(() => {
        const p = Math.min(1, (Date.now() - start) / 900)
        if (p >= 1) { clearInterval(this.holdT); this.send() } else this.setState({ hold: p })
      }, 30)
    }
    const holdEnd = () => { clearInterval(this.holdT); if (!this.state.sent) this.setState({ hold: 0 }) }
    return {
      crew: s.crew, crewName: s.crew.name, envLabel: s.env.label, delayText: D.formatDelay(s.delay), rungs,
      stats: [
        { k: 'Packet size', v: pk.bytes, u: 'bytes', color: 'var(--ink)' },
        { k: 'One-way delay', v: D.formatDelay(s.delay).split(' ')[0], u: D.formatDelay(s.delay).split(' ')[1], color: 'var(--accent)' },
        { k: 'Changes', v: pk.changed.length, u: 'indicators', color: pk.changed.length ? 'var(--watch-ink)' : 'var(--ink)' },
      ],
      nChanged: pk.changed.length, hasChanges: pk.changed.length > 0, noChanges: pk.changed.length === 0,
      changed: pk.changed.map((c) => ({ ...c, ink: D.STATUS[c.status].ink, swatch: D.STATUS[c.status].swatch, short: D.STATUS[c.status].short, delta: `${c.deltaPct > 0 ? '+' : ''}${c.deltaPct}%`, since: c.sinceDays === 0 ? 'since today' : `over ${c.sinceDays}d` })),
      json: pk.json, jsonOpen: this.state.json, jsonOpenStr: String(this.state.json), jsonRot: this.state.json ? 'rotate(180deg)' : 'none', toggleJson: () => this.setState({ json: !this.state.json }),
      pct: prog * 100 + '%', dotBg: t ? 'var(--accent)' : 'var(--rule-strong)', dotGlow: t ? '0 0 12px var(--accent)' : 'none',
      sending: !!t, idle: !t, counting, delivered, arrival: t ? t.arrival : '',
      digits: mm.split('').map((c) => ({ c, w: c === ':' ? '0.5em' : '1.15em', bg: c === ':' ? 'transparent' : 'color-mix(in srgb, var(--accent) 8%, var(--panel))', border: c === ':' ? '0' : '1px solid color-mix(in srgb, var(--accent) 30%, var(--rule))' })),
      holdStart, holdEnd, holdKey: (e) => { if ((e.key === 'Enter' || e.key === ' ') && !this.state.sent) { e.preventDefault(); this.send() } },
      holdPct: t ? '100%' : this.state.hold * 100 + '%', holdEase: this.state.hold ? '30ms linear' : '200ms ease',
      txBg: t ? 'transparent' : 'color-mix(in srgb, var(--accent) 14%, transparent)', txColor: t ? 'var(--muted)' : 'var(--ink)', txCursor: t ? 'not-allowed' : 'pointer',
      txText: t ? 'Transmitted' : this.state.hold ? 'Keep holding…' : 'Hold to transmit (simulated)',
      reset: () => this.setState({ sent: null, hold: 0 }),
      download: () => {
        const url = URL.createObjectURL(new Blob([pk.json], { type: 'application/json' }))
        const a = document.createElement('a'); a.href = url; a.download = `ground-packet-${s.crew.id}.json`; a.click(); URL.revokeObjectURL(url)
      },
    }
  }
}
