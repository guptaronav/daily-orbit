// @ts-nocheck
// GENERATED from the UI overhaul prototype: this is the prototype's own logic class, run
// unchanged through the DCLogic shim. Data comes from ../data, which reads the real database.
import React from 'react'
import * as D from '../data'
import { DCLogic, navigate } from '../dc'

export class MetricsLogic extends DCLogic {
  state = { ready: false, time: null, rep: null, model: true }
  componentDidMount() {
    Promise.resolve(D).then((D) => {
      this.D = D
      D.applyTheme(D.getState().theme)
      this.setState({ ready: true, time: { ...D.TIME_DEFAULTS }, rep: { ...D.REPORTING_DEFAULTS } })
    })
  }
  fields(defs, vals, key) {
    return defs.map(([k, label, unit, step, min, max, slider]) => {
      const v = vals[k]
      const set = (n) => Number.isFinite(n) && this.setState((p) => ({ [key]: { ...p[key], [k]: Math.min(max, Math.max(min, n)) } }))
      const places = (String(step).split('.')[1] || '').length
      return {
        id: `${key}-${k}`, label: unit ? `${label} (${unit})` : label, min, max, step, value: v, slider: !!slider, stepper: !slider,
        display: unit === 'min' ? `${v} min` : unit === '' && max === 1 ? `${Math.round(v * 100)}%` : String(v),
        pct: ((v - min) / (max - min)) * 100 + '%',
        change: (e) => set(Number(e.target.value)),
        dec: () => set(Number((v - step).toFixed(places))), inc: () => set(Number((v + step).toFixed(places))),
        decLabel: `Decrease ${label.toLowerCase()}`, incLabel: `Increase ${label.toLowerCase()}`,
      }
    })
  }
  renderVals() {
    const D = this.D
    const m = this.state.model
    const base = { modelStr: String(m), modelOpen: m, flipModel: () => this.setState({ model: !m }), mBg: m ? 'color-mix(in srgb, var(--accent) 22%, transparent)' : 'transparent', mX: m ? 'translateX(18px)' : 'none' }
    if (!this.state.ready) return { ...base, panels: [] }
    const time = this.state.time, rep = this.state.rep
    const t = D.crewMinutesPerDay(time), r = D.reportingCompleteness(rep)
    const tMax = Math.max(t.mirror, t.manual, 1)
    const TF = [
      ['mirrorCheckMin', 'One mirror check', 'min', 0.5, 0, 30, true], ['perIndicatorMin', 'Logging one indicator by hand', 'min', 0.5, 0, 10, true],
      ['indicatorCount', 'Indicators the check covers', '', 1, 0, 20, true], ['setupMin', 'Setup for a separate logging session', 'min', 0.5, 0, 15, true],
      ['crewSize', 'Crew size', 'people', 1, 1, 12], ['missionDays', 'Mission length', 'days', 10, 1, 1200],
    ]
    const RF = [
      ['complianceProb', 'Chance of doing the check on a given day', '', 0.05, 0, 1, true], ['badDayProb', 'Chance a day has something worth reporting', '', 0.05, 0, 1, true],
      ['underReportProb', 'Chance of hiding a bad day when values are scored', '', 0.05, 0, 1, true], ['days', 'Window', 'days', 1, 0, 365],
      ['crewSize', 'Crew size', 'people', 1, 0, 12], ['seed', 'Random seed', '', 1, 0, 9999],
    ]
    const strong = { color: 'var(--accent)', fill: 'var(--accent)' }, weak = { color: 'var(--ink)', fill: 'var(--rule-strong)' }
    return {
      ...base,
      panels: [
        {
          label: 'Crew minutes per day', title: 'One check against logging everything separately', sub: 'Linear on purpose: a more elaborate model would only bury the assumptions it rests on.',
          bars: [
            { label: 'Separate logging', value: t.manual, unit: 'min/day', pct: (t.manual / tMax) * 100 + '%', ...weak },
            { label: 'One mirror check', value: t.mirror, unit: 'min/day', pct: (t.mirror / tMax) * 100 + '%', ...strong },
          ],
          big: [
            { k: 'Difference', v: t.saved.toFixed(1), u: 'min/day', color: 'var(--accent)', note: '' },
            { k: 'Over the mission', v: t.hours.toFixed(1), u: 'crew hours', color: 'var(--ink)', note: `${time.crewSize} crew × ${time.missionDays} days · ${t.hours >= 0 ? 'given back' : 'spent extra'}` },
          ],
          model: false, fields: this.fields(TF, time, 'time'), reset: () => this.setState({ time: { ...D.TIME_DEFAULTS } }),
        },
        {
          label: 'Reporting completeness', title: 'Rewarding effort against rewarding healthy values', sub: 'What share of person-days gets reported under each scoring scheme over the window.',
          bars: [
            { label: 'Reward effort', value: r.effort, unit: '%', pct: r.effort + '%', ...strong },
            { label: 'Reward values', value: r.value, unit: '%', pct: r.value + '%', ...weak },
          ],
          big: [
            { k: 'Bad days hidden', v: r.hidden, u: `of ${r.opportunities}`, color: r.hidden ? 'var(--watch-ink)' : 'var(--ink)', note: '' },
            { k: 'Person-days modelled', v: r.opportunities, u: '', color: 'var(--ink)', note: '' },
          ],
          model: true, fields: this.fields(RF, rep, 'rep'), reset: () => this.setState({ rep: { ...D.REPORTING_DEFAULTS } }),
        },
      ],
    }
  }
}
