// @ts-nocheck
// GENERATED from the UI overhaul prototype: this is the prototype's own logic class, run
// unchanged through the DCLogic shim. Data comes from ../data, which reads the real database.
import React from 'react'
import * as D from '../data'
import { DCLogic, navigate } from '../dc'

export class ManualEntryLogic extends DCLogic {
  state = { s: null, raw: {}, problem: {}, saved: {}, active: null, log: [], fx: {}, shake: {} }
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
  set(kind, name, v) {
    this.setState((p) => ({ raw: { ...p.raw, [kind]: { ...(p.raw[kind] || {}), [name]: v } }, problem: { ...p.problem, [kind]: p.problem[kind] && p.problem[kind].field === name ? null : p.problem[kind] } }))
  }
  submit(form, e) {
    e.preventDefault()
    const D = this.D, id = this.state.s.crew.id
    const res = D.validateEntry(form.kind, this.state.raw[form.kind] || {})
    if (!res.ok) return this.setState((p) => ({ problem: { ...p.problem, [form.kind]: res }, saved: { ...p.saved, [form.kind]: null }, shake: { ...p.shake, [form.kind]: (p.shake[form.kind] || 0) + 1 } }))
    const text = res.values.map((v) => `${v.label.toLowerCase()} ${v.value} ${v.unit}`).join(', ')
    let points = 0
    if (form.kind === 'exerciseMinutes') points = D.completeTask(id, 'exercise')
    if (!points) { points = 5; D.earn(id, 5, `Logged ${form.title.toLowerCase()}`) }
    const at = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    this.setState((p) => ({
      raw: { ...p.raw, [form.kind]: {} }, problem: { ...p.problem, [form.kind]: null },
      saved: { ...p.saved, [form.kind]: { text, region: form.region } }, fx: { ...p.fx, [form.kind]: { n: points, k: ((p.fx[form.kind] || {}).k || 0) + 1 } },
      log: [{ text: `${form.title}: ${res.values.map((v) => `${v.value} ${v.unit}`).join(' / ')}`, at, region: form.region, points, icon: D.ICONS[form.icon] }, ...p.log],
    }))
  }
  renderVals() {
    const D = this.D, s = this.state.s
    if (!D || !s) return { forms: [], quests: [], log: [], logEmpty: true, crewName: '' }
    const forms = D.ENTRY_FORMS.map((form, i) => {
      const raw = this.state.raw[form.kind] || {}, prob = this.state.problem[form.kind], saved = this.state.saved[form.kind]
      const active = this.state.active === form.kind, fx = this.state.fx[form.kind]
      const filled = form.fields.every((f) => String(raw[f.name] ?? '').trim() !== '')
      const errorId = `${form.kind}-error`
      return {
        title: form.title, region: form.region.toLowerCase(), hint: form.hint, icon: D.ICONS[form.icon], errorId, delay: i * 70 + 'ms',
        reward: form.kind === 'exerciseMinutes' ? 10 : 5,
        border: saved && fx ? 'var(--ok)' : active ? 'var(--ink)' : 'var(--rule)', lift: active ? 'translateY(-3px)' : 'none',
        anim: saved && fx ? ', lg-flash 900ms ease-out' : '',
        tileBg: active ? 'var(--ink)' : 'var(--paper-deep)', tileInk: active ? 'var(--paper)' : 'var(--ink)', tileShadow: active ? '#000' : 'var(--rule-strong)',
        focus: () => this.state.active !== form.kind && this.setState({ active: form.kind }),
        submit: (e) => this.submit(form, e), error: prob ? prob.error : '',
        disabled: !filled, cursor: filled ? 'pointer' : 'not-allowed',
        btnBg: filled ? 'var(--ink)' : 'var(--paper-deep)', btnColor: filled ? 'var(--paper)' : 'var(--muted)', btnShadow: filled ? '#000' : 'var(--rule)',
        btnText: filled ? `Log ${form.title.toLowerCase()}` : 'Fill in to log',
        coinFx: fx ? fx.n : 0, fxKey: fx ? fx.k : 0,
        saved: !!saved, savedText: saved ? saved.text : '', savedNote: saved ? `The ${saved.region.toLowerCase()} region now uses it.` : '',
        fields: form.fields.map((f) => {
          const v = raw[f.name] ?? '', n = v === '' ? null : Number(v), ok = n !== null && Number.isFinite(n)
          const safe = ok ? Math.min(f.max, Math.max(f.min, n)) : f.min
          const places = (String(f.step).split('.')[1] || '').length
          const nudge = (dir) => this.set(form.kind, f.name, ok ? String(Number(Math.min(f.max, Math.max(f.min, n + dir * f.step)).toFixed(places))) : String(f.min))
          const invalid = !!(prob && prob.field === f.name)
          return {
            id: `${form.kind}-${f.name}`, label: f.label, unit: f.unit, step: f.step, min: f.min, max: f.max, value: v, safe,
            change: (e) => this.set(form.kind, f.name, e.target.value), dec: () => nudge(-1), inc: () => nudge(1),
            decLabel: `Decrease ${f.label.toLowerCase()}`, incLabel: `Increase ${f.label.toLowerCase()}`,
            invalid: String(invalid), describedBy: invalid ? errorId : undefined,
            border: invalid ? 'var(--act)' : active ? 'var(--ink)' : 'transparent', shake: invalid ? `lg-shake 360ms ease ${this.state.shake[form.kind] % 2 ? '' : '0ms'}` : 'none',
            slider: !!f.slider, pct: ((safe - f.min) / (f.max - f.min)) * 100 + '%', bubble: ok ? `${v} ${f.unit}` : '', bubbleOp: ok ? 1 : 0,
            sliderLabel: `${f.label} slider`, minText: `${f.min} ${f.unit}`, maxText: `${f.max} ${f.unit}`,
          }
        }),
      }
    })
    const log = this.state.log, tasks = D.todayTasks(s.crew.id), done = tasks.filter((q) => q.done).length, C = 2 * Math.PI * 27
    return {
      crewName: s.crew.id === 'guest' ? 'guest' : s.crew.name, forms, log, logEmpty: log.length === 0, logCount: `${log.length} entr${log.length === 1 ? 'y' : 'ies'}`,
      sessionCoins: log.reduce((a, l) => a + l.points, 0),
      quests: tasks.map((q) => ({ label: q.label, points: q.points, bg: q.done ? 'rgba(246,196,69,.16)' : 'rgba(243,241,234,.07)', tick: q.done ? '#f6c445' : 'rgba(243,241,234,.18)', tickOp: q.done ? 1 : 0, strike: q.done ? 'line-through' : 'none' })),
      questDone: done, questDash: `${C * (done / 3)} ${C}`,
    }
  }
}
