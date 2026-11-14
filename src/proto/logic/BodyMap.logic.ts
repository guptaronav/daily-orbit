// @ts-nocheck
// GENERATED from the UI overhaul prototype: this is the prototype's own logic class, run
// unchanged through the DCLogic shim. Data comes from ../data, which reads the real database.
import React from 'react'
import * as D from '../data'
import { DCLogic, navigate } from '../dc'

export class BodyMapLogic extends DCLogic {
  state = { s: null, sel: null, band: true, markers: true, scan: false, hover: null, faq: {}, range: 14, tour: 'head', hoverInd: null, narrow: false }
  chEls = {}
  areaRef = (el) => {
    if (!el || el === this._area) return
    this._area = el
    if (this.ro) this.ro.disconnect()
    this.ro = new ResizeObserver((es) => {
      const r = es[0].contentRect, w = Math.max(10, Math.min(r.width, (r.height * 560) / 520))
      if (Math.abs(w - (this.state.boxW || 0)) > 3) this.setState({ boxW: w })
    })
    this.ro.observe(el)
  }
  pickTour() {
    const mid = window.innerHeight * (this.state.narrow ? 0.72 : 0.5)
    let best = null, bd = Infinity
    for (const id in this.chEls) { const el = this.chEls[id]; if (!el) continue; const r = el.getBoundingClientRect(); const d = Math.abs(r.top + r.height / 2 - mid); if (d < bd) { bd = d; best = id } }
    if (best && best !== this.state.tour) this.setState({ tour: best, hoverInd: null })
  }
  goTour(id) { const el = this.chEls[id]; if (!el) return; const r = el.getBoundingClientRect(); window.scrollTo({ top: r.top + scrollY - (this.state.narrow ? window.innerHeight * 0.5 : window.innerHeight * 0.5 - r.height / 2), behavior: 'smooth' }) }
  outlinePath() {
    if (this._o) return this._o
    const R = [[116,16,126,29,126,46],[126,63,117,76,107,79],[107,84,108,88,109,91],[118,95,133,96,143,101],[152,105,156,114,157,126],[159,152,161,184,162,214],[163,232,162,248,161,262],[160,272,154,276,150,272],[147,268,148,256,148,246],[147,222,144,196,141,170],[140,158,138,148,136,141],[134,162,131,186,130,204],[129,218,134,230,135,244],[135,292,131,342,129,382],[128,402,127,414,129,424],[131,431,124,435,115,433],[110,431,108,425,108,414],[108,378,106,318,104,268],[103,262,101,259,100,259]]
    let d = 'M100 16 ' + R.map((s) => 'C' + s.join(' ')).join(' ')
    const pts = [[100, 16], ...R.map((s) => [s[4], s[5]])]
    for (let i = R.length - 1; i >= 0; i--) { const s = R[i], p0 = pts[i]; d += ` C${200 - s[2]} ${s[3]} ${200 - s[0]} ${s[1]} ${200 - p0[0]} ${p0[1]}` }
    return (this._o = d + ' Z')
  }
  componentDidMount() {
    Promise.resolve(D).then((D) => {
      this.D = D
      const s = D.getState()
      D.applyTheme(s.theme)
      this.setState({ s })
      setTimeout(() => D.reveal(), 60)
      this.onScroll = () => { if (this.tick) return; this.tick = requestAnimationFrame(() => { this.tick = 0; this.pickTour() }) }
      this.onResize = () => { const n = window.innerWidth < 900; if (n !== this.state.narrow) this.setState({ narrow: n }) }
      this.onResize()
      window.addEventListener('scroll', this.onScroll, { passive: true })
      window.addEventListener('resize', this.onResize)
      this.off = D.onState(() => { const n = D.getState(); this.setState((p) => ({ s: n, sel: p.s && p.s.crew.id === n.crew.id ? p.sel : null, hover: null })) })
    })
  }
  componentWillUnmount() { this.off && this.off(); window.removeEventListener('scroll', this.onScroll); window.removeEventListener('resize', this.onResize); if (this.ro) this.ro.disconnect() }
  renderVals() {
    const D = this.D, s = this.state.s
    if (!D || !s) return { tourTabs: [], marks: [], labels: [], chapters: [], L: {}, tourDir: 'row', viewerH: '70vh', viewerFlex: '1 1 0', stickyTop: '96px', chapterH: '80vh', leftCallouts: [], rightCallouts: [], tabs: [], cards: [], toggles: [], stats: [], tasks: [], legend: [], statuses: {} }
    const cd = D.crewData(s.crew.id), g = D.game(s.crew.id), wl = D.wallet(s.crew.id), lv = D.level(wl.xp)
    const ST = D.STATUS
    const chip = (st) => `color-mix(in srgb, ${ST[st].swatch} 16%, transparent)`
    const sel = this.state.sel || (cd.flagged[0] ? cd.flagged[0].id : 'head')
    const select = (id) => this.setState({ sel: id, hover: null })
    const callout = (id) => {
      const rg = cd.regions[id], st = ST[rg.status], r = rg.driver, on = id === sel
      const sp = r ? D.sparkPath(D.spark(r), 110, 32) : { d: '' }
      return {
        label: rg.label, icon: D.ICONS[rg.icon], ink: st.ink, chipBg: chip(rg.status), word: st.label,
        has: !!r, empty: !r, value: r ? D.fmt(r) : '', unit: r ? D.fmtUnit(r) : '', sigma: r ? D.sigma(r.z) : '', driver: r ? r.label : '',
        spark: sp.d, pressed: String(on),
        bg: on ? 'var(--accent-wash)' : 'var(--panel)', border: on ? 'var(--accent)' : 'var(--rule)',
        pick: () => select(id),
      }
    }
    const region = cd.regions[sel]
    const tog = (k, label) => {
      const on = this.state[k]
      return { label, on: String(on), checkOp: on ? 1 : 0, flip: () => this.setState({ [k]: !on }), bg: on ? 'var(--ink)' : 'transparent', color: on ? 'var(--paper)' : 'var(--ink)', border: on ? 'var(--ink)' : 'var(--rule-strong)' }
    }
    const hover = this.state.hover
    const N = this.state.range
    const cards = region.readings.map((r0) => {
      const r = { ...r0, history: r0.history.slice(-N) }
      const st = ST[r.status], ch = D.chart(r)
      const b = r.baseline
      const zoneOf = (v) => { if (!b) return null; const z = Math.abs(v - b.mean) / b.sd; return z <= 1 ? 'green' : z <= 2 ? 'yellow' : 'red' }
      let summary = '', summary2 = '', sumInk = 'var(--ink)'
      if (!r.latest) summary = ''
      else if (!b) { summary = 'Building your normal'; summary2 = 'A baseline needs five good readings.' }
      else {
        const diff = r.latest.v - b.mean, zz = zoneOf(r.latest.v)
        const amt = Math.abs(diff).toFixed(r.dp > 1 ? 2 : 1)
        summary = zz === 'green' ? 'Inside your normal range' : `${amt} ${r.unit === '0-10' ? 'points' : r.unit} ${diff < 0 ? 'below' : 'above'} your normal`
        sumInk = ST[zz].ink
        const vals = r0.history.filter((h) => h.passed).map((h) => h.v)
        summary2 = r.latest.v <= Math.min(...vals) ? 'Lowest in 30 days' : r.latest.v >= Math.max(...vals) ? 'Highest in 30 days' : `Normal is ${(b.mean - b.sd).toFixed(1)} to ${(b.mean + b.sd).toFixed(1)} ${r.unit}`
      }
      const hv = hover && hover.id === r.id && ch ? ch.points[hover.i] : null
      const fo = this.state.faq[r.id]
      const [measure, risk] = D.META[r.id]
      const step = ch ? (ch.W - ch.L - ch.R) / (ch.points.length - 1) : 0
      return {
        label: r.label, ink: st.ink, swatch: st.swatch, chipBg: chip(r.status), statusLabel: st.label,
        value: D.fmt(r), unit: r.latest ? D.fmtUnit(r) : '', sigma: r.latest ? D.sigma(r.z) : '', valueColor: r.latest ? 'var(--ink)' : 'var(--nodata-ink)',
        empty: !r.latest, has: !!r.latest,
        baseline: r.baseline ? `Baseline ${r.baseline.mean.toFixed(1)} ± ${r.baseline.sd.toFixed(1)} ${r.unit}` : r.latest ? 'No baseline yet' : '',
        baselineN: r.baseline ? `from ${r.baseline.n} earlier readings` : r.latest ? 'needs 5 readings' : '',
        meta: r.latest ? [{ k: 'Quality', v: '100%' }, { k: 'Source', v: 'Simulated' }, { k: 'Taken', v: new Date(r.latest.t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) }, { k: 'Clinical threshold', v: 'Not set' }] : [],
        failedNote: r.failed ? `${r.failed} reading(s) failed the quality check and are left out of the status and the baseline.` : '',
        chart: ch, noChart: !ch, showBand: !!(ch && ch.band && this.state.band), summary, summary2, sumInk,
        zTop: ch && ch.band ? { y: ch.band.up2, h: (ch.band.y - ch.band.up2).toFixed(1) } : { y: 0, h: 0 },
        zBot: ch && ch.band ? { y: (+ch.band.y + +ch.band.h).toFixed(1), h: (ch.band.dn2 - (+ch.band.y + +ch.band.h)).toFixed(1) } : { y: 0, h: 0 },
        bandLabelY: ch && ch.band ? (+ch.band.y + 16).toFixed(1) : 0,
        xStart: `${N} days ago`,
        dots: ch && b ? ch.points.filter((p) => p.v !== null && zoneOf(p.v) !== 'green').map((p) => ({ x: p.x.toFixed(1), y: p.y.toFixed(1), c: ST[zoneOf(p.v)].swatch })) : [],
        tipZone: hover && hover.id === r.id && ch && b && ch.points[hover.i] && ch.points[hover.i].v !== null ? ({ green: 'Inside your normal', yellow: 'Watch zone', red: 'Act zone' })[zoneOf(ch.points[hover.i].v)] : '',
        chartAria: ch ? `Trend chart: ${ch.points.length - ch.gaps} readings in ${r.unit}, oldest first.` : '',
        unitCaption: r.unit, gapsText: ch && ch.gaps ? `${ch.gaps} gap(s) where quality failed` : '',
        hits: ch ? ch.points.map((p) => ({ x: (p.x - step / 2).toFixed(1), w: step.toFixed(1), enter: () => this.setState({ hover: { id: r.id, i: p.i } }) })) : [],
        leave: () => this.setState({ hover: null }),
        hoverOn: !!(hv && hv.v !== null), hx: hv ? hv.x.toFixed(1) : 0, hy: hv && hv.y !== null ? hv.y.toFixed(1) : 0,
        tipLeft: hv ? (hv.x / 640) * 100 + '%' : '0', tipDay: hv ? hv.day : '', tipVal: hv && hv.v !== null ? `${hv.v.toFixed(r.dp)} ${r.unit}` : '',
        faq: D.QUESTIONS.map((q, i) => ({ q, a: '[CONTENT TODO]', isOpen: fo === i, open: String(fo === i), rot: fo === i ? 'rotate(45deg)' : 'none', toggle: () => this.setState((p) => ({ faq: { ...p.faq, [r.id]: p.faq[r.id] === i ? null : i } })) })),
        measure, risk,
      }
    })
    const flagged = cd.flagged
    const isGuest = cd.withData === 0
    const worst = ST[cd.worst]
    const tasksAll = D.todayTasks(s.crew.id)
    const core = tasksAll.filter((t) => !t.optional)
    const done = core.filter((t) => t.done).length
    const goal = D.crewGoal()
    const next = goal.systems.find((x) => !x.online)
    const bar = (n, k, color) => Array.from({ length: n }, (_, i) => (i < k ? color : 'var(--paper-deep)'))
    const measuredCells = Math.round((cd.withData / cd.total) * 10)
    const tour = this.state.tour
    const DARK = { green: '#2fd39b', yellow: '#f2b134', red: '#ff5f56', gray: '#5d6b82' }
    const CAM = { head: [100, 42, 4.1], eyes: [100, 46, 7.6], heart: [106, 139, 4.8], skeleton: [100, 222, 1.08], body: [100, 214, 1.1], gut: [100, 204, 3.9] }
    const k = (this.state.boxW || 560) / 560, compact = k < 0.9
    const [cx, cy, sc0] = CAM[tour]
    const sc = ['head', 'eyes', 'heart', 'gut'].includes(tour) && compact ? sc0 * 0.62 : sc0
    const METHOD = { heartRate: 'Camera', blinkRate: 'Camera', eyelidClosure: 'Camera', amslerDistortion: 'Vision test', nearAcuity: 'Vision test', sleepHours: 'Check-in', sleepQuality: 'Check-in', mood: 'Check-in', stress: 'Check-in', digestiveComfort: 'Check-in', appetite: 'Check-in', symptomReport: 'Check-in', bloodPressureSys: 'Cuff, logged', bloodPressureDia: 'Cuff, logged', temperature: 'Thermometer, logged', bloodSugar: 'Glucose meter, logged', bodyMass: 'Mass device, logged', exerciseMinutes: 'Logged', radiationDose: 'Radiation replay' }
    const HOW = {
      head: 'Sleep, mood and stress come from the check-in questions. Blink rate and eyelid closure come from the camera.',
      eyes: 'The Amsler grid and a near-vision test, both part of the mirror check.',
      heart: 'Pulse is read from the camera. Blood pressure comes from a cuff you log by hand.',
      skeleton: 'Exercise minutes you log. NASA ties exercise to its bone and fitness risks.',
      body: 'Temperature you log, symptoms from the check-in, and the simulated dose from the radiation replay.',
      gut: 'Appetite and digestive comfort from the check-in, plus blood sugar and body mass you log.',
    }
    const MK = {
      head: [['mood', 86, 25, 'l'], ['sleepHours', 92, 33, 'l'], ['blinkRate', 86, 44, 'l'], ['stress', 114, 25, 'r'], ['sleepQuality', 108, 33, 'r'], ['eyelidClosure', 114, 44, 'r']],
      eyes: [['nearAcuity', 87, 44, 'l'], ['amslerDistortion', 113, 44, 'r']],
      heart: [['bloodPressureDia', 97, 125, 'l'], ['heartRate', 101, 142, 'l'], ['bloodPressureSys', 116, 117, 'r']],
      skeleton: [['exerciseMinutes', 84, 300, 'r']],
      body: [['temperature', 100, 106, 'l'], ['symptomReport', 76, 150, 'l'], ['radiationDose', 112, 190, 'r']],
      gut: [['bloodSugar', 88, 180, 'l'], ['bodyMass', 86, 226, 'l'], ['appetite', 112, 189, 'r'], ['digestiveComfort', 101, 214, 'r']],
    }
    const zoneOf = (r) => r.status
    const shortVal = (r) => (r.latest ? `${D.fmt(r)} ${D.fmtUnit(r)}`.trim() : 'No good data')
    const hi = this.state.hoverInd
    const marks = [], labels = []
    for (const rid in MK) {
      const active = rid === tour
      const side = { l: [], r: [] }
      for (const [ind, x, y, sd] of MK[rid]) {
        const r = cd.readings[ind], st = r.status, c = DARK[st]
        const big = hi === ind
        marks.push({ x, y, c, fill: st === 'gray' ? 'rgba(11,15,22,.6)' : c, dash: st === 'gray' ? '2 2' : 'none', r: (big ? 4.6 : 3.2) / sc * (active ? 1 : 0.8), r2: 9 / sc, ping: active && (st === 'yellow' || st === 'red'), op: active ? 1 : 0 })
        if (active) side[sd].push({ ind, x, y, r, c, big })
      }
      if (!active) continue
      const SX = (x) => 280 + (x - cx) * sc, SY = (y) => 270 + (y - cy) * sc, rw = 150, rh = 42
      for (const sd of ['l', 'r']) {
        let last = -Infinity
        side[sd].sort((p, q) => p.y - q.y).forEach((p, idx) => {
          const px = SX(p.x), py = SY(p.y)
          const gapU = (compact ? 44 : 50) / k
          const ly = Math.min(520 - 26 / k, Math.max(py, last + gapU, 26 / k)); last = ly
          const rx = sd === 'l' ? 14 : 560 - 14 - rw
          const lw = (compact ? 108 : 150) / k, ex = sd === 'l' ? 12 + lw : 548 - lw
          labels.push({
            key: tour + p.ind, delay: 650 + idx * 90 + (sd === 'r' ? 45 : 0) + 'ms',
            lead: `M${px} ${py} L${sd === 'l' ? ex + 14 : ex - 14} ${ly} L${ex} ${ly}`, c: p.c,
            maxW: (compact ? 108 : 150) + 'px', pad: compact ? '4px 8px' : '6px 10px', fs1: compact ? '11.5px' : '12.5px', fs2: compact ? '10.5px' : '11.5px',
            left: ((sd === 'l' ? 12 : 548) / 560) * 100 + '%', top: (ly / 520) * 100 + '%', tf: sd === 'l' ? 'translateY(-50%)' : 'translate(-100%, -50%)', bw: p.big ? '2px' : '1px',
            tx: rx + 12, anchor: 'start', ty1: ly - 3, ty2: ly + 13, fs1: '13px', fs2: '12px',
            name: p.r.label.replace(' (systolic)', ', top').replace(' (diastolic)', ', bottom').replace('Amsler grid distortion', 'Amsler grid'),
            val: shortVal(p.r) + (p.r.latest && p.r.status !== 'gray' ? ` · ${D.STATUS[p.r.status].short}` : ''),
          })
        })
      }
    }
    const ribs = Array.from({ length: 9 }, (_, i) => { const y0 = 106 + i * 9, w = 30 - Math.abs(i - 3) * 1.6; return `M98 ${y0} C${88 - w * 0.3} ${y0 - 6} ${100 - w - 4} ${y0 - 2} ${100 - w - 2} ${y0 + 10} M102 ${y0} C${112 + w * 0.3} ${y0 - 6} ${100 + w + 4} ${y0 - 2} ${100 + w + 2} ${y0 + 10}` }).join(' ')
    const vertebrae = Array.from({ length: 24 }, (_, i) => { const y = 80 + i * 6.3, w = i < 7 ? 2.6 : 3.6; return `M${100 - w} ${y} h${w * 2} a1 1 0 0 1 1 1 v3.4 a1 1 0 0 1 -1 1 h${-w * 2} a1 1 0 0 1 -1 -1 v-3.4 a1 1 0 0 1 1 -1 Z` }).join(' ')
    const teeth = Array.from({ length: 8 }, (_, i) => `M${92 + i * 2.3} 66.5 v2.6`).join(' ')
    const hr = cd.readings.heartRate.latest ? cd.readings.heartRate.latest.v : 60
    const story = (g) => {
      const rs = g.readings, withD = rs.filter((r) => r.latest), off = withD.filter((r) => r.status === 'yellow' || r.status === 'red'), none = rs.length - withD.length
      const who = s.crew.id === 'guest' ? 'your' : `${s.crew.name}’s`
      if (!withD.length) return 'Nothing here has a good reading yet, so it stays gray. A reading that fails the quality check is never colored.'
      if (!off.length) return `All ${withD.length} reading${withD.length > 1 ? 's' : ''} with good data sit inside ${who} normal range.${none ? ` ${none} not measured yet.` : ''}`
      const parts = off.map((r) => { const d = r.latest.v - r.baseline.mean; return `${r.label.replace(/ \(.*\)/, '')} is ${Math.abs(d).toFixed(r.dp > 1 ? 2 : 1)} ${r.unit === '0-10' ? 'points' : r.unit} ${d < 0 ? 'below' : 'above'} ${who} normal` })
      const rest = withD.length - off.length
      return `${parts.join('. ')}.${rest ? ` ${rest} other${rest > 1 ? 's are' : ' is'} fine.` : ''}`
    }
    const chapters = D.REGIONS.map((g, i) => {
      const rg = cd.regions[g.id], st = ST[rg.status], on = g.id === tour
      const risks = Array.from(new Set(g.indicators.map((x) => D.META[x][1]).filter((x) => !x.includes('TODO')).flatMap((x) => x.split('; ')))).map((x) => x.replace('Risk of ', ''))
      const flaggedHere = rg.status === 'yellow' || rg.status === 'red'
      return {
        ref: (el) => { this.chEls[g.id] = el }, hid: 'tour-' + g.id, n: String(i + 1).padStart(2, '0'), label: g.label, word: st.label, ink: st.ink, chipBg: chip(rg.status),
        op: on ? 1 : 0.45, tf: on ? 'none' : 'translateY(8px)', story: story(rg), how: HOW[g.id], risks,
        rows: rg.readings.map((r) => {
          const sp = D.sparkPath(D.spark(r), 110, 32)
          let note = 'No reading has passed quality yet'
          if (r.latest && !r.baseline) note = 'Building the baseline'
          else if (r.latest) { const d = r.latest.v - r.baseline.mean; note = r.status === 'green' ? 'Inside normal' : `${Math.abs(d).toFixed(r.dp > 1 ? 2 : 1)} ${r.unit === '0-10' ? 'pts' : r.unit} ${d < 0 ? 'below' : 'above'} normal` }
          const big = this.state.hoverInd === r.id
          return { label: r.label, method: METHOD[r.id], value: r.latest ? D.fmt(r) : '—', unit: r.latest ? D.fmtUnit(r) : '', valColor: r.latest ? 'var(--ink)' : 'var(--nodata-ink)', note, ink: ST[r.status].ink, spark: sp.d, sparkColor: r.status === 'gray' ? 'var(--rule-strong)' : ST[r.status].swatch, border: big ? 'var(--ink)' : 'var(--rule)', tf: big ? 'translateX(4px)' : 'none', enter: () => { if (this.state.tour !== g.id) this.setState({ tour: g.id }); this.setState({ hoverInd: r.id }) } }
        }),
        open: () => { select(g.id); const h = document.getElementById('region-heading'); if (h) window.scrollTo({ top: h.getBoundingClientRect().top + scrollY - 100, behavior: 'smooth' }) },
        href2: flaggedHere ? 'Escalation.dc.html' : 'Manual%20Entry.dc.html', cta2: flaggedHere ? 'Who to tell' : 'Log a reading',
      }
    })
    const narrow = this.state.narrow
    const tourVals = {
      crewShortCap: s.crew.id === 'guest' ? 'you' : s.crew.name, tourDir: narrow ? 'column' : 'row', stickyTop: narrow ? '84px' : '96px',
      viewerFlex: narrow ? '0 0 auto' : '1.05 1 0', viewerH: narrow ? '48vh' : 'calc(100vh - 120px)', chapterH: narrow ? '62vh' : '86vh',
      tourTabs: D.REGIONS.map((g) => { const on = g.id === tour; return { label: g.label, on: String(on), go: () => { this.setState({ tour: g.id }); this.goTour(g.id) }, bg: on ? '#f3f1ea' : 'rgba(243,241,234,.06)', color: on ? '#0b0f16' : 'rgba(243,241,234,.8)', border: on ? '#f3f1ea' : 'rgba(243,241,234,.12)', sw: DARK[cd.regions[g.id].status] } }),
      cam: `translate(280px, 270px) scale(${sc}) translate(${-cx}px, ${-cy}px)`,
      L: { ...Object.fromEntries(D.REGIONS.map((g) => [g.id, g.id === tour ? 1 : 0.16])), skeleton: tour === 'skeleton' ? 1 : 0.42, lungs: tour === 'heart' || tour === 'body' ? 0.9 : 0.3 },
      outline: this.outlinePath(), ribs, vertebrae, teeth, marks, labels, chapters, hoverOff: () => this.setState({ hoverInd: null }),
      bodyColor: DARK[cd.regions.body.status], headFill: DARK[cd.regions.head.status], heartFill: DARK[cd.regions.heart.status], gutFill: DARK[cd.regions.gut.status],
      eyeL: DARK[cd.readings.nearAcuity.status] === DARK.gray ? '#5d6b82' : '#3b7bd4', eyeR: '#3b7bd4',
      beat: (60 / hr).toFixed(2) + 's', zoomText: `${cd.regions[tour].label} · ${sc.toFixed(1)}× zoom`,
      viewerAria: `Anatomy viewer zoomed to ${cd.regions[tour].label}. ${chapters.find((c) => c.hid === 'tour-' + tour).story}`,
    }
    return {
      ...tourVals, areaRef: this.areaRef, boxWpx: (this.state.boxW || 400) + 'px', boxHpx: ((this.state.boxW || 400) * 520) / 560 + 'px',
      crew: s.crew, gear: D.gear(wl), lvl: lv.n, crewName: s.crew.name,
      ranges: [7, 14, 30].map((n) => { const on = this.state.range === n; return { label: n + 'd', on: String(on), pick: () => this.setState({ range: n, hover: null }), bg: on ? 'var(--ink)' : 'transparent', color: on ? 'var(--paper)' : 'var(--muted)' } }), crewShort: s.crew.id === 'guest' ? 'your' : s.crew.name, crewRole: s.crew.role, dataLabel: s.crew.dataLabel,
      worstSwatch: worst.swatch, worstInk: worst.ink, worstLabel: worst.label, worstChipBg: chip(cd.worst),
      headerLine: isGuest ? 'Nothing measured yet. A first reading starts the baseline.' : flagged.length ? `${flagged.length} of 6 regions outside baseline` : 'Every region with good data is inside baseline',
      scanIcon: D.ICONS.scan, penIcon: D.ICONS.pen, alertIcon: D.ICONS.alert, chartIcon: D.ICONS.chart,
      stats: [
        { k: 'Check-in streak', v: g.streak, u: g.streak === 1 ? 'day' : 'days', icon: D.ICONS.flame, iconColor: 'var(--accent)', n: 7, bar: g.days.slice(-7).map((x) => (x ? 'var(--accent)' : 'var(--paper-deep)')), note: 'Last seven days' },
        { k: 'Coins', v: wl.coins, u: `level ${lv.n}`, icon: D.ICONS.zap, iconColor: 'var(--accent)', n: 1, bar: [`linear-gradient(to right, var(--ink) ${lv.frac * 100}%, var(--paper-deep) 0)`], note: `${lv.need - lv.into} XP to level ${lv.n + 1} · ${lv.rank}` },
        { k: 'Today', v: done, u: `of ${core.length} done`, icon: D.ICONS.check, iconColor: 'var(--accent)', n: core.length, bar: bar(core.length, done, 'var(--ink)'), note: done === core.length ? 'All done. Reporting a symptom still earns +15.' : 'Tap a task below to complete it' },
        { k: 'Measured', v: cd.withData, u: `of ${cd.total} indicators`, icon: D.ICONS.activity, iconColor: 'var(--accent)', n: 10, bar: bar(10, measuredCells, 'var(--ink-soft)'), note: 'How much is measured, not how healthy' },
      ],
      tasks: tasksAll.map((t) => ({
        ...t, icon: D.ICONS[t.icon], strike: t.done ? 'line-through' : 'none', cursor: t.done ? 'default' : 'pointer', complete: () => D.completeTask(s.crew.id, t.id),
        tileBg: t.done ? 'var(--ink)' : 'var(--panel-2)', tileColor: t.done ? 'var(--paper)' : 'var(--ink)', tileBorder: t.done ? 'var(--ink)' : 'var(--rule)',
        ptsColor: t.done ? 'var(--muted)' : 'var(--accent)', state: t.done ? 'Done' : t.optional ? 'Optional' : 'To do',
        stateBg: t.done ? 'color-mix(in srgb, var(--ok) 16%, transparent)' : 'var(--paper-deep)', stateColor: t.done ? 'var(--ok-ink)' : 'var(--ink-soft)',
      })),
      goalWeek: goal.week, goalTarget: goal.goal, goalPct: Math.round(goal.frac * 100) + '%', goalPctNum: Math.round(goal.frac * 100),
      nextSystem: next ? `${next.name} at ${next.threshold} pts` : 'All systems online',
      hasFlag: flagged.length > 0, flagTitle: flagged.length ? `${flagged.map((r) => r.label).join(' and ')} moved away from ${s.crew.name}’s normal` : '',
      openFlagLabel: flagged.length ? `Open ${flagged[0].label.toLowerCase()}` : '', openFlag: () => flagged[0] && select(flagged[0].id),
      toggles: [tog('band', 'Baseline band'), tog('markers', 'Pulse on alerts'), tog('scan', 'Scan line')],
      leftCallouts: ['head', 'heart', 'skeleton'].map(callout), rightCallouts: ['eyes', 'body', 'gut'].map(callout),
      legend: ['green', 'yellow', 'red', 'gray'].map((k) => ({ word: k === 'gray' ? 'No good data' : ST[k].label, bg: chip(k), ink: ST[k].ink })),
      statuses: cd.statuses, selected: sel, select, showMarkers: this.state.markers, showScan: this.state.scan,
      regionLabel: region.label, regionCount: `${region.withData} of ${region.indicators.length} indicators measured`,
      tabs: D.REGIONS.map((rg) => { const on = rg.id === sel; return { label: rg.label, on: String(on), pick: () => select(rg.id), bg: on ? 'var(--panel)' : 'transparent', color: on ? 'var(--ink)' : 'var(--muted)', shadow: on ? '0 1px 3px rgba(20,24,31,.12)' : 'none' } }),
      cards,
    }
  }
}
