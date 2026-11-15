// @ts-nocheck
/* eslint-disable */
// GENERATED from the UI overhaul prototype by dc2jsx.py. Styles are the prototype's, verbatim.
// Edit the view model that feeds this, not this markup, unless you are re-porting the prototype.
import { Fragment } from 'react'
import { AlertsPanel } from './Alerts'
import { FloatingCrew } from './FloatingCrew'
import { BannerScene } from './MissionScene'
import * as P from './parts'
import { S } from './parts'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function MedicalView({ v }: { v: any }) {
  return (
    <>
      <div data-chm-root="1" style={S({ '--ink': '#14181f', '--ink-soft': '#2b323d', '--paper': '#f3f1ea', '--paper-deep': '#e8e4d8', '--panel': '#fbfaf6', '--panel-2': '#f6f4ec', '--rule': '#d9d4c4', '--rule-strong': '#a49c88', '--muted': '#5b6270', '--accent': '#0b3d91', '--accent-wash': '#e4e9f3', '--ok': '#2f7d4f', '--ok-ink': '#1b5b33', '--watch': '#b7791f', '--watch-ink': '#7a4f00', '--act': '#b3261e', '--act-ink': '#8c1d18', '--nodata': '#8a8f98', '--nodata-ink': '#5b6270', '--on-accent': '#ffffff', '--star-o': '0', '--glow': 'none', minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--paper)', color: 'var(--ink)', fontFamily: 'ui-sans-serif, system-ui, -apple-system, \'Segoe UI\', Roboto, sans-serif', fontVariantNumeric: 'tabular-nums' })}>
        <P.TopBar current="Medical view" />
        <main id="main" tabIndex={-1} style={S({ flex: '1', width: '100%', maxWidth: '1440px', margin: '0 auto', padding: '28px clamp(16px, 3vw, 32px) 72px', boxSizing: 'border-box', outline: 'none', display: 'flex', flexDirection: 'column', gap: '24px' })}>
          <AlertsPanel />
          <div style={S({ display: 'flex', flexWrap: 'wrap', alignItems: 'stretch', gap: '20px' })}>
            <div style={S({ flex: '2 1 520px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '14px', padding: '8px 0', animation: 'cr-rise 520ms cubic-bezier(.22,1,.36,1) both' })}>
              <p style={S({ margin: '0', fontSize: '14px', color: 'var(--muted)' })}>
                Crew lobby · medical officer view
              </p>
              <h1 style={S({ margin: '0', fontSize: 'clamp(40px, 6vw, 76px)', lineHeight: '.92', fontWeight: '750', letterSpacing: '-0.05em' })}>
                Everyone,
                <br />
                at once.
              </h1>
              <p style={S({ margin: '0', maxWidth: '58ch', fontSize: '16px', lineHeight: '1.55', color: 'var(--ink-soft)', textWrap: 'pretty' })}>
                The people with something outside their own baseline come first. Gray is never a verdict: it means no reading has passed the quality check yet. Pick anyone to open their console.
              </p>
              <div role="group" aria-label="Filter" style={S({ alignSelf: 'flex-start', display: 'flex', gap: '4px', padding: '4px', borderRadius: '999px', background: 'var(--paper-deep)' })}>
                {(v.filters ?? []).map((f: any, f_i: number) => (
                    <Fragment key={f_i}>
                  <button type="button" aria-pressed={f.on} onClick={f.pick} style={S({ minHeight: '42px', padding: '0 18px', borderRadius: '999px', border: '0', background: f.bg, color: f.color, boxShadow: f.shadow, fontSize: '14px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'background-color 200ms ease' })}>
                    {f.label}
                  </button>
                    </Fragment>
                  ))}
              </div>
            </div>
            <section aria-label="Crew weekly goal" style={S({ flex: '1 1 320px', display: 'flex', alignItems: 'center', gap: '22px', padding: '24px', borderRadius: '28px', background: '#14181f', color: '#f3f1ea', animation: 'cr-rise 520ms 80ms cubic-bezier(.22,1,.36,1) both' })}>
              <span style={S({ position: 'relative', display: 'grid', placeItems: 'center', flexShrink: '0', width: '120px', height: '120px' })}>
                <svg width="120" height="120" viewBox="0 0 120 120" aria-hidden="true" style={S({ position: 'absolute', inset: '0', transform: 'rotate(-90deg)' })}>
                  <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(243,241,234,.15)" strokeWidth="12">
                  </circle>
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#f6c445" strokeWidth="12" strokeLinecap="round" strokeDasharray={v.goalDash} style={S({ transition: 'stroke-dasharray 1s cubic-bezier(.22,1,.36,1)' })}>
                  </circle>
                </svg>
                <span style={S({ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.03em' })}>
                  {v.goalPct}
                </span>
              </span>
              <div style={S({ minWidth: '0' })}>
                <p style={S({ margin: '0', fontSize: '13.5px', opacity: '.72' })}>
                  Crew weekly goal
                </p>
                <p style={S({ margin: '4px 0 0', fontSize: '26px', fontWeight: '750', letterSpacing: '-0.03em', whiteSpace: 'nowrap' })}>
                  {v.goalWeek}
                  <span style={S({ fontSize: '15px', fontWeight: '500', opacity: '.7' })}>
                    / {v.goalTarget}
                  </span>
                </p>
                <p style={S({ margin: '8px 0 0', fontSize: '13.5px', lineHeight: '1.45', opacity: '.8' })}>
                  {v.systemsText}
                </p>
                <p style={S({ margin: '10px 0 0', display: 'flex', flexWrap: 'wrap', gap: '4px 14px', fontSize: '13.5px', whiteSpace: 'nowrap' })}>
                  <span>
                    <span style={S({ fontWeight: '750' })}>
                      {v.nCrew}
                    </span>
                    crew
                  </span>
                  <span>
                    <span style={S({ fontWeight: '750', color: '#f6c445' })}>
                      {v.nAttn}
                    </span>
                    outside baseline
                  </span>
                </p>
              </div>
            </section>
          </div>
          <ul style={S({ listStyle: 'none', margin: '0', padding: '0', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: '20px' })}>
            {(v.views ?? []).map((v: any, v_i: number) => (
                <Fragment key={v_i}>
              <li style={S({ display: 'flex', animation: `cr-rise 560ms ${v.delay} cubic-bezier(.22,1,.36,1) both` })}>
                <article onMouseEnter={v.enter} onMouseLeave={v.leave} style={S({ position: 'relative', display: 'flex', flexDirection: 'column', width: '100%', borderRadius: '28px', background: 'var(--panel)', border: `2px solid ${v.border}`, overflow: 'hidden', transform: v.lift, boxShadow: v.shadow, transition: 'transform 320ms cubic-bezier(.34,1.56,.64,1), box-shadow 300ms ease, border-color 200ms ease' })}>
                  <div style={S({ position: 'relative', overflow: 'hidden', height: '104px', background: v.banner })}>
                    <BannerScene banner={v.gear?.banner} />
                    <FloatingCrew crew={v.crew} gear={v.gear} size={46} duration={13} />
                    <div style={S({ position: 'absolute', top: '12px', left: '12px', right: '12px', display: 'flex', justifyContent: 'space-between', gap: '6px' })}>
                      <span style={S({ padding: '4px 10px', borderRadius: '999px', background: v.chipBg, color: v.chipInk, fontSize: '12.5px', fontWeight: '700', whiteSpace: 'nowrap' })}>
                        {v.word}
                      </span>
                      <span style={S({ display: 'flex', gap: '6px' })}>
                        <span style={S({ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 9px', borderRadius: '999px', background: 'rgba(11,15,22,.78)', color: '#fff', fontSize: '12.5px', fontWeight: '700' })}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="#ff9d4d" stroke="#ff9d4d" strokeWidth="1" strokeLinejoin="round">
                            <path d={v.flame}>
                            </path>
                          </svg>
                          {v.streak}
                        </span>
                        <span style={S({ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 9px', borderRadius: '999px', background: 'rgba(11,15,22,.78)', color: '#fff', fontSize: '12.5px', fontWeight: '700' })}>
                          <svg width="13" height="13" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" fill="#f6c445">
                            </circle>
                            <circle cx="12" cy="12" r="6.6" fill="none" stroke="#b9831a" strokeWidth="1.6">
                            </circle>
                          </svg>
                          {v.coins}
                        </span>
                      </span>
                    </div>
                  </div>
                  <div style={S({ display: 'flex', alignItems: 'flex-end', gap: '12px', padding: '0 18px', marginTop: '-44px', position: 'relative' })}>
                    <span style={S({ animation: 'cr-float 4s ease-in-out infinite', animationDelay: v.delay })}>
                      <P.Avatar crew={v.crew} gear={v.gear} size={84} ring="var(--panel)" level={v.lvl} />
                    </span>
                    <div style={S({ minWidth: '0', flex: '1', paddingBottom: '6px' })}>
                      <p style={S({ margin: '0', fontSize: '20px', fontWeight: '750', letterSpacing: '-0.025em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' })}>
                        {v.name}
                      </p>
                      <p style={S({ margin: '2px 0 0', fontSize: '13px', color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' })}>
                        {v.rank} · {v.crew.role}
                      </p>
                    </div>
                  </div>
                  <div style={S({ display: 'flex', gap: '14px', alignItems: 'stretch', padding: '16px 18px 0' })}>
                    <div style={S({ flex: '0 0 auto', display: 'grid', placeItems: 'center', width: '92px', padding: '10px 0', borderRadius: '18px', background: '#0f141c' })}>
                      <P.BodyFigure statuses={v.statuses} interactive={false} markers={true} height="150px" uid={v.uid} />
                    </div>
                    <div style={S({ flex: '1', minWidth: '0', display: 'flex', flexDirection: 'column', gap: '6px' })}>
                      {(v.regions ?? []).map((r: any, r_i: number) => (
                          <Fragment key={r_i}>
                        <div style={S({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', fontSize: '13px' })}>
                          <span style={S({ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--ink-soft)' })}>
                            {r.label}
                          </span>
                          <span style={S({ flexShrink: '0', whiteSpace: 'nowrap', padding: '2px 8px', borderRadius: '999px', background: r.bg, color: r.ink, fontSize: '11.5px', fontWeight: '700' })}>
                            {r.word}
                          </span>
                        </div>
                          </Fragment>
                        ))}
                    </div>
                  </div>
                  <div style={S({ padding: '16px 18px 18px', marginTop: 'auto' })}>
                    <div style={S({ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: 'var(--muted)' })}>
                      <span>
                        Measured
                      </span>
                      <span style={S({ fontWeight: '600', color: 'var(--ink)' })}>
                        {v.measured}
                      </span>
                    </div>
                    <div aria-hidden="true" style={S({ marginTop: '6px', display: 'grid', gridTemplateColumns: 'repeat(19, 1fr)', gap: '2px' })}>
                      {(v.cells ?? []).map((c: any, c_i: number) => (
                          <Fragment key={c_i}>
                        <span style={S({ height: '6px', borderRadius: '3px', background: c })}>
                        </span>
                          </Fragment>
                        ))}
                    </div>
                    <a href="Body%20Map.dc.html" onClick={v.open} style={S({ marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', minHeight: '48px', borderRadius: '14px', background: v.btnBg, color: v.btnInk, textDecoration: 'none', fontSize: '14.5px', fontWeight: '700', boxShadow: `0 4px 0 ${v.btnShadow}`, transition: 'transform 90ms ease, box-shadow 90ms ease' })} className="medicalview-active-1">
                      {v.btn}
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={S({ transform: v.arrowX, transition: 'transform 240ms cubic-bezier(.34,1.56,.64,1)' })}>
                        <path d="M5 12h14 M12 5l7 7-7 7">
                        </path>
                      </svg>
                    </a>
                  </div>
                </article>
              </li>
                </Fragment>
              ))}
          </ul>
          {(v.emptyFilter) ? (
            <>
            <div style={S({ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '56px 20px', borderRadius: '28px', border: '2px dashed var(--rule-strong)', animation: 'cr-rise 420ms cubic-bezier(.22,1,.36,1) both' })}>
              <span aria-hidden="true" style={S({ display: 'grid', placeItems: 'center', width: '64px', height: '64px', borderRadius: '20px', background: 'color-mix(in srgb, var(--ok) 16%, transparent)', color: 'var(--ok-ink)', animation: 'cr-float 3s ease-in-out infinite' })}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5">
                  </path>
                </svg>
              </span>
              <p style={S({ margin: '16px 0 0', fontSize: '22px', fontWeight: '700', letterSpacing: '-0.02em' })}>
                Nobody is outside baseline
              </p>
              <p style={S({ margin: '6px 0 0', maxWidth: '40ch', fontSize: '15px', lineHeight: '1.55', color: 'var(--muted)' })}>
                Every crew member with good data is inside their own normal.
              </p>
            </div>
            </>
          ) : null}
        </main>
        <P.SiteFooter dock={true} />
        <P.CrewDock current="Medical view" />
      </div>
    </>
  )
}
