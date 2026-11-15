// @ts-nocheck
// GENERATED from the UI overhaul prototype: this is the prototype's own logic class, run
// unchanged through the DCLogic shim. Data comes from ../data, which reads the real database.
import React from 'react'
import * as D from '../data'
import { DCLogic, navigate } from '../dc'

export class BodyFigureLogic extends DCLogic {
  outlinePath() {
    if (this._o) return this._o
    const R = [[116,16,126,29,126,46],[126,63,117,76,107,79],[107,84,108,88,109,91],[118,95,133,96,143,101],[152,105,156,114,157,126],[159,152,161,184,162,214],[163,232,162,248,161,262],[160,272,154,276,150,272],[147,268,148,256,148,246],[147,222,144,196,141,170],[140,158,138,148,136,141],[134,162,131,186,130,204],[129,218,134,230,135,244],[135,292,131,342,129,382],[128,402,127,414,129,424],[131,431,124,435,115,433],[110,431,108,425,108,414],[108,378,106,318,104,268],[103,262,101,259,100,259]]
    let d = 'M100 16 ' + R.map((s) => `C${s.join(' ')}`).join(' ')
    const pts = [[100, 16], ...R.map((s) => [s[4], s[5]])]
    for (let i = R.length - 1; i >= 0; i--) {
      const s = R[i], p0 = pts[i]
      d += ` C${200 - s[2]} ${s[3]} ${200 - s[0]} ${s[1]} ${200 - p0[0]} ${p0[1]}`
    }
    return (this._o = d + ' Z')
  }
  renderVals() {
    const S = { green: 'var(--ok)', yellow: 'var(--watch)', red: 'var(--act)', gray: 'var(--nodata)' }
    const L = { green: 'Within baseline', yellow: 'Watch', red: 'Act', gray: 'Not enough good data' }
    const st = this.props.statuses || {}
    const interactive = this.props.interactive !== false
    const sel = this.props.selected ?? null
    const uid = this.props.uid || 'bf'
    const act = (id, name) => {
      const s = st[id] || 'gray', on = sel === id
      const pick = () => this.props.onSelect && this.props.onSelect(id)
      return {
        s, on, label: `${name}: ${L[s]}`, role: interactive ? 'button' : 'img', tab: interactive ? 0 : -1,
        pressed: interactive ? String(on) : undefined, cursor: interactive ? 'pointer' : 'default',
        click: interactive ? pick : undefined,
        key: interactive ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick() } } : undefined,
      }
    }
    const zones = [
      ['skeleton', 'Skeleton', 'M0 88H60V258H0Z M140 88H200V258H140Z M0 258H200V446H0Z'],
      ['body', 'Whole body', 'M60 80H140V258H60Z'],
      ['head', 'Head', 'M0 0H200V80H0Z'],
    ].map(([id, name, d]) => {
      const a = act(id, name)
      const base = a.s === 'gray' ? 0.1 : 0.2
      const alerted = (this.props.alertRegions || []).includes(id)
      return { ...a, d, fill: S[a.s], op: a.on ? 0.46 : alerted ? 0.42 : base, hoverOp: a.on ? 0.5 : base + 0.14, zanim: alerted ? 'bf-alert 1.6s ease-in-out infinite' : 'none' }
    })
    const organs = [
      ['eyes', 'Eyes', 'M84 44 C86 40.5 94 40.5 96 44 C94 47.5 86 47.5 84 44 Z M104 44 C106 40.5 114 40.5 116 44 C114 47.5 106 47.5 104 44 Z', [76, 30, 48, 28]],
      ['heart', 'Heart', 'M120.5 132.6c1.5-1.4 3-3.2 3-5.5a5.5 5.5 0 0 0-5.5-5.5c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2a5.5 5.5 0 0 0-5.5 5.5c0 2.3 1.5 4 3 5.5l7 7Z', [92, 112, 44, 40]],
      ['gut', 'Gut and nutrition', 'M93 184 H107 A10 10 0 0 1 117 194 V208 A10 10 0 0 1 107 218 H93 A10 10 0 0 1 83 208 V194 A10 10 0 0 1 93 184 Z', [76, 176, 48, 50]],
    ].map(([id, name, d, h]) => {
      const a = act(id, name)
      // Departure from the prototype: the heart beats at the person's measured rate, and a region
      // with an open alert glows, so the figure shows live data rather than decoration.
      const bpm = this.props.bpm
      const beat = id === 'heart' && bpm ? `bf-beat ${(60 / Math.min(200, Math.max(30, bpm))).toFixed(3)}s ease-in-out infinite` : 'none'
      const glow = (this.props.alertRegions || []).includes(id) ? 'drop-shadow(0 0 6px var(--act))' : 'none'
      return { ...a, d, fill: S[a.s], stroke: a.on ? 'var(--accent)' : 'var(--ink)', sw: a.on ? 2.5 : 1.1, hx: h[0], hy: h[1], hw: h[2], hh: h[3], beat, glow }
    })
    const A = { head: [100, 28], eyes: [100, 44], heart: [114, 130], gut: [100, 201], body: [100, 160], skeleton: [150, 200] }
    const pings = this.props.markers ? Object.keys(A).filter((k) => st[k] === 'yellow' || st[k] === 'red').map((k) => ({ x: A[k][0], y: A[k][1], c: S[st[k]] })) : []
    return {
      outline: this.outlinePath(), zones, organs, pings, scan: !!this.props.scan, height: this.props.height || '360px',
      clipId: uid + 'c', clipUrl: `url(#${uid}c)`, scanId: uid + 's', scanUrl: `url(#${uid}s)`,
    }
  }
}
