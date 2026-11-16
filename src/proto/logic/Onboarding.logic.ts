// @ts-nocheck
// GENERATED from the UI overhaul prototype: this is the prototype's own logic class, run
// unchanged through the DCLogic shim. Data comes from ../data, which reads the real database.
import React from 'react'
import * as D from '../data'
import { DCLogic, navigate } from '../dc'

export class OnboardingLogic extends DCLogic {
  state = { step: 0, crewId: null, envId: null, goal: 'regular', a4: null, a5: null, checked: false, visor: 'visor-std', suit: 'suit-white', shown: 0, shake: 0 }
  componentDidMount() {
    Promise.resolve(D).then((D) => {
      this.D = D
      const s = D.getState()
      D.applyTheme(s.theme)
      this.setState({ crewId: 'guest', envId: s.env.id })
    })
  }
  componentWillUnmount() { cancelAnimationFrame(this.raf) }
  countUp() {
    const start = performance.now()
    const tick = (t) => { const p = Math.min(1, (t - start) / 1100); this.setState({ shown: Math.round(50 * (1 - (1 - p) ** 3)) }); if (p < 1) this.raf = requestAnimationFrame(tick) }
    this.raf = requestAnimationFrame(tick)
  }
  finish() {
    const D = this.D, id = this.state.crewId
    D.setState({ crewId: id, envId: this.state.envId })
    const w = D.wallet(id)
    w.onboarded = true; w.goal = this.state.goal
    w.owned = Array.from(new Set([...w.owned, this.state.visor, this.state.suit]))
    w.equipped = { ...w.equipped, visor: this.state.visor, suit: this.state.suit }
    D.saveWallet(id, w)
    D.earn(id, 50, 'Finished setup')
    navigate('Body%20Map.dc.html')
  }
  renderVals() {
    const D = this.D
    const st = this.state
    const STEPS = 8
    const base = { step: st.step, pct: (st.step / (STEPS - 1)) * 100 + '%', pctNum: Math.round((st.step / (STEPS - 1)) * 100), pending: st.step >= 7 ? 50 : 0 }
    if (!D || !st.crewId) return { ...base, isWelcome: true, perks: [], q: { options: [] }, visors: [], suits: [], burst: [], doneStats: [], primaryLabel: 'Get started', btnBg: 'var(--ink)', btnColor: 'var(--paper)', btnShadow: '#000', sheetBg: 'var(--paper)', sheetBorder: 'var(--rule)' }
    const me = D.CREW.find((c) => c.id === st.crewId)
    const guide = D.CREW[0]
    const guideGear = D.gear('crew-1')
    const pg = { ...D.gear(D.wallet(st.crewId)), visor: D.SHOP.find((x) => x.id === st.visor), suit: D.SHOP.find((x) => x.id === st.suit) }
    const next = () => this.setState((p) => ({ step: p.step + 1, checked: false }))
    const opt = (o, selected, pick, extra = {}) => {
      const on = selected === o.value
      return {
        dir: 'row', align: 'center', ta: 'left', ...o, ...extra, checked: String(on), pick,
        bg: on ? 'var(--accent-wash)' : 'var(--panel)', border: on ? 'var(--accent)' : 'var(--rule)', hoverBorder: on ? 'var(--accent)' : 'var(--rule-strong)',
        lift: on ? 'translateY(-2px)' : 'none', tickOp: on ? 1 : 0, tickScale: on ? 'scale(1)' : 'scale(.4)',
      }
    }
    let q = { options: [] }, kind = 'welcome'
    if (st.step === 1) {
      kind = 'ask'
      q = { title: 'Who are you acting as today?', sub: 'Judges usually pick the guest. Crew 1 to 3 already have 30 days of simulated history.', min: '210px', options: D.CREW.map((c) => opt({ value: c.id, label: c.id === 'guest' ? 'Guest' : c.name, sub: c.role === 'Guest' ? 'Start fresh on this device' : c.role, crew: c, gear: D.gear(c.id), avSize: 56, ring: D.STATUS[D.crewData(c.id).worst].swatch }, st.crewId, () => this.setState({ crewId: c.id }))) }
    } else if (st.step === 2) {
      kind = 'ask'
      const sub = { iss: 'Answers from the ground arrive almost straight away.', lunar: 'About a second each way. Ground help is close.', lunarRover: 'Two crew, up to 30 days in a small cabin, far from base.', marsSurface: 'Up to 22 minutes each way, on a base under Mars gravity.', mars: 'Up to 22 minutes each way. The crew handles more on its own.' }
      const ic = { iss: D.ICONS.send, lunar: D.ICONS.moon, lunarRover: D.ICONS.moon, mars: D.ICONS.target, marsSurface: D.ICONS.target }
      q = { title: 'Where is the mission?', sub: 'This sets the comm delay for the escalation ladder.', min: '240px', options: D.ENVS.map((e) => opt({ value: e.id, label: e.label, sub: `${sub[e.id]} One-way delay ${D.formatDelay(e.delay)}.`, icon: ic[e.id], tileBg: 'var(--ink)', tileColor: 'var(--paper)' }, st.envId, () => this.setState({ envId: e.id }))) }
    } else if (st.step === 3) {
      kind = 'ask'
      const G = [
        { value: 'light', label: 'Light', sub: 'One mirror check a day', reward: '10/day', icon: D.ICONS.scan },
        { value: 'regular', label: 'Regular', sub: 'Mirror check plus an exercise log', reward: '20/day', icon: D.ICONS.activity, tag: 'Most crews' },
        { value: 'committed', label: 'Committed', sub: 'Both, and report anything that feels off the same day', reward: '35/day', icon: D.ICONS.flame },
      ]
      q = { title: 'Pick a daily goal.', sub: 'Coins come from doing the check, never from the numbers it shows. You can change this later.', min: '100%', options: G.map((g) => opt({ ...g, tileBg: 'var(--paper-deep)', tileColor: 'var(--ink)' }, st.goal, () => this.setState({ goal: g.value }))) }
    } else if (st.step === 4 || st.step === 5) {
      kind = 'ask'
      const key = st.step === 4 ? 'a4' : 'a5'
      const correct = st.step === 4 ? 'yellow' : 'gray'
      const ans = st[key]
      q = st.step === 4
        ? { title: 'Quick lesson. Sleep has slipped a little below this person’s normal.', sub: 'What does the body map show for the head?', chart: true, min: '200px' }
        : { title: 'The light was too dim, so the camera could not get a clean reading.', sub: 'What color does that region turn?', min: '200px' }
      q.options = ['green', 'yellow', 'red', 'gray'].map((k) => {
        const o = opt({ value: k, label: D.STATUS[k].label, swatch: D.STATUS[k].swatch }, ans, () => !st.checked && this.setState({ [key]: k }))
        if (st.checked) {
          if (k === correct) Object.assign(o, { bg: 'color-mix(in srgb, var(--ok) 14%, var(--panel))', border: 'var(--ok)' })
          else if (k === ans) Object.assign(o, { bg: 'color-mix(in srgb, var(--act) 10%, var(--panel))', border: 'var(--act)' })
        }
        return o
      })
    } else if (st.step === 6) kind = 'style'
    else if (st.step === 7) kind = 'done'

    const quiz = st.step === 4 || st.step === 5
    const ansNow = st.step === 4 ? st.a4 : st.a5
    const right = quiz && st.checked && ansNow === (st.step === 4 ? 'yellow' : 'gray')
    const explain = st.step === 4 ? 'Between one and two standard deviations from their own normal is Watch. Past two is Act.' : 'Gray means not enough good data. The app never guesses when the reading is poor.'
    const canGo = st.step === 0 || st.step === 6 || st.step === 7 || (st.step === 1 && st.crewId) || (st.step === 2 && st.envId) || (st.step === 3 && st.goal) || (quiz && ansNow)
    let primaryLabel = 'Continue', primary = next
    if (st.step === 0) primaryLabel = 'Get started'
    if (quiz && !st.checked) { primaryLabel = 'Check'; primary = () => this.setState({ checked: true }) }
    if (st.step === 6) { primary = () => { next(); setTimeout(() => this.countUp(), 250) } ; primaryLabel = 'Finish setup' }
    if (st.step === 7) { primaryLabel = 'Open my console'; primary = () => this.finish() }

    const fbState = quiz && st.checked ? (right ? 'ok' : 'no') : null
    const visorIds = ['visor-std', 'visor-silver', 'visor-night'], suitIds = ['suit-white', 'suit-blue', 'suit-black']
    const g = D.game(st.crewId)
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800
    return {
      ...base, pending: st.step >= 7 ? st.shown : 0, heroAv: Math.max(90, Math.min(150, Math.round(vh * 0.19))),
      isWelcome: kind === 'welcome', isAsk: kind === 'ask', isStyle: kind === 'style', isDone: kind === 'done',
      guide, guideGear, me, meName: me.name, previewGear: pg, previewBanner: 'var(--panel-2)',
      perks: [{ t: 'About a minute', icon: D.ICONS.clock }, { t: '50 coins to start', icon: D.ICONS.award }, { t: 'Nothing leaves this browser', icon: D.ICONS.shield }],
      q,
      visors: visorIds.map((id) => { const it = D.SHOP.find((x) => x.id === id); return { name: it.name, on: String(st.visor === id), border: st.visor === id ? 'var(--ink)' : 'var(--rule)', sw: `linear-gradient(135deg, ${it.c1}, ${it.c2})`, pick: () => this.setState({ visor: id }) } }),
      suits: suitIds.map((id) => { const it = D.SHOP.find((x) => x.id === id); return { name: it.name, on: String(st.suit === id), border: st.suit === id ? 'var(--ink)' : 'var(--rule)', sw: it.fill, pick: () => this.setState({ suit: id }) } }),
      burst: kind === 'done' ? Array.from({ length: 14 }, (_, i) => { const a = (i / 14) * Math.PI * 2; const r = 110 + (i % 3) * 18; return { dx: Math.cos(a) * r + 'px', dy: Math.sin(a) * r + 'px', rot: (i * 47) % 360 + 'deg', delay: (i % 5) * 60 + 'ms' } }) : [],
      shown: st.shown,
      doneStats: [{ k: 'Streak', v: `Day ${Math.max(1, g.streak)}`, delay: '500ms' }, { k: 'Level', v: '1 · Cadet', delay: '600ms' }, { k: 'Daily goal', v: st.goal[0].toUpperCase() + st.goal.slice(1), delay: '700ms' }],
      feedback: !!fbState, fbInk: fbState === 'ok' ? 'var(--ok-ink)' : 'var(--act-ink)', fbIcon: fbState === 'ok' ? D.ICONS.check : D.ICONS.x,
      fbTitle: fbState === 'ok' ? 'Nicely done.' : `Not quite. It’s ${D.STATUS[st.step === 4 ? 'yellow' : 'gray'].label}.`, fbBody: explain,
      sheetBg: fbState === 'ok' ? 'color-mix(in srgb, var(--ok) 14%, var(--paper))' : fbState === 'no' ? 'color-mix(in srgb, var(--act) 10%, var(--paper))' : 'var(--paper)',
      sheetBorder: fbState === 'ok' ? 'color-mix(in srgb, var(--ok) 40%, transparent)' : fbState === 'no' ? 'color-mix(in srgb, var(--act) 35%, transparent)' : 'var(--rule)',
      showSkip: st.step === 0,
      primary, primaryLabel, primaryDisabled: !canGo,
      btnBg: !canGo ? 'var(--paper-deep)' : fbState === 'ok' ? 'var(--ok)' : fbState === 'no' ? 'var(--act)' : 'var(--ink)',
      btnColor: !canGo ? 'var(--muted)' : '#ffffff', btnShadow: !canGo ? 'var(--rule)' : fbState === 'ok' ? '#1b5b33' : fbState === 'no' ? '#6e1712' : '#000000',
      btnCursor: canGo ? 'pointer' : 'not-allowed', btnAnim: st.step === 7 ? 'ob-pop 500ms 900ms cubic-bezier(.34,1.56,.64,1) both' : 'none',
    }
  }
}
