// @ts-nocheck
// GENERATED from the UI overhaul prototype: this is the prototype's own logic class, run
// unchanged through the DCLogic shim. Data comes from ../data, which reads the real database.
import React from 'react'
import * as D from '../data'
import { DCLogic, navigate } from '../dc'

export class SiteFooterLogic extends DCLogic {
  state = { s: null }
  componentDidMount() {
    Promise.resolve(D).then((D) => { this.D = D; this.setState({ s: D.getState() }); this.off = D.onState(() => this.setState({ s: D.getState() })) })
  }
  componentWillUnmount() { this.off && this.off() }
  renderVals() {
    const s = this.state.s
    return {
      rail: s ? [s.env.label, `${s.crew.name} · ${s.crew.dataLabel}`] : [],
      rules: [
        'Gray means not enough good data. A reading that failed quality is never colored.',
        'Camera frames never leave the browser.',
        'Color is never the only signal: the status word is always shown.',
        'Runs offline after first load.',
      ],
      bottomPad: this.props.dock ? '132px' : '18px',
    }
  }
}
