// @ts-nocheck
/* eslint-disable */
// GENERATED from the UI overhaul prototype by dc2jsx.py. Styles are the prototype's, verbatim.
// Edit the view model that feeds this, not this markup, unless you are re-porting the prototype.
import { Fragment } from 'react'
import * as P from './parts'
import { S } from './parts'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function OnboardingView({ v }: { v: any }) {
  return (
    <>
      <div data-chm-root="1" style={S({ '--ink': '#14181f', '--ink-soft': '#2b323d', '--paper': '#f3f1ea', '--paper-deep': '#e8e4d8', '--panel': '#fbfaf6', '--panel-2': '#f6f4ec', '--rule': '#d9d4c4', '--rule-strong': '#a49c88', '--muted': '#5b6270', '--accent': '#0b3d91', '--accent-wash': '#e4e9f3', '--ok': '#2f7d4f', '--ok-ink': '#1b5b33', '--watch': '#b7791f', '--watch-ink': '#7a4f00', '--act': '#b3261e', '--act-ink': '#8c1d18', '--nodata': '#8a8f98', '--nodata-ink': '#5b6270', '--on-accent': '#ffffff', '--star-o': '0', '--glow': 'none', minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--paper)', color: 'var(--ink)', fontFamily: 'ui-sans-serif, system-ui, -apple-system, \'Segoe UI\', Roboto, sans-serif' })}>
        <header style={S({ position: 'sticky', top: '0', zIndex: '5', background: 'var(--paper)' })}>
          <div style={S({ maxWidth: '980px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 20px' })}>
            <a href="Landing.dc.html" aria-label="Leave setup" style={S({ display: 'grid', placeItems: 'center', width: '44px', height: '44px', borderRadius: '999px', color: 'var(--muted)', textDecoration: 'none' })} className="onboardingview-hover-1">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6 6 18 M6 6l12 12">
                </path>
              </svg>
            </a>
            <div role="progressbar" aria-label="Setup progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow={v.pctNum} style={S({ flex: '1', height: '14px', borderRadius: '999px', background: 'var(--paper-deep)', overflow: 'hidden' })}>
              <span style={S({ display: 'block', height: '100%', width: v.pct, borderRadius: '999px', background: 'var(--ink)', boxShadow: 'inset 0 -3px 0 rgba(255,255,255,.12)', transition: 'width 600ms cubic-bezier(.34,1.56,.64,1)' })}>
              </span>
            </div>
            <span style={S({ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '650', color: 'var(--ink)', whiteSpace: 'nowrap' })}>
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="10" fill="#f6c445">
                </circle>
                <circle cx="12" cy="12" r="6.6" fill="none" stroke="#b9831a" strokeWidth="1.6">
                </circle>
                <path d="M12 8.6v6.8" stroke="#b9831a" strokeWidth="1.6" strokeLinecap="round">
                </path>
              </svg>
              {v.pending}
            </span>
          </div>
        </header>
        <main id="main" style={S({ flex: '1', width: '100%', maxWidth: '980px', margin: '0 auto', padding: '4px 20px 140px', boxSizing: 'border-box' })}>
          <div key={v.step} style={S({ animation: 'ob-in 460ms cubic-bezier(.22,1,.36,1) both' })}>
            {(v.isWelcome) ? (
              <>
              <section style={S({ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingTop: 'clamp(4px, 3vh, 48px)' })}>
                <div style={S({ position: 'relative', display: 'grid', placeItems: 'center', width: 'min(220px, 26vh)', height: 'min(220px, 26vh)' })}>
                  <span aria-hidden="true" style={S({ position: 'absolute', inset: '0', borderRadius: '999px', background: 'radial-gradient(circle, color-mix(in srgb, var(--accent) 14%, transparent), transparent 70%)', animation: 'ob-glow 3.2s ease-in-out infinite' })}>
                  </span>
                  <span style={S({ animation: 'ob-bob 3.6s ease-in-out infinite' })}>
                    <P.Avatar crew={v.guide} gear={v.guideGear} size={v.heroAv} ring="var(--ink)" />
                  </span>
                </div>
                <h1 style={S({ margin: '16px 0 0', maxWidth: '16ch', fontSize: 'clamp(36px, 5.4vw, 60px)', lineHeight: '1', fontWeight: '700', letterSpacing: '-0.045em', textWrap: 'balance' })}>
                  Your crew console, set up in a minute.
                </h1>
                <p style={S({ margin: '18px 0 0', maxWidth: '46ch', fontSize: '18px', lineHeight: '1.55', color: 'var(--ink-soft)', textWrap: 'pretty' })}>
                  Thirty seconds a day keeps your own baseline honest. Finish setup and your first 50 coins are waiting.
                </p>
                <ul style={S({ listStyle: 'none', margin: '30px 0 0', padding: '0', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px' })}>
                  {(v.perks ?? []).map((p: any, p_i: number) => (
                      <Fragment key={p_i}>
                    <li style={S({ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 14px', borderRadius: '999px', background: 'var(--panel)', border: '1px solid var(--rule)', fontSize: '14px', fontWeight: '500' })}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d={p.icon}>
                        </path>
                      </svg>
                      {p.t}
                    </li>
                      </Fragment>
                    ))}
                </ul>
              </section>
              </>
            ) : null}
            {(v.isAsk) ? (
              <>
              <section>
                <div style={S({ display: 'flex', alignItems: 'flex-end', gap: '16px', margin: 'clamp(8px, 4vh, 36px) 0 28px' })}>
                  <span style={S({ flexShrink: '0', animation: 'ob-bob 3.6s ease-in-out infinite' })}>
                    <P.Avatar crew={v.guide} gear={v.guideGear} size={84} ring="var(--ink)" />
                  </span>
                  <div style={S({ position: 'relative', padding: '16px 20px', background: 'var(--panel)', border: '2px solid var(--rule)', borderRadius: '22px', borderBottomLeftRadius: '6px', animation: 'ob-bubble 420ms 120ms cubic-bezier(.22,1,.36,1) both' })}>
                    <p style={S({ margin: '0', fontSize: 'clamp(20px, 2.6vw, 26px)', lineHeight: '1.25', fontWeight: '650', letterSpacing: '-0.02em', textWrap: 'balance' })}>
                      {v.q.title}
                    </p>
                    {(v.q.sub) ? (
                      <>
                      <p style={S({ margin: '6px 0 0', fontSize: '15px', lineHeight: '1.5', color: 'var(--muted)' })}>
                        {v.q.sub}
                      </p>
                      </>
                    ) : null}
                  </div>
                </div>
                {(v.q.chart) ? (
                  <>
                  <figure style={S({ margin: '0 0 22px', padding: '18px 18px 12px', background: 'var(--panel)', border: '1px solid var(--rule)', borderRadius: '22px' })}>
                    <svg viewBox="0 0 600 180" width="100%" role="img" aria-label="Sleep hours for the last 14 days. The last three readings sit below the shaded normal range." style={S({ display: 'block', overflow: 'visible', fontFamily: 'ui-sans-serif, system-ui, sans-serif' })}>
                      <rect x="0" y="40" width="560" height="56" rx="10" fill="var(--ok)" fillOpacity="0.12">
                      </rect>
                      <rect x="0" y="96" width="560" height="34" fill="var(--watch)" fillOpacity="0.12">
                      </rect>
                      <text x="10" y="58" fill="var(--ok-ink)" style={S({ fontSize: '13px', fontWeight: '600' })}>
                        Their normal
                      </text>
                      <text x="10" y="117" fill="var(--watch-ink)" style={S({ fontSize: '13px', fontWeight: '600' })}>
                        A little low
                      </text>
                      <path d="M10 66 L50 72 L90 60 L130 70 L170 64 L210 76 L250 62 L290 68 L330 74 L370 66 L410 80 L450 98 L490 106 L530 112" fill="none" stroke="var(--ink)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
                      </path>
                      <circle cx="530" cy="112" r="7" fill="var(--watch)" stroke="var(--panel)" strokeWidth="3">
                      </circle>
                      <text x="530" y="150" textAnchor="middle" fill="var(--muted)" style={S({ fontSize: '12px' })}>
                        Today
                      </text>
                      <text x="10" y="172" fill="var(--muted)" style={S({ fontSize: '12px' })}>
                        14 days ago
                      </text>
                    </svg>
                  </figure>
                  </>
                ) : null}
                <div role="radiogroup" aria-label={v.q.title} style={S({ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${v.q.min}, 1fr))`, gap: '12px' })}>
                  {(v.q.options ?? []).map((o: any, o_i: number) => (
                      <Fragment key={o_i}>
                    <button type="button" role="radio" aria-checked={o.checked} onClick={o.pick} disabled={o.locked} style={S({ position: 'relative', display: 'flex', flexDirection: o.dir, alignItems: o.align, gap: '14px', minHeight: '76px', padding: '16px 18px', textAlign: o.ta, background: o.bg, border: `2px solid ${o.border}`, borderBottomWidth: '5px', borderRadius: '20px', color: 'var(--ink)', cursor: 'pointer', transform: o.lift, transition: 'transform 160ms cubic-bezier(.34,1.56,.64,1), border-color 140ms ease, background-color 140ms ease' })} className="onboardingview-active-2">
                      {(o.crew) ? (
                        <>
                        <P.Avatar crew={o.crew} gear={o.gear} size={o.avSize} ring={o.ring} />
                        </>
                      ) : null}
                      {(o.icon) ? (
                        <>
                        <span aria-hidden="true" style={S({ display: 'grid', placeItems: 'center', flexShrink: '0', width: '48px', height: '48px', borderRadius: '14px', background: o.tileBg, color: o.tileColor })}>
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d={o.icon}>
                            </path>
                          </svg>
                        </span>
                        </>
                      ) : null}
                      {(o.swatch) ? (
                        <>
                        <span aria-hidden="true" style={S({ flexShrink: '0', width: '28px', height: '28px', borderRadius: '9px', background: o.swatch })}>
                        </span>
                        </>
                      ) : null}
                      <span style={S({ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: '0', flex: '1' })}>
                        <span style={S({ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '17px', fontWeight: '650', letterSpacing: '-0.01em' })}>
                          {o.label}
                          {(o.tag) ? (
                            <>
                            <span style={S({ padding: '2px 8px', borderRadius: '999px', background: 'var(--ink)', color: 'var(--paper)', fontSize: '11.5px', fontWeight: '600' })}>
                              {o.tag}
                            </span>
                            </>
                          ) : null}
                        </span>
                        {(o.sub) ? (
                          <>
                          <span style={S({ fontSize: '14px', lineHeight: '1.45', color: 'var(--muted)' })}>
                            {o.sub}
                          </span>
                          </>
                        ) : null}
                      </span>
                      {(o.reward) ? (
                        <>
                        <span style={S({ flexShrink: '0', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px', fontWeight: '700', color: 'var(--watch-ink)' })}>
                          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                            <circle cx="12" cy="12" r="10" fill="#f6c445">
                            </circle>
                            <circle cx="12" cy="12" r="6.6" fill="none" stroke="#b9831a" strokeWidth="1.6">
                            </circle>
                          </svg>
                          {o.reward}
                        </span>
                        </>
                      ) : null}
                      <span aria-hidden="true" style={S({ position: 'absolute', top: '10px', right: '10px', display: 'grid', placeItems: 'center', width: '24px', height: '24px', borderRadius: '999px', background: 'var(--ink)', color: 'var(--paper)', opacity: o.tickOp, transform: o.tickScale, transition: 'transform 260ms cubic-bezier(.34,1.56,.64,1), opacity 160ms ease' })}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6 9 17l-5-5">
                          </path>
                        </svg>
                      </span>
                    </button>
                      </Fragment>
                    ))}
                </div>
              </section>
              </>
            ) : null}
            {(v.isStyle) ? (
              <>
              <section style={S({ display: 'flex', flexWrap: 'wrap', gap: '28px', alignItems: 'flex-start', paddingTop: 'clamp(8px, 4vh, 36px)' })}>
                <div style={S({ flex: '1 1 260px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '28px 20px', borderRadius: '28px', background: v.previewBanner, border: '1px solid var(--rule)' })}>
                  <span style={S({ animation: 'ob-bob 3.6s ease-in-out infinite' })}>
                    <P.Avatar crew={v.me} gear={v.previewGear} size={150} ring="var(--ink)" />
                  </span>
                  <span style={S({ padding: '6px 14px', borderRadius: '999px', background: 'var(--panel)', fontSize: '14px', fontWeight: '600' })}>
                    {v.meName}
                  </span>
                </div>
                <div style={S({ flex: '1.4 1 340px' })}>
                  <h1 style={S({ margin: '0', fontSize: 'clamp(28px, 3.6vw, 40px)', lineHeight: '1.05', fontWeight: '700', letterSpacing: '-0.035em' })}>
                    Make it yours.
                  </h1>
                  <p style={S({ margin: '10px 0 0', fontSize: '16px', lineHeight: '1.55', color: 'var(--muted)' })}>
                    Pick a starter visor and suit. Frames, patches and banners unlock with coins later.
                  </p>
                  <p style={S({ margin: '26px 0 10px', fontSize: '14px', fontWeight: '600' })}>
                    Visor
                  </p>
                  <div role="radiogroup" aria-label="Visor" style={S({ display: 'flex', flexWrap: 'wrap', gap: '10px' })}>
                    {(v.visors ?? []).map((v: any, v_i: number) => (
                        <Fragment key={v_i}>
                      <button type="button" role="radio" aria-checked={v.on} aria-label={v.name} onClick={v.pick} style={S({ display: 'flex', alignItems: 'center', gap: '10px', minHeight: '52px', padding: '6px 16px 6px 8px', borderRadius: '999px', background: 'var(--panel)', border: `2px solid ${v.border}`, color: 'var(--ink)', fontSize: '14.5px', fontWeight: '600', cursor: 'pointer', transition: 'border-color 140ms ease, transform 200ms cubic-bezier(.34,1.56,.64,1)' })} className="onboardingview-active-3">
                        <span aria-hidden="true" style={S({ width: '34px', height: '34px', borderRadius: '999px', background: v.sw })}>
                        </span>
                        {v.name}
                      </button>
                        </Fragment>
                      ))}
                  </div>
                  <p style={S({ margin: '22px 0 10px', fontSize: '14px', fontWeight: '600' })}>
                    Suit
                  </p>
                  <div role="radiogroup" aria-label="Suit" style={S({ display: 'flex', flexWrap: 'wrap', gap: '10px' })}>
                    {(v.suits ?? []).map((v: any, v_i: number) => (
                        <Fragment key={v_i}>
                      <button type="button" role="radio" aria-checked={v.on} aria-label={v.name} onClick={v.pick} style={S({ display: 'flex', alignItems: 'center', gap: '10px', minHeight: '52px', padding: '6px 16px 6px 8px', borderRadius: '999px', background: 'var(--panel)', border: `2px solid ${v.border}`, color: 'var(--ink)', fontSize: '14.5px', fontWeight: '600', cursor: 'pointer', transition: 'border-color 140ms ease, transform 200ms cubic-bezier(.34,1.56,.64,1)' })} className="onboardingview-active-4">
                        <span aria-hidden="true" style={S({ width: '34px', height: '34px', borderRadius: '999px', background: v.sw, border: '1px solid var(--rule)' })}>
                        </span>
                        {v.name}
                      </button>
                        </Fragment>
                      ))}
                  </div>
                </div>
              </section>
              </>
            ) : null}
            {(v.isDone) ? (
              <>
              <section style={S({ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingTop: 'clamp(0px, 2vh, 40px)' })}>
                <div style={S({ position: 'relative', display: 'grid', placeItems: 'center', width: 'min(260px, 30vh)', height: 'min(260px, 30vh)' })}>
                  <span aria-hidden="true" style={S({ position: 'absolute', inset: '10px', borderRadius: '999px', background: 'radial-gradient(circle, rgba(246,196,69,.45), transparent 68%)', animation: 'ob-glow 2.4s ease-in-out infinite' })}>
                  </span>
                  {(v.burst ?? []).map((b: any, b_i: number) => (
                      <Fragment key={b_i}>
                    <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true" style={S({ position: 'absolute', left: 'calc(50% - 13px)', top: 'calc(50% - 13px)', '--dx': b.dx, '--dy': b.dy, '--rot': b.rot, animation: `ob-coin 1.4s ${b.delay} cubic-bezier(.22,1,.36,1) both` })}>
                      <circle cx="12" cy="12" r="10" fill="#f6c445">
                      </circle>
                      <circle cx="12" cy="12" r="6.6" fill="none" stroke="#b9831a" strokeWidth="1.6">
                      </circle>
                      <path d="M12 8.6v6.8" stroke="#b9831a" strokeWidth="1.6" strokeLinecap="round">
                      </path>
                    </svg>
                      </Fragment>
                    ))}
                  <span style={S({ animation: 'ob-pop 700ms 200ms cubic-bezier(.34,1.56,.64,1) both' })}>
                    <P.Avatar crew={v.me} gear={v.previewGear} size={v.heroAv} ring="var(--ink)" level={1} />
                  </span>
                </div>
                <p style={S({ margin: '8px 0 0', fontSize: '15px', fontWeight: '600', color: 'var(--muted)' })}>
                  Setup complete
                </p>
                <h1 style={S({ margin: '6px 0 0', display: 'flex', alignItems: 'center', gap: '12px', fontSize: 'clamp(44px, min(8vw, 9vh), 88px)', lineHeight: '1', fontWeight: '750', letterSpacing: '-0.05em' })}>
                  <svg width="0.8em" height="0.8em" viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" fill="#f6c445">
                    </circle>
                    <circle cx="12" cy="12" r="6.6" fill="none" stroke="#b9831a" strokeWidth="1.6">
                    </circle>
                    <path d="M12 8.6v6.8" stroke="#b9831a" strokeWidth="1.6" strokeLinecap="round">
                    </path>
                  </svg>
                  +{v.shown}
                </h1>
                <div style={S({ marginTop: '18px', display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 150px))', gap: '10px' })}>
                  {(v.doneStats ?? []).map((d: any, d_i: number) => (
                      <Fragment key={d_i}>
                    <div style={S({ padding: '14px 10px', borderRadius: '18px', background: 'var(--panel)', border: '2px solid var(--rule)', borderBottomWidth: '4px', animation: `ob-pop 500ms ${d.delay} cubic-bezier(.34,1.56,.64,1) both` })}>
                      <p style={S({ margin: '0', fontSize: '12.5px', color: 'var(--muted)' })}>
                        {d.k}
                      </p>
                      <p style={S({ margin: '4px 0 0', fontSize: '22px', fontWeight: '700', letterSpacing: '-0.02em' })}>
                        {d.v}
                      </p>
                    </div>
                      </Fragment>
                    ))}
                </div>
              </section>
              </>
            ) : null}
          </div>
        </main>
        <footer style={S({ position: 'fixed', left: '0', right: '0', bottom: '0', zIndex: '6', background: v.sheetBg, borderTop: `2px solid ${v.sheetBorder}`, transition: 'background-color 240ms ease, border-color 240ms ease' })}>
          <div style={S({ maxWidth: '980px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '14px 24px', padding: '20px' })}>
            <div aria-live="polite" style={S({ flex: '1 1 320px', minHeight: '52px', display: 'flex', alignItems: 'center', gap: '14px' })}>
              {(v.feedback) ? (
                <>
                <span aria-hidden="true" style={S({ display: 'grid', placeItems: 'center', flexShrink: '0', width: '52px', height: '52px', borderRadius: '999px', background: 'var(--panel)', color: v.fbInk, animation: 'ob-pop 420ms cubic-bezier(.34,1.56,.64,1) both' })}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d={v.fbIcon}>
                    </path>
                  </svg>
                </span>
                <span style={S({ display: 'flex', flexDirection: 'column', gap: '2px' })}>
                  <span style={S({ fontSize: '20px', fontWeight: '700', color: v.fbInk })}>
                    {v.fbTitle}
                  </span>
                  <span style={S({ fontSize: '14.5px', lineHeight: '1.45', color: v.fbInk })}>
                    {v.fbBody}
                  </span>
                </span>
                </>
              ) : null}
              {(v.showSkip) ? (
                <>
                <a href="Body%20Map.dc.html" style={S({ whiteSpace: 'nowrap', flexShrink: '0', display: 'inline-flex', alignItems: 'center', minHeight: '52px', padding: '0 20px', borderRadius: '16px', border: '2px solid var(--rule)', borderBottomWidth: '4px', color: 'var(--muted)', textDecoration: 'none', fontSize: '15px', fontWeight: '700', letterSpacing: '.02em' })}>
                  Skip for now
                </a>
                </>
              ) : null}
            </div>
            <button type="button" onClick={v.primary} disabled={v.primaryDisabled} style={S({ minWidth: '200px', minHeight: '56px', padding: '0 28px', borderRadius: '16px', background: v.btnBg, color: v.btnColor, border: '0', boxShadow: `0 5px 0 ${v.btnShadow}`, fontSize: '16px', fontWeight: '750', letterSpacing: '.02em', cursor: v.btnCursor, animation: v.btnAnim, transition: 'transform 90ms ease, box-shadow 90ms ease, background-color 160ms ease' })} className="onboardingview-active-5">
              {v.primaryLabel}
            </button>
          </div>
        </footer>
      </div>
    </>
  )
}
