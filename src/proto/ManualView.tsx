// @ts-nocheck
/* eslint-disable */
// GENERATED from the UI overhaul prototype by dc2jsx.py. Styles are the prototype's, verbatim.
// Edit the view model that feeds this, not this markup, unless you are re-porting the prototype.
import { Fragment } from 'react'
import { FoodWater } from './FoodWater'
import { ReactionTest } from './ReactionTest'
import * as P from './parts'
import { S } from './parts'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ManualView({ v }: { v: any }) {
  return (
    <>
      <div data-chm-root="1" style={S({ '--ink': '#14181f', '--ink-soft': '#2b323d', '--paper': '#f3f1ea', '--paper-deep': '#e8e4d8', '--panel': '#fbfaf6', '--panel-2': '#f6f4ec', '--rule': '#d9d4c4', '--rule-strong': '#a49c88', '--muted': '#5b6270', '--accent': '#0b3d91', '--accent-wash': '#e4e9f3', '--ok': '#2f7d4f', '--ok-ink': '#1b5b33', '--watch': '#b7791f', '--watch-ink': '#7a4f00', '--act': '#b3261e', '--act-ink': '#8c1d18', '--nodata': '#8a8f98', '--nodata-ink': '#5b6270', '--on-accent': '#ffffff', '--star-o': '0', '--glow': 'none', minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--paper)', color: 'var(--ink)', fontFamily: 'ui-sans-serif, system-ui, -apple-system, \'Segoe UI\', Roboto, sans-serif', fontVariantNumeric: 'tabular-nums' })}>
        <P.TopBar current="Manual entry" />
        <main id="main" tabIndex={-1} style={S({ flex: '1', width: '100%', maxWidth: '1440px', margin: '0 auto', padding: '28px clamp(16px, 3vw, 32px) 72px', boxSizing: 'border-box', outline: 'none', display: 'flex', flexDirection: 'column', gap: '24px' })}>
          <div style={S({ display: 'flex', flexWrap: 'wrap', alignItems: 'stretch', gap: '20px' })}>
            <div style={S({ flex: '2 1 520px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '14px', padding: '8px 0', animation: 'lg-rise 520ms cubic-bezier(.22,1,.36,1) both' })}>
              <p style={S({ margin: '0', fontSize: '14px', color: 'var(--muted)' })}>
                Log · {v.crewName}
              </p>
              <h1 style={S({ margin: '0', fontSize: 'clamp(40px, 6vw, 76px)', lineHeight: '.92', fontWeight: '750', letterSpacing: '-0.05em' })}>
                Log what the
                <br />
                camera can’t see.
              </h1>
              <p style={S({ margin: '0', maxWidth: '60ch', fontSize: '16px', lineHeight: '1.55', color: 'var(--ink-soft)', textWrap: 'pretty' })}>
                Cuff, thermometer, glucose meter, mass device, or the clock. Each reading feeds the same baseline as the mirror check. Field limits only catch typos; they are not health limits, and a reading earns the same coins whatever it says.
              </p>
            </div>
          </div>
          <FoodWater />
          <ReactionTest />
          <div style={S({ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: '24px' })}>
            <div style={S({ flex: '999 1 640px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: '18px' })}>
              {(v.forms ?? []).map((f: any, f_i: number) => (
                  <Fragment key={f_i}>
                <form onSubmit={f.submit} onFocus={f.focus} aria-label={f.title} style={S({ position: 'relative', display: 'flex', flexDirection: 'column', borderRadius: '26px', background: 'var(--panel)', border: `2px solid ${f.border}`, transform: f.lift, animation: `lg-rise 560ms ${f.delay} cubic-bezier(.22,1,.36,1) both${f.anim}`, transition: 'border-color 200ms ease, transform 300ms cubic-bezier(.34,1.56,.64,1)' })}>
                  {(f.coinFx) ? (
                    <>
                    <span key={f.fxKey} aria-hidden="true" style={S({ position: 'absolute', left: '50%', top: '18px', zIndex: '3', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '999px', background: '#f6c445', color: '#3b2a00', fontSize: '15px', fontWeight: '800', pointerEvents: 'none', animation: 'lg-coin 1.3s cubic-bezier(.22,1,.36,1) forwards' })}>
                      <svg width="16" height="16" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" fill="#fff4c7">
                        </circle>
                        <circle cx="12" cy="12" r="6.6" fill="none" stroke="#b9831a" strokeWidth="1.6">
                        </circle>
                      </svg>
                      +{f.coinFx}
                    </span>
                    </>
                  ) : null}
                  <header style={S({ display: 'flex', alignItems: 'center', gap: '14px', padding: '18px 18px 0' })}>
                    <span aria-hidden="true" style={S({ display: 'grid', placeItems: 'center', width: '50px', height: '50px', flexShrink: '0', borderRadius: '16px', background: f.tileBg, color: f.tileInk, boxShadow: `0 4px 0 ${f.tileShadow}`, transform: 'rotate(-4deg)', transition: 'background-color 200ms ease' })}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d={f.icon}>
                        </path>
                      </svg>
                    </span>
                    <div style={S({ minWidth: '0', flex: '1' })}>
                      <h2 style={S({ margin: '0', fontSize: '20px', fontWeight: '750', letterSpacing: '-0.02em' })}>
                        {f.title}
                      </h2>
                      <p style={S({ margin: '2px 0 0', fontSize: '13px', color: 'var(--muted)' })}>
                        Feeds {f.region}
                      </p>
                    </div>
                    <span style={S({ flexShrink: '0', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '999px', background: '#f6c445', color: '#3b2a00', fontSize: '12.5px', fontWeight: '750', whiteSpace: 'nowrap' })}>
                      <svg width="13" height="13" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" fill="#f6c445">
                        </circle>
                        <circle cx="12" cy="12" r="6.6" fill="none" stroke="#b9831a" strokeWidth="1.6">
                        </circle>
                      </svg>
                      +{f.reward}
                    </span>
                  </header>
                  <div style={S({ flex: '1', display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px 18px 18px' })}>
                    <p style={S({ margin: '0', fontSize: '14px', lineHeight: '1.5', color: 'var(--muted)' })}>
                      {f.hint}
                    </p>
                    {(f.fields ?? []).map((fd: any, fd_i: number) => (
                        <Fragment key={fd_i}>
                      <div>
                        <div style={S({ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '12px' })}>
                          <label htmlFor={fd.id} style={S({ fontSize: '13.5px', fontWeight: '600' })}>
                            {fd.label}
                          </label>
                          <span style={S({ fontSize: '13px', color: 'var(--muted)' })}>
                            {fd.unit}
                          </span>
                        </div>
                        <div style={S({ marginTop: '8px', display: 'flex', alignItems: 'stretch', borderRadius: '16px', background: 'var(--panel-2)', border: `2px solid ${fd.border}`, overflow: 'hidden', animation: fd.shake, transition: 'border-color 160ms ease' })}>
                          <button type="button" onClick={fd.dec} aria-label={fd.decLabel} style={S({ display: 'grid', placeItems: 'center', width: '52px', minHeight: '56px', background: 'none', border: '0', color: 'var(--ink)', cursor: 'pointer', fontSize: '22px', fontWeight: '600' })} className="manualview-hover-1 manualview-active-2">
                            −
                          </button>
                          <input id={fd.id} data-step="1" type="number" inputMode="decimal" step={fd.step} value={fd.value} onChange={fd.change} aria-invalid={fd.invalid} aria-describedby={fd.describedBy} placeholder="—" style={S({ flex: '1', minWidth: '0', border: '0', background: 'transparent', color: 'var(--ink)', fontSize: '28px', fontWeight: '750', letterSpacing: '-0.02em', textAlign: 'center', padding: '4px', outline: 'none', fontFamily: 'inherit' })} />
                          <button type="button" onClick={fd.inc} aria-label={fd.incLabel} style={S({ display: 'grid', placeItems: 'center', width: '52px', minHeight: '56px', background: 'none', border: '0', color: 'var(--ink)', cursor: 'pointer' })} className="manualview-hover-3 manualview-active-4">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                              <path d="M12 5v14M5 12h14">
                              </path>
                            </svg>
                          </button>
                        </div>
                        {(fd.slider) ? (
                          <>
                          <div style={S({ position: 'relative', marginTop: '24px' })}>
                            <span aria-hidden="true" style={S({ position: 'absolute', top: '-20px', left: fd.pct, transform: 'translateX(-50%)', padding: '3px 8px', borderRadius: '8px', background: 'var(--ink)', color: 'var(--paper)', fontSize: '12px', fontWeight: '700', whiteSpace: 'nowrap', opacity: fd.bubbleOp, transition: 'opacity 160ms ease' })}>
                              {fd.bubble}
                            </span>
                            <input data-chm-range="1" type="range" aria-label={fd.sliderLabel} min={fd.min} max={fd.max} step={fd.step} value={fd.safe} onChange={fd.change} style={S({ '--pct': fd.pct })} />
                            <div style={S({ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: 'var(--muted)' })}>
                              <span>
                                {fd.minText}
                              </span>
                              <span>
                                {fd.maxText}
                              </span>
                            </div>
                          </div>
                          </>
                        ) : null}
                      </div>
                        </Fragment>
                      ))}
                    <p id={f.errorId} role="alert" style={S({ margin: '0', minHeight: '20px', fontSize: '13.5px', lineHeight: '1.45', fontWeight: '500', color: 'var(--act-ink)' })}>
                      {f.error}
                    </p>
                    <button type="submit" disabled={f.disabled} style={S({ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%', minHeight: '54px', borderRadius: '16px', background: f.btnBg, color: f.btnColor, border: '0', boxShadow: `0 5px 0 ${f.btnShadow}`, fontSize: '15.5px', fontWeight: '750', cursor: f.cursor, transition: 'transform 90ms ease, box-shadow 90ms ease, background-color 200ms ease' })} className="manualview-active-5">
                      {f.btnText}
                    </button>
                    <div aria-live="polite" style={S({ minHeight: '22px' })}>
                      {(f.saved) ? (
                        <>
                        <p key={f.fxKey} style={S({ margin: '0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', lineHeight: '1.45', color: 'var(--ok-ink)', animation: 'lg-rise 400ms cubic-bezier(.22,1,.36,1) both' })}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={S({ flexShrink: '0' })}>
                            <path d="M20 6 9 17l-5-5">
                            </path>
                          </svg>
                          <span>
                            <span style={S({ fontWeight: '700' })}>
                              Logged {f.savedText}.
                            </span>
                            {f.savedNote}
                          </span>
                        </p>
                        </>
                      ) : null}
                    </div>
                  </div>
                </form>
                  </Fragment>
                ))}
            </div>
            <aside aria-label="This session" style={S({ flex: '1 1 300px', position: 'sticky', top: '104px', borderRadius: '26px', background: 'var(--panel)', border: '1px solid var(--rule)', overflow: 'hidden', animation: 'lg-rise 560ms 200ms cubic-bezier(.22,1,.36,1) both' })}>
              <header style={S({ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '18px 20px 12px' })}>
                <span style={S({ fontSize: '18px', fontWeight: '750', letterSpacing: '-0.02em' })}>
                  This session
                </span>
                <span style={S({ fontSize: '13px', color: 'var(--muted)' })}>
                  {v.logCount}
                </span>
              </header>
              {(v.logEmpty) ? (
                <>
                <div style={S({ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '20px 20px 28px' })}>
                  <span aria-hidden="true" style={S({ display: 'grid', placeItems: 'center', width: '72px', height: '72px', borderRadius: '22px', background: 'var(--paper-deep)', color: 'var(--muted)', transform: 'rotate(-6deg)', animation: 'lg-bob 3s ease-in-out infinite' })}>
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9 M16.38 3.62a1 1 0 0 1 3 3L7.37 18.64a2 2 0 0 1-.86.5l-2.87.84a.5.5 0 0 1-.62-.62l.84-2.87a2 2 0 0 1 .5-.86z">
                      </path>
                    </svg>
                  </span>
                  <p style={S({ margin: '16px 0 0', fontSize: '16px', fontWeight: '700' })}>
                    Nothing logged yet
                  </p>
                  <p style={S({ margin: '6px 0 0', maxWidth: '26ch', fontSize: '14px', lineHeight: '1.5', color: 'var(--muted)' })}>
                    Readings you save on this visit stack up here, newest first.
                  </p>
                </div>
                </>
              ) : null}
              <ol style={S({ listStyle: 'none', margin: '0', padding: '0 12px' })}>
                {(v.log ?? []).map((l: any, l_i: number) => (
                    <Fragment key={l_i}>
                  <li style={S({ display: 'grid', gridTemplateColumns: '36px 1fr auto', alignItems: 'center', gap: '12px', padding: '10px 8px', borderTop: '1px solid var(--rule)', animation: 'lg-rise 380ms cubic-bezier(.22,1,.36,1) both' })}>
                    <span aria-hidden="true" style={S({ display: 'grid', placeItems: 'center', width: '36px', height: '36px', borderRadius: '12px', background: 'var(--ink)', color: 'var(--paper)' })}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d={l.icon}>
                        </path>
                      </svg>
                    </span>
                    <span style={S({ minWidth: '0' })}>
                      <span style={S({ display: 'block', fontSize: '14px', fontWeight: '600', overflowWrap: 'anywhere' })}>
                        {l.text}
                      </span>
                      <span style={S({ display: 'block', marginTop: '2px', fontSize: '12.5px', color: 'var(--muted)' })}>
                        {l.at} · {l.region}
                      </span>
                    </span>
                    <span style={S({ fontSize: '13px', fontWeight: '750', color: 'var(--watch-ink)', whiteSpace: 'nowrap' })}>
                      +{l.points}
                    </span>
                  </li>
                    </Fragment>
                  ))}
              </ol>
              <div style={S({ padding: '14px 16px 16px' })}>
                <a href="Body%20Map.dc.html" style={S({ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', minHeight: '50px', borderRadius: '14px', background: '#14181f', color: '#f3f1ea', textDecoration: 'none', fontSize: '15px', fontWeight: '700', boxShadow: '0 4px 0 #000' })} className="manualview-active-6 manualview-hover-7">
                  See it on the body map
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14 M12 5l7 7-7 7">
                    </path>
                  </svg>
                </a>
              </div>
            </aside>
          </div>
        </main>
        <P.SiteFooter dock={true} />
        <P.CrewDock current="Manual entry" />
      </div>
    </>
  )
}
