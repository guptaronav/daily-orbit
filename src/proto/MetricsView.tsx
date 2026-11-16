// @ts-nocheck
/* eslint-disable */
// GENERATED from the UI overhaul prototype by dc2jsx.py. Styles are the prototype's, verbatim.
// Edit the view model that feeds this, not this markup, unless you are re-porting the prototype.
import { Fragment } from 'react'
import { SourcesUsed } from './SourcesUsed'
import { ModelCard } from './ModelCard'
import { ValidationCard } from './ValidationCard'
import * as P from './parts'
import { S } from './parts'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function MetricsView({ v }: { v: any }) {
  return (
    <>
      <div data-chm-root="1" style={S({ '--ink': '#14181f', '--ink-soft': '#2b323d', '--paper': '#f3f1ea', '--paper-deep': '#e8e4d8', '--panel': '#fbfaf6', '--panel-2': '#f6f4ec', '--rule': '#d9d4c4', '--rule-strong': '#a49c88', '--muted': '#5b6270', '--accent': '#0b3d91', '--accent-wash': '#e4e9f3', '--ok': '#2f7d4f', '--ok-ink': '#1b5b33', '--watch': '#b7791f', '--watch-ink': '#7a4f00', '--act': '#b3261e', '--act-ink': '#8c1d18', '--nodata': '#8a8f98', '--nodata-ink': '#5b6270', '--on-accent': '#ffffff', '--star-o': '0', '--glow': 'none', minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--paper)', color: 'var(--ink)', fontFamily: 'ui-sans-serif, system-ui, -apple-system, \'Segoe UI\', Roboto, sans-serif', fontVariantNumeric: 'tabular-nums' })}>
        <P.TopBar current="Metrics" />
        <main id="main" tabIndex={-1} className="metrics-page" style={S({ flex: '1', width: '100%', maxWidth: '1440px', margin: '0 auto', padding: '28px clamp(16px, 3vw, 32px) 72px', boxSizing: 'border-box', outline: 'none', display: 'flex', flexDirection: 'column', gap: '24px' })}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'stretch', gap: 20, animation: 'lg-rise 520ms cubic-bezier(.22,1,.36,1) both' }}>
            <div style={{ flex: '2 1 520px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 14, padding: '8px 0' }}>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)' }}>Metrics · proof and models</p>
              <h1 style={{ margin: 0, fontSize: 'clamp(40px, 6vw, 76px)', lineHeight: 0.92, fontWeight: 750, letterSpacing: '-0.05em' }}>
                What we tested,
                <br />
                and what we model.
              </h1>
              <p style={{ margin: 0, maxWidth: 620, fontSize: 17, lineHeight: 1.5, color: 'var(--muted)' }}>
                First, the flagging rules replayed on real NASA bed-rest data. Then two numbers we cannot measure yet, modeled openly: every input is on this page and editable, so you can see which assumption does the work.
              </p>
            </div>
            <section aria-label="In short" style={{ flex: '1 1 340px', padding: 22, borderRadius: 28, background: '#14181f', color: '#f3f1ea', display: 'grid', gap: 12, alignContent: 'start' }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 750, letterSpacing: '.06em', textTransform: 'uppercase', color: '#f6c445' }}>In short</p>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5 }}>
                <strong>Real data:</strong> the current rules hold a real weight loss at Act on 12 of 18 days instead of 3, with no extra false alarms.
              </p>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5 }}>
                <strong>Modeled:</strong> one check a day saves crew time, and rewarding effort instead of values keeps people reporting bad days.
              </p>
              <span style={{ alignSelf: 'start', padding: '4px 10px', borderRadius: 99, background: 'rgba(246,196,69,.16)', color: '#f6c445', fontSize: 12.5, fontWeight: 700 }}>Models are labeled Simulation; nothing modeled is NASA data</span>
            </section>
          </div>
          <ValidationCard />
          <ModelCard />
          <div style={S({ marginTop: '32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 560px), 1fr))', gap: '24px', alignItems: 'start' })}>
            {(v.panels ?? []).map((p: any, p_i: number) => (
                <Fragment key={p_i}>
              <section data-reveal="1" aria-label={p.label} style={S({ position: 'relative', background: 'var(--panel)', border: '1px solid var(--rule)', borderRadius: '24px', overflow: 'hidden', animation: 'chm-rise 420ms cubic-bezier(.22,1,.36,1) both' })}>
                <header style={S({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', minHeight: '42px', padding: '0 20px', borderBottom: '1px solid var(--rule)' })}>
                  <span style={S({ fontSize: '12.5px', color: 'var(--muted)' })}>
                    {p.label}
                  </span>
                  <span style={S({ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '2px 8px', border: '1px solid var(--watch-ink)', color: 'var(--watch-ink)', fontFamily: 'ui-monospace, Menlo, monospace', fontSize: '11.5px', fontWeight: '600', letterSpacing: '.05em', textTransform: 'uppercase' })}>
                    Simulation
                  </span>
                </header>
                <div style={S({ padding: '22px 20px' })}>
                  <h2 style={S({ margin: '0', fontSize: '24px', fontWeight: '600', letterSpacing: '-0.015em', textWrap: 'balance' })}>
                    {p.title}
                  </h2>
                  <p style={S({ margin: '8px 0 0', fontSize: '14.5px', lineHeight: '1.6', color: 'var(--muted)' })}>
                    {p.sub}
                  </p>
                  <div style={S({ marginTop: '26px', display: 'flex', flexDirection: 'column', gap: '20px' })}>
                    {(p.bars ?? []).map((b: any, b_i: number) => (
                        <Fragment key={b_i}>
                      <div>
                        <div style={S({ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px' })}>
                          <span style={S({ fontSize: '12.5px', color: 'var(--muted)' })}>
                            {b.label}
                          </span>
                          <span style={S({ display: 'flex', alignItems: 'baseline', gap: '6px' })}>
                            <span style={S({ fontSize: '30px', fontWeight: '600', lineHeight: '1', letterSpacing: '-0.02em', color: b.color })}>
                              {b.value}
                            </span>
                            <span style={S({ fontSize: '14px', color: 'var(--muted)' })}>
                              {b.unit}
                            </span>
                          </span>
                        </div>
                        <div style={S({ position: 'relative', marginTop: '10px', height: '14px', background: 'repeating-linear-gradient(to right, color-mix(in srgb, var(--rule) 80%, transparent) 0 2px, transparent 2px 8px)' })}>
                          <span style={S({ position: 'absolute', left: '0', top: '0', bottom: '0', width: b.pct, background: b.fill, transition: 'width 600ms cubic-bezier(.22,1,.36,1)' })}>
                          </span>
                        </div>
                      </div>
                        </Fragment>
                      ))}
                  </div>
                  <dl style={S({ margin: '26px 0 0', display: 'grid', gridTemplateColumns: '1fr 1fr', border: '1px solid var(--rule)', borderRadius: '20px', overflow: 'hidden', background: 'var(--panel)' })}>
                    {(p.big ?? []).map((g: any, g_i: number) => (
                        <Fragment key={g_i}>
                      <div style={S({ padding: '16px 18px', borderRight: '1px solid var(--rule)' })}>
                        <dt style={S({ fontSize: '12px', color: 'var(--muted)' })}>
                          {g.k}
                        </dt>
                        <dd style={S({ margin: '10px 0 0' })}>
                          <span style={S({ fontSize: 'clamp(36px, 4vw, 52px)', fontWeight: '600', lineHeight: '.9', letterSpacing: '-0.035em', color: g.color })}>
                            {g.v}
                          </span>
                          <span style={S({ fontSize: '14px', color: 'var(--muted)' })}>
                            {g.u}
                          </span>
                        </dd>
                        {(g.note) ? (
                          <>
                          <p style={S({ margin: '8px 0 0', fontFamily: 'ui-monospace, Menlo, monospace', fontSize: '12.5px', color: 'var(--muted)' })}>
                            {g.note}
                          </p>
                          </>
                        ) : null}
                      </div>
                        </Fragment>
                      ))}
                  </dl>
                  {(p.model) ? (
                    <>
                    <div style={S({ marginTop: '20px', border: '1px solid color-mix(in srgb, var(--accent) 35%, transparent)', background: 'var(--accent-wash)' })}>
                      <button type="button" role="switch" aria-checked={v.modelStr} onClick={v.flipModel} style={S({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', width: '100%', minHeight: '48px', padding: '0 16px', background: 'transparent', border: '0', color: 'var(--accent)', fontSize: '12.5px', cursor: 'pointer' })}>
                        The model, in one sentence
                        <span aria-hidden="true" style={S({ position: 'relative', width: '40px', height: '22px', borderRadius: '999px', border: '1px solid var(--accent)', background: v.mBg })}>
                          <span style={S({ position: 'absolute', top: '3px', left: '3px', width: '14px', height: '14px', borderRadius: '999px', background: 'var(--accent)', transform: v.mX, transition: 'transform 200ms cubic-bezier(.22,1,.36,1)' })}>
                          </span>
                        </span>
                      </button>
                      {(v.modelOpen) ? (
                        <>
                        <div style={S({ padding: '0 16px 16px', fontSize: '14.5px', lineHeight: '1.6' })}>
                          <p style={S({ margin: '0' })}>
                            On each person-day someone either does the check or does not; if they do, and it is a bad day, and the score rewards healthy values, they may skip reporting it. Rewarding effort removes that last step, so it can only ever report more, never less.
                          </p>
                          <p style={S({ margin: '10px 0 0', fontSize: '13.5px', color: 'var(--muted)' })}>
                            Both schemes are run from the same random draws, so with a hiding chance of zero the two are identical rather than merely close. Deterministic for a given seed. The claim that people under-report when bad values are punished is an assumption we made, not a result we found.
                          </p>
                        </div>
                        </>
                      ) : null}
                    </div>
                    </>
                  ) : null}
                </div>
                <div style={S({ padding: '20px', borderTop: '1px solid var(--rule)', background: 'var(--paper-deep)' })}>
                  <div style={S({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' })}>
                    <h3 style={S({ margin: '0', fontSize: '12.5px', fontWeight: '500', color: 'var(--muted)' })}>
                      Assumptions — change them
                    </h3>
                    <button type="button" onClick={p.reset} style={S({ display: 'inline-flex', alignItems: 'center', gap: '8px', minHeight: '44px', padding: '0 12px', background: 'transparent', border: '1px solid transparent', color: 'var(--accent)', fontSize: '13px', cursor: 'pointer' })} className="metricsview-hover-1">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4">
                        </path>
                      </svg>
                      Reset
                    </button>
                  </div>
                  <div style={S({ marginTop: '14px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 230px), 1fr))', gap: '18px 28px' })}>
                    {(p.fields ?? []).map((f: any, f_i: number) => (
                        <Fragment key={f_i}>
                      <div>
                        <div style={S({ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '10px', minHeight: '36px' })}>
                          <label htmlFor={f.id} style={S({ fontSize: '13.5px', lineHeight: '1.35', color: 'var(--ink-soft)' })}>
                            {f.label}
                          </label>
                          {(f.slider) ? (
                            <>
                            <span style={S({ flexShrink: '0', padding: '2px 7px', border: '1px solid color-mix(in srgb, var(--accent) 45%, transparent)', fontFamily: 'ui-monospace, Menlo, monospace', fontSize: '13px', fontWeight: '600', color: 'var(--accent)' })}>
                              {f.display}
                            </span>
                            </>
                          ) : null}
                        </div>
                        {(f.slider) ? (
                          <>
                          <input id={f.id} data-chm-range="1" type="range" min={f.min} max={f.max} step={f.step} value={f.value} onChange={f.change} style={S({ '--pct': f.pct })} />
                          </>
                        ) : null}
                        {(f.stepper) ? (
                          <>
                          <div style={S({ marginTop: '4px', display: 'flex', alignItems: 'stretch', background: 'var(--paper)', border: '1px solid var(--rule-strong)' })}>
                            <button type="button" onClick={f.dec} aria-label={f.decLabel} style={S({ width: '44px', minHeight: '44px', background: 'none', border: '0', color: 'var(--muted)', fontSize: '18px', cursor: 'pointer' })} className="metricsview-hover-2">
                              −
                            </button>
                            <input id={f.id} data-step="1" type="number" min={f.min} max={f.max} step={f.step} value={f.value} onChange={f.change} style={S({ flex: '1', minWidth: '0', border: '0', borderLeft: '1px solid var(--rule)', borderRight: '1px solid var(--rule)', background: 'transparent', color: 'var(--ink)', fontFamily: 'ui-monospace, Menlo, monospace', fontSize: '17px', fontWeight: '600', textAlign: 'center', outline: 'none' })} />
                            <button type="button" onClick={f.inc} aria-label={f.incLabel} style={S({ width: '44px', minHeight: '44px', background: 'none', border: '0', color: 'var(--muted)', fontSize: '18px', cursor: 'pointer' })} className="metricsview-hover-3">
                              +
                            </button>
                          </div>
                          </>
                        ) : null}
                      </div>
                        </Fragment>
                      ))}
                  </div>
                </div>
              </section>
                </Fragment>
              ))}
          </div>
          <p style={S({ margin: '32px 0 0', maxWidth: '72ch', fontFamily: 'ui-monospace, Menlo, monospace', fontSize: '13px', lineHeight: '1.6', color: 'var(--muted)' })}>
            The same assumptions are written down in NOTES.md so they end up on the limitations slide rather than being quietly forgotten.
          </p>
          <div style={{ marginTop: 20 }}><SourcesUsed id="metrics" /></div>
        </main>
        <P.SiteFooter dock={true} />
        <P.CrewDock current="Metrics" />
      </div>
    </>
  )
}
