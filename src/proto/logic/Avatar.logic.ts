// @ts-nocheck
// GENERATED from the UI overhaul prototype: this is the prototype's own logic class, run
// unchanged through the DCLogic shim. Data comes from ../data, which reads the real database.
import React from 'react'
import * as D from '../data'
import { DCLogic, navigate } from '../dc'

export class AvatarLogic extends DCLogic {
  renderVals() {
    const c = this.props.crew || { id: 'x', name: 'Crew', code: '', traits: { visor: 0, stripes: 1, antenna: false, tilt: 0 } }
    const t = c.traits
    const g = this.props.gear || {}
    const size = this.props.size ?? 44
    const uid = 'av' + c.id.replace(/[^a-z0-9]/gi, '') + size + (g.visor ? g.visor.id.replace(/\W/g, '') : '')
    const fr = g.frame && g.frame.id !== 'frame-none' ? g.frame : null
    const fw = fr ? Math.max(3, Math.round(size * 0.075)) : 0
    const b = Math.min(32, Math.max(18, size * 0.36))
    const top = g.top ? g.top.id : null
    return {
      px: size + 'px', inset: fw + 'px', ring: this.props.ring || 'var(--rule-strong)', ringW: fr ? '1.5px' : '2px',
      frameBg: fr ? (fr.holo ? 'conic-gradient(from var(--holo), #4cc9f0, #b28dff, #ff8fb1, #f6d77a, #7ef0c5, #4cc9f0)' : fr.bg) : 'transparent',
      frameAnim: fr && fr.holo ? 'chm-holo 4s linear infinite' : 'none',
      alt: `${c.name}, portrait`, gid: uid + 'v', cid: uid + 'c', clipUrl: `url(#${uid}c)`, visorUrl: `url(#${uid}v)`,
      v1: g.visor ? g.visor.c1 : '#4cc9f0', v2: g.visor ? g.visor.c2 : '#0b3d91', suit: g.suit ? g.suit.fill : '#e9e6dc',
      stripes: Array.from({ length: t.stripes }, (_, i) => `M${14 + i * 5} 52 L${14 + i * 5} ${41 - i * 1.5}`),
      tilt: `rotate(${t.tilt.toFixed(1)} 24 20)`,
      antenna: top ? top === 'top-antenna' : t.antenna, halo: top === 'top-halo', star: top === 'top-star',
      vs0: t.visor === 0, vs1: t.visor === 1, vs2: t.visor === 2,
      hasPatch: !!(g.patch && g.patch.glyph) && size >= 36, ppx: Math.min(34, Math.max(16, size * 0.34)) + 'px', patchBg: g.patch && g.patch.bg, patchFg: g.patch && g.patch.fg, patchGlyph: g.patch && g.patch.glyph,
      level: this.props.level || '', badge: !!this.props.badge && !this.props.level,
      bpx: b + 'px', bfs: Math.min(15, Math.max(9, size * 0.19)) + 'px', code: c.code,
    }
  }
}
