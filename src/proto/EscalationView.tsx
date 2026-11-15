// @ts-nocheck
/* eslint-disable */
// GENERATED from the UI overhaul prototype by dc2jsx.py. Styles are the prototype's, verbatim.
// Edit the view model that feeds this, not this markup, unless you are re-porting the prototype.
import { Fragment } from 'react'
import { GroundLinkPanel } from './GroundLink'
import * as P from './parts'
import { S } from './parts'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function EscalationView({ v }: { v: any }) {
  return (
    <>
      <div data-chm-root="1" style={S({ '--ink': '#14181f', '--ink-soft': '#2b323d', '--paper': '#f3f1ea', '--paper-deep': '#e8e4d8', '--panel': '#fbfaf6', '--panel-2': '#f6f4ec', '--rule': '#d9d4c4', '--rule-strong': '#a49c88', '--muted': '#5b6270', '--accent': '#0b3d91', '--accent-wash': '#e4e9f3', '--ok': '#2f7d4f', '--ok-ink': '#1b5b33', '--watch': '#b7791f', '--watch-ink': '#7a4f00', '--act': '#b3261e', '--act-ink': '#8c1d18', '--nodata': '#8a8f98', '--nodata-ink': '#5b6270', '--on-accent': '#ffffff', '--star-o': '0', '--glow': 'none', minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--paper)', color: 'var(--ink)', fontFamily: 'ui-sans-serif, system-ui, -apple-system, \'Segoe UI\', Roboto, sans-serif', fontVariantNumeric: 'tabular-nums' })}>
        <P.TopBar current="Escalation" />
        <main id="main" tabIndex={-1} style={S({ flex: '1', width: '100%', maxWidth: '1500px', margin: '0 auto', padding: '32px clamp(16px, 3vw, 24px) 56px', boxSizing: 'border-box', outline: 'none' })}>
          <div style={S({ paddingBottom: '28px', borderBottom: '1px solid var(--rule)' })}>
            <p style={S({ margin: '0', fontSize: '14px', color: 'var(--muted)' })}>
              Escalation ladder · {v.crewName}
            </p>
            <h1 style={S({ margin: '12px 0 0', fontSize: 'clamp(32px, 4.2vw, 52px)', lineHeight: '1', fontWeight: '700', letterSpacing: '-0.045em' })}>
              Who to tell, and when
            </h1>
            <p style={S({ margin: '18px 0 0', maxWidth: '72ch', fontSize: '15px', lineHeight: '1.65', color: 'var(--muted)', textWrap: 'pretty' })}>
              Four rungs, lowest first. Climb one when the step below has not settled it. No rung is triggered by a number: this app compares you with your own baseline and tells you what moved, and the decision stays with the crew.
            </p>
          </div>
          <div style={S({ marginTop: '32px', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: '32px' })}>
            <div style={S({ flex: '1 1 440px', display: 'flex', flexDirection: 'column', gap: '18px' })}>
              <div style={S({ position: 'relative', padding: '28px 12px 12px', borderRadius: '28px', background: 'var(--panel)', border: '1px solid var(--rule)', overflow: 'hidden' })}>
                <p style={S({ margin: '0 0 6px 12px', fontSize: '14px', color: 'var(--muted)' })}>
                  The ladder · climb only when the step below has not settled it
                </p>
                <ol style={S({ position: 'relative', listStyle: 'none', margin: '0', padding: '0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' })}>
                  {(v.rungs ?? []).map((r: any, r_i: number) => (
                      <Fragment key={r_i}>
                    <li style={S({ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `translateX(${r.shift})`, padding: '10px 0' })}>
                      {(r.isOpen) ? (
                        <>
                        <span aria-hidden="true" style={S({ position: 'absolute', top: '-14px', padding: '4px 10px', borderRadius: '10px', background: 'var(--ink)', color: 'var(--paper)', fontSize: '12px', fontWeight: '700', whiteSpace: 'nowrap', animation: 'esc-bob 1.6s ease-in-out infinite' })}>
                          {r.tag}
                        </span>
                        </>
                      ) : null}
                      <button type="button" onClick={r.toggle} aria-pressed={r.open} aria-label={r.aria} style={S({ position: 'relative', display: 'grid', placeItems: 'center', width: '84px', height: '78px', borderRadius: '999px', background: r.nodeBg, color: r.nodeInk, border: '0', boxShadow: `0 8px 0 ${r.nodeShadow}`, cursor: 'pointer', transition: 'transform 120ms ease, box-shadow 120ms ease' })} className="escalationview-active-1">
                        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d={r.icon}>
                          </path>
                        </svg>
                        {(r.isOpen) ? (
                          <>
                          <span aria-hidden="true" style={S({ position: 'absolute', inset: '-9px', borderRadius: '999px', border: `3px solid ${r.ring}`, animation: 'esc-ring 2s ease-out infinite' })}>
                          </span>
                          </>
                        ) : null}
                      </button>
                      <span style={S({ display: 'block', marginTop: '16px', fontSize: '15px', fontWeight: '700', letterSpacing: '-0.01em', whiteSpace: 'nowrap', textAlign: 'center' })}>
                        {r.title}
                      </span>
                      <span style={S({ display: 'block', fontSize: '12.5px', color: 'var(--muted)', whiteSpace: 'nowrap', textAlign: 'center' })}>
                        Rung {r.n}
                      </span>
                    </li>
                      </Fragment>
                    ))}
                </ol>
              </div>
              {(v.rungs ?? []).map((r: any, r_i: number) => (
                  <Fragment key={r_i}>
                {(r.isOpen) ? (
                  <>
                  <div key={r.n} style={S({ padding: '22px 24px', borderRadius: '24px', background: r.cardBg, color: r.cardInk, animation: 'esc-in 420ms cubic-bezier(.22,1,.36,1) both' })}>
                    <p style={S({ margin: '0', fontSize: '13.5px', opacity: '.75' })}>
                      Rung {r.n} · when to use it
                    </p>
                    <h2 style={S({ margin: '6px 0 0', fontSize: '28px', lineHeight: '1.05', fontWeight: '750', letterSpacing: '-0.035em' })}>
                      {r.title}
                    </h2>
                    <p style={S({ margin: '12px 0 0', fontSize: '16px', lineHeight: '1.55', textWrap: 'pretty' })}>
                      {r.when}
                    </p>
                    <div style={S({ marginTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' })}>
                      <button type="button" onClick={r.prev} disabled={r.noPrev} style={S({ minHeight: '44px', padding: '0 16px', borderRadius: '12px', background: 'transparent', color: 'inherit', border: '2px solid currentColor', opacity: r.prevOp, fontSize: '14px', fontWeight: '700', cursor: 'pointer' })}>
                        Step down
                      </button>
                      <button type="button" onClick={r.next} disabled={r.noNext} style={S({ minHeight: '44px', padding: '0 18px', borderRadius: '12px', background: r.cardInk, color: r.cardBg, border: '0', opacity: r.nextOp, fontSize: '14px', fontWeight: '700', cursor: 'pointer' })}>
                        Climb a rung
                      </button>
                    </div>
                  </div>
                  </>
                ) : null}
                  </Fragment>
                ))}
            </div>
            <section data-reveal="1" aria-labelledby="packet-heading" style={S({ flex: '1.15 1 480px', minWidth: '0', position: 'relative', background: 'var(--panel)', border: '1px solid var(--rule)', borderRadius: '24px', overflow: 'hidden', animation: 'chm-rise 420ms 200ms cubic-bezier(.22,1,.36,1) both' })}>
              <header style={S({ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '6px 14px', minHeight: '40px', padding: '6px 18px', borderBottom: '1px solid var(--rule)' })}>
                <span style={S({ fontSize: '12.5px', color: 'var(--muted)' })}>
                  Rung 04 · ground packet
                </span>
                <span style={S({ fontSize: '12.5px', color: 'var(--muted)' })}>
                  {v.envLabel}
                </span>
              </header>
              <div style={S({ padding: '22px 20px' })}>
                <h2 id="packet-heading" style={S({ margin: '0', fontSize: '24px', fontWeight: '600', letterSpacing: '-0.015em' })}>
                  What would be sent to the flight surgeon
                </h2>
                <dl style={S({ margin: '20px 0 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', border: '1px solid var(--rule)', borderRadius: '20px', overflow: 'hidden', background: 'var(--panel)' })}>
                  {(v.stats ?? []).map((st: any, st_i: number) => (
                      <Fragment key={st_i}>
                    <div style={S({ padding: '14px 16px', borderRight: '1px solid var(--rule)' })}>
                      <dt style={S({ fontSize: '12px', color: 'var(--muted)' })}>
                        {st.k}
                      </dt>
                      <dd style={S({ margin: '10px 0 0', display: 'flex', alignItems: 'baseline', gap: '6px' })}>
                        <span style={S({ fontSize: '40px', fontWeight: '700', lineHeight: '.9', letterSpacing: '-0.045em', color: st.color })}>
                          {st.v}
                        </span>
                        <span style={S({ fontSize: '14px', color: 'var(--muted)' })}>
                          {st.u}
                        </span>
                      </dd>
                    </div>
                      </Fragment>
                    ))}
                </dl>
                <p style={S({ margin: '18px 0 0', fontSize: '14.5px', lineHeight: '1.6', color: 'var(--muted)' })}>
                  Only what changed is sent: {v.crewName} has
                  <span style={S({ fontWeight: '600', color: 'var(--ink)' })}>
                    {v.nChanged}
                  </span>
                  indicator(s) outside their own baseline. Readings that failed the quality check are never included.
                </p>
                {(v.hasChanges) ? (
                  <>
                  <ul style={S({ listStyle: 'none', margin: '16px 0 0', padding: '0', borderTop: '1px solid var(--rule)' })}>
                    {(v.changed ?? []).map((c: any, c_i: number) => (
                        <Fragment key={c_i}>
                      <li style={S({ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: '6px 16px', padding: '14px 0', borderBottom: '1px solid var(--rule)' })}>
                        <span style={S({ fontSize: '15px', fontWeight: '600' })}>
                          {c.label}
                        </span>
                        <span style={S({ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '2px 7px', border: '1px solid currentColor', color: c.ink, fontFamily: 'ui-monospace, Menlo, monospace', fontSize: '11.5px', fontWeight: '600', letterSpacing: '.04em', textTransform: 'uppercase' })}>
                          {c.short}
                        </span>
                        <span style={S({ gridColumn: '1 / -1', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px 14px', fontFamily: 'ui-monospace, Menlo, monospace', fontSize: '13.5px', color: 'var(--muted)' })}>
                          <span>
                            {c.from} →
                            <span style={S({ fontWeight: '600', color: 'var(--ink)' })}>
                              {c.to}
                            </span>
                            {c.unit}
                          </span>
                          <span style={S({ color: c.ink })}>
                            {c.delta}
                          </span>
                          <span>
                            {c.since}
                          </span>
                        </span>
                      </li>
                        </Fragment>
                      ))}
                  </ul>
                  </>
                ) : null}
                {(v.noChanges) ? (
                  <>
                  <div style={S({ marginTop: '16px', display: 'flex', gap: '14px', alignItems: 'center', padding: '18px', border: '1px dashed var(--rule-strong)' })}>
                    <span aria-hidden="true" style={S({ display: 'grid', placeItems: 'center', width: '40px', height: '40px', flexShrink: '0', border: '1px solid var(--ok)', color: 'var(--ok-ink)' })}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4.8 12.6 9.6 17.4 19.2 6.6">
                        </path>
                      </svg>
                    </span>
                    <p style={S({ margin: '0', fontSize: '14px', lineHeight: '1.55', color: 'var(--muted)' })}>
                      <span style={S({ color: 'var(--ink)', fontWeight: '600' })}>
                        Nothing to send.
                      </span>
                      No indicator with good data is outside this person’s own baseline, so the packet carries no changes.
                    </p>
                  </div>
                  </>
                ) : null}
                <div style={S({ marginTop: '16px', border: '1px solid var(--rule)' })}>
                  <button type="button" aria-expanded={v.jsonOpenStr} onClick={v.toggleJson} style={S({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', minHeight: '46px', padding: '0 14px', background: 'transparent', border: '0', color: 'var(--accent)', fontSize: '13px', cursor: 'pointer' })} className="escalationview-hover-2">
                    Show the exact JSON
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={S({ transform: v.jsonRot, transition: 'transform 200ms ease' })}>
                      <path d="M6 9l6 6 6-6">
                      </path>
                    </svg>
                  </button>
                  {(v.jsonOpen) ? (
                    <>
                    <pre style={S({ margin: '0', maxHeight: '280px', overflow: 'auto', padding: '14px', borderTop: '1px solid var(--rule)', background: 'var(--paper)', fontFamily: 'ui-monospace, Menlo, monospace', fontSize: '13px', lineHeight: '1.55', color: 'var(--ink-soft)' })}>
                      {v.json}
                    </pre>
                    </>
                  ) : null}
                </div>
              </div>
              <div style={S({ padding: '22px 20px', borderTop: '1px solid var(--rule)', background: 'var(--paper-deep)' })}>
                <div aria-hidden="true" style={S({ display: 'flex', alignItems: 'center', gap: '14px' })}>
                  <span style={S({ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', fontSize: '11.5px', color: 'var(--muted)' })}>
                    <span style={S({ width: '12px', height: '12px', border: '1px solid var(--accent)', transform: 'rotate(45deg)' })}>
                    </span>
                    Ship
                  </span>
                  <div style={S({ position: 'relative', flex: '1', height: '2px', background: 'repeating-linear-gradient(to right, var(--rule-strong) 0 6px, transparent 6px 12px)' })}>
                    <span style={S({ position: 'absolute', left: '0', top: '0', height: '2px', width: v.pct, background: 'var(--accent)', transition: 'width 1s linear' })}>
                    </span>
                    <span style={S({ position: 'absolute', top: '50%', left: v.pct, width: '12px', height: '12px', borderRadius: '9999px', transform: 'translate(-50%, -50%)', background: v.dotBg, boxShadow: v.dotGlow, transition: 'left 1s linear' })}>
                    </span>
                  </div>
                  <span style={S({ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', fontSize: '11.5px', color: 'var(--muted)' })}>
                    <span style={S({ width: '12px', height: '12px', borderRadius: '9999px', border: '1px solid var(--accent)' })}>
                    </span>
                    Ground
                  </span>
                </div>
                <div style={S({ marginTop: '22px', display: 'flex', flexWrap: 'wrap', gap: '10px' })}>
                  <button type="button" onPointerDown={v.holdStart} onPointerUp={v.holdEnd} onPointerLeave={v.holdEnd} onKeyDown={v.holdKey} disabled={v.sending} aria-label="Transmit (simulated). Press and hold, or press Enter." style={S({ position: 'relative', overflow: 'hidden', display: 'inline-flex', alignItems: 'center', gap: '10px', minHeight: '50px', padding: '0 22px', background: v.txBg, border: '1px solid var(--accent)', color: v.txColor, fontSize: '13.5px', fontWeight: '600', cursor: v.txCursor, userSelect: 'none', touchAction: 'none' })}>
                    <span aria-hidden="true" style={S({ position: 'absolute', inset: '0', width: v.holdPct, background: 'color-mix(in srgb, var(--accent) 40%, transparent)', transition: `width ${v.holdEase}` })}>
                    </span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={S({ position: 'relative' })}>
                      <path d="M3.6 11.4 20.4 4l-7.4 16.8-2-7-7.4-2.4Z">
                      </path>
                    </svg>
                    <span style={S({ position: 'relative' })}>
                      {v.txText}
                    </span>
                  </button>
                  <button type="button" onClick={v.download} style={S({ display: 'inline-flex', alignItems: 'center', gap: '10px', minHeight: '50px', padding: '0 20px', background: 'transparent', border: '1px solid var(--rule-strong)', color: 'var(--ink)', fontSize: '13.5px', fontWeight: '600', cursor: 'pointer', transition: 'border-color 140ms ease, color 140ms ease' })} className="escalationview-hover-3">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 3.8v10.4M7.8 10l4.2 4.2 4.2-4.2M4.5 19.2h15">
                      </path>
                    </svg>
                    Download JSON
                  </button>
                  {(v.sending) ? (
                    <>
                    <button type="button" onClick={v.reset} style={S({ display: 'inline-flex', alignItems: 'center', minHeight: '50px', padding: '0 16px', background: 'transparent', border: '1px solid transparent', color: 'var(--muted)', fontSize: '13.5px', fontWeight: '600', cursor: 'pointer' })} className="escalationview-hover-4">
                      Reset
                    </button>
                    </>
                  ) : null}
                </div>
                <div aria-live="polite" style={S({ marginTop: '18px', minHeight: '90px' })}>
                  {(v.idle) ? (
                    <>
                    <p style={S({ margin: '0', fontSize: '14px', lineHeight: '1.55', color: 'var(--muted)' })}>
                      Nothing leaves this browser: the transmit button simulates the {v.envLabel} link and starts the one-way clock.
                    </p>
                    </>
                  ) : null}
                  {(v.counting) ? (
                    <>
                    <p style={S({ margin: '0', fontSize: '12.5px', color: 'var(--muted)' })}>
                      Arrives in
                    </p>
                    <p style={S({ margin: '6px 0 0', display: 'flex', gap: '4px', fontFamily: 'ui-monospace, Menlo, monospace', fontSize: '48px', fontWeight: '600', lineHeight: '1', color: 'var(--accent)' })}>
                      {(v.digits ?? []).map((d: any, d_i: number) => (
                          <Fragment key={d_i}>
                        <span style={S({ display: 'inline-grid', placeItems: 'center', minWidth: d.w, padding: '6px 2px', background: d.bg, border: d.border })}>
                          {d.c}
                        </span>
                          </Fragment>
                        ))}
                    </p>
                    <p style={S({ margin: '12px 0 0', fontFamily: 'ui-monospace, Menlo, monospace', fontSize: '13px', lineHeight: '1.55', color: 'var(--muted)' })}>
                      Ground receives it around {v.arrival}. A reply cannot come back in less than another {v.delayText}.
                    </p>
                    </>
                  ) : null}
                  {(v.delivered) ? (
                    <>
                    <div style={S({ display: 'flex', gap: '12px', alignItems: 'flex-start', animation: 'chm-rise 300ms cubic-bezier(.22,1,.36,1) both' })}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ok-ink)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={S({ marginTop: '2px' })}>
                        <path d="M4.8 12.6 9.6 17.4 19.2 6.6">
                        </path>
                      </svg>
                      <p style={S({ margin: '0', fontSize: '14.5px' })}>
                        <span style={S({ fontWeight: '600', color: 'var(--ok-ink)' })}>
                          Delivered to the ground.
                        </span>
                        <br />
                        <span style={S({ color: 'var(--muted)' })}>
                          Earliest possible reply: another {v.delayText} from now.
                        </span>
                      </p>
                    </div>
                    </>
                  ) : null}
                </div>
              </div>
            </section>
          </div>
          <div style={{ marginTop: 28 }}><GroundLinkPanel /></div>
        </main>
        <P.SiteFooter dock={true} />
        <P.CrewDock current="Escalation" />
      </div>
    </>
  )
}
