// @ts-nocheck
/* eslint-disable */
// GENERATED from the UI overhaul prototype by dc2jsx.py. Styles are the prototype's, verbatim.
// Edit the view model that feeds this, not this markup, unless you are re-porting the prototype.
import { Fragment } from 'react'
import { FloatingCrew } from './FloatingCrew'
import { BannerScene } from './MissionScene'
import { AlertBanner } from './Alerts'
import { AskOrbit } from './AskOrbit'
import * as P from './parts'
import { S } from './parts'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function TopBarView({ v }: { v: any }) {
  return (
    <>
      <header ref={v.rootRef} style={S({ position: 'sticky', top: '0', zIndex: '30', padding: '12px clamp(10px, 2.5vw, 24px) 0', fontFamily: 'ui-sans-serif, system-ui, -apple-system, \'Segoe UI\', Roboto, sans-serif', color: 'var(--ink)', pointerEvents: 'none' })}>
        <a href="#main" style={S({ position: 'absolute', left: '-9999px', top: '14px', padding: '10px 16px', borderRadius: '999px', background: 'var(--ink)', color: 'var(--paper)', fontSize: '14px', zIndex: '60', pointerEvents: 'auto' })} className="topbarview-focus-1">
          Skip to content
        </a>
        <div style={S({ pointerEvents: 'auto', maxWidth: '1440px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', padding: '6px', paddingLeft: '8px', borderRadius: '28px', background: 'color-mix(in srgb, var(--panel) 84%, transparent)', backdropFilter: 'blur(18px) saturate(1.4)', WebkitBackdropFilter: 'blur(18px) saturate(1.4)', border: '1px solid var(--rule)', boxShadow: '0 12px 34px -22px rgba(20,24,31,.45)' })}>
          <a href="Landing.dc.html" aria-label="Daily Orbit, home" style={S({ display: 'flex', alignItems: 'center', gap: '10px', minHeight: '44px', paddingRight: '8px', textDecoration: 'none', color: 'var(--ink)', whiteSpace: 'nowrap' })}>
            <span aria-hidden="true" style={S({ position: 'relative', display: 'grid', placeItems: 'center', width: '36px', height: '36px', borderRadius: '999px', background: 'var(--ink)', color: 'var(--paper)' })}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(-24 12 12)">
                </ellipse>
                <circle cx="12" cy="12" r="3.2" fill="currentColor" stroke="none">
                </circle>
              </svg>
            </span>
            <span style={S({ fontSize: '16px', fontWeight: '650', letterSpacing: '-0.025em' })}>
              Daily Orbit
            </span>
          </a>
          <nav aria-label="Main navigation" style={S({ order: v.navOrder, flex: v.navFlex, display: 'flex', justifyContent: 'flex-start', minWidth: '0', marginLeft: '4px' })}>
            <div style={S({ display: 'flex', alignItems: 'center', gap: '2px', padding: '4px', borderRadius: '999px', background: 'var(--paper-deep)', overflowX: 'auto', maxWidth: '100%', scrollbarWidth: 'none' })} data-noscroll="1">
              {(v.links ?? []).map((l: any, l_i: number) => (
                  <Fragment key={l_i}>
                <a href={l.href} aria-current={l.current} style={S({ display: 'inline-flex', alignItems: 'center', gap: '7px', minHeight: '40px', padding: '0 12px', borderRadius: '999px', background: l.bg, color: l.color, boxShadow: l.shadow, textDecoration: 'none', fontSize: '14px', fontWeight: l.weight, whiteSpace: 'nowrap', transition: 'background-color 200ms ease, color 200ms ease, box-shadow 200ms ease' })} className="topbarview-hover-2">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d={l.icon}>
                    </path>
                  </svg>
                  {l.label}
                </a>
                  </Fragment>
                ))}
              <div style={S({ position: 'relative' })}>
                <button type="button" onClick={v.toggleMore} aria-expanded={v.moreOpen} aria-haspopup="true" style={S({ display: 'inline-flex', alignItems: 'center', gap: '6px', minHeight: '40px', padding: '0 12px', borderRadius: '999px', background: v.moreBg, border: '0', color: 'var(--muted)', fontSize: '14px', cursor: 'pointer', whiteSpace: 'nowrap' })} className="topbarview-hover-3">
                  More
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={S({ transform: v.moreRot, transition: 'transform 200ms ease' })}>
                    <path d="M6 9l6 6 6-6">
                    </path>
                  </svg>
                </button>
              </div>
            </div>
          </nav>
          <div style={S({ order: '2', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'nowrap' })}>
            <div style={S({ position: 'relative' })}>
              <button type="button" onClick={v.toggleEnv} aria-expanded={v.envOpen} aria-haspopup="true" aria-label="Mission environment and comm delay" style={S({ display: 'flex', alignItems: 'center', gap: '8px', minHeight: '44px', padding: '0 14px', borderRadius: '999px', background: 'transparent', border: '1px solid var(--rule)', color: 'var(--ink)', cursor: 'pointer', whiteSpace: 'nowrap' })} className="topbarview-hover-4">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                  <circle cx="12" cy="12" r="9">
                  </circle>
                  <path d="M3 12h18 M12 3a14 14 0 0 1 0 18 M12 3a14 14 0 0 0 0 18">
                  </path>
                </svg>
                <span style={S({ fontSize: '14px', fontWeight: '600' })}>
                  {v.envShort}
                </span>
                <span style={S({ fontSize: '13px', color: 'var(--muted)' })}>
                  {v.delayText}
                </span>
              </button>
            </div>
            <a href="Rewards.dc.html" aria-label={v.walletAria} style={S({ position: 'relative', display: 'flex', alignItems: 'center', minHeight: '44px', borderRadius: '999px', background: '#14181f', color: '#f3f1ea', border: '1px solid rgba(243,241,234,.14)', textDecoration: 'none', whiteSpace: 'nowrap', overflow: 'visible' })} className="topbarview-hover-5">
              <span style={S({ display: 'flex', alignItems: 'center', gap: '5px', padding: '0 10px 0 13px', fontSize: '14px', fontWeight: '650' })}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="#ff9d4d" stroke="#ff9d4d" strokeWidth="1.2" strokeLinejoin="round">
                  <path d={v.flameIcon}>
                  </path>
                </svg>
                {v.streak}
              </span>
              <span aria-hidden="true" style={S({ width: '1px', height: '20px', background: 'rgba(243,241,234,.24)' })}>
              </span>
              <span key={v.bumpKey} style={S({ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 14px 0 10px', fontSize: '14px', fontWeight: '650', animation: v.bumpAnim })}>
                <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" fill="#f6c445">
                  </circle>
                  <circle cx="12" cy="12" r="6.6" fill="none" stroke="#b9831a" strokeWidth="1.6">
                  </circle>
                  <path d="M12 8.6v6.8" stroke="#b9831a" strokeWidth="1.6" strokeLinecap="round">
                  </path>
                </svg>
                {v.coins}
              </span>
              {(v.floatText) ? (
                <>
                <span key={v.bumpKey} aria-hidden="true" style={S({ position: 'absolute', left: '70%', top: '-4px', padding: '2px 8px', borderRadius: '999px', background: '#f6c445', color: '#3b2a00', fontSize: '12.5px', fontWeight: '700', pointerEvents: 'none', animation: 'chm-float 1.4s cubic-bezier(.22,1,.36,1) forwards' })}>
                  {v.floatText}
                </span>
                </>
              ) : null}
            </a>
            <div style={S({ position: 'relative' })}>
              <button type="button" onClick={v.toggleMe} aria-expanded={v.meOpen} aria-haspopup="true" aria-label={v.meAria} style={S({ display: 'grid', placeItems: 'center', width: '48px', height: '48px', padding: '0', borderRadius: '999px', background: 'transparent', border: '0', cursor: 'pointer' })}>
                <P.Avatar crew={v.crew} gear={v.gear} size={42} ring={v.ring} level={v.lvl} />
              </button>
            </div>
          </div>
        </div>
        <div style={S({ position: 'relative', maxWidth: '1440px', margin: '0 auto', pointerEvents: 'auto' })}>
          {(v.moreOpen) ? (
            <>
            <div role="menu" style={S({ position: 'absolute', top: '8px', left: '160px', zIndex: '40', width: 'min(560px, calc(100vw - 24px))', padding: '8px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '4px', background: 'var(--panel)', border: '1px solid var(--rule)', borderRadius: '22px', boxShadow: '0 24px 50px -24px rgba(20,24,31,.4)', animation: 'chm-drop 220ms cubic-bezier(.22,1,.36,1) both' })}>
              {(v.more ?? []).map((it: any, it_i: number) => (
                  <Fragment key={it_i}>
                <a role="menuitem" href={it.href} aria-disabled={it.disabled} style={S({ display: 'grid', gridTemplateColumns: '40px 1fr', alignItems: 'center', gap: '12px', minHeight: '60px', padding: '8px 10px', borderRadius: '16px', textDecoration: 'none', color: 'var(--ink)', opacity: it.op, cursor: it.cursor })} className="topbarview-hover-6">
                  <span aria-hidden="true" style={S({ display: 'grid', placeItems: 'center', width: '40px', height: '40px', borderRadius: '12px', background: it.tileBg, color: it.tileColor })}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                      <path d={it.path}>
                      </path>
                    </svg>
                  </span>
                  <span style={S({ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '0' })}>
                    <span style={S({ fontSize: '14.5px', fontWeight: '600' })}>
                      {it.label}
                    </span>
                    <span style={S({ fontSize: '12.5px', lineHeight: '1.35', color: 'var(--muted)' })}>
                      {it.desc}
                    </span>
                  </span>
                </a>
                  </Fragment>
                ))}
            </div>
            </>
          ) : null}
          {(v.envOpen) ? (
            <>
            <div style={S({ position: 'absolute', top: '8px', right: '110px', zIndex: '40', width: 'min(320px, calc(100vw - 24px))', padding: '8px', background: 'var(--panel)', border: '1px solid var(--rule)', borderRadius: '22px', boxShadow: '0 24px 50px -24px rgba(20,24,31,.4)', animation: 'chm-drop 220ms cubic-bezier(.22,1,.36,1) both' })}>
              <p style={S({ margin: '6px 10px 8px', fontSize: '13px', color: 'var(--muted)' })}>
                Mission environment
              </p>
              <div role="radiogroup" aria-label="Mission environment">
                {(v.envItems ?? []).map((e: any, e_i: number) => (
                    <Fragment key={e_i}>
                  <button type="button" role="radio" aria-checked={e.active} onClick={e.pick} style={S({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', width: '100%', minHeight: '52px', padding: '0 12px', borderRadius: '14px', background: e.bg, border: '0', color: 'var(--ink)', cursor: 'pointer', fontSize: '14.5px', textAlign: 'left' })} className="topbarview-hover-7">
                    <span style={S({ display: 'flex', flexDirection: 'column' })}>
                      <span style={S({ fontWeight: '600' })}>
                        {e.label}
                      </span>
                      <span style={S({ fontSize: '12.5px', color: 'var(--muted)' })}>
                        One-way delay {e.delayText}
                      </span>
                    </span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={S({ opacity: e.checkOp })}>
                      <path d="M20 6 9 17l-5-5">
                      </path>
                    </svg>
                  </button>
                    </Fragment>
                  ))}
              </div>
              {(v.adjustable) ? (
                <>
                <div style={S({ margin: '6px 4px 0', padding: '12px 10px 4px', borderTop: '1px solid var(--rule)' })}>
                  <div style={S({ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' })}>
                    <label htmlFor="chm-delay" style={S({ fontSize: '13px', color: 'var(--muted)' })}>
                      Mars distance today
                    </label>
                    <span style={S({ fontSize: '15px', fontWeight: '650' })}>
                      {v.delayText}
                    </span>
                  </div>
                  <input id="chm-delay" data-chm-range="1" type="range" min={v.dMin} max={v.dMax} step="30" value={v.delay} onChange={v.setDelay} style={S({ '--pct': v.dPct })} />
                  <div style={S({ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--muted)' })}>
                    <span>
                      Closest · {v.dMinText}
                    </span>
                    <span>
                      Farthest · {v.dMaxText}
                    </span>
                  </div>
                </div>
                </>
              ) : null}
            </div>
            </>
          ) : null}
          {(v.meOpen) ? (
            <>
            <div style={S({ position: 'absolute', top: '8px', right: '0', zIndex: '40', width: 'min(340px, calc(100vw - 24px))', background: 'var(--panel)', border: '1px solid var(--rule)', borderRadius: '24px', boxShadow: '0 24px 50px -24px rgba(20,24,31,.4)', overflow: 'hidden', animation: 'chm-drop 220ms cubic-bezier(.22,1,.36,1) both' })}>
              <div style={S({ position: 'relative', overflow: 'hidden', height: '72px', background: v.bannerBg })}>
                <BannerScene banner={v.gear?.banner} />
                <FloatingCrew crew={v.crew} gear={v.gear} size={38} duration={11} />
              </div>
              <div style={S({ padding: '0 18px 16px', marginTop: '-34px', position: 'relative' })}>
                <P.Avatar crew={v.crew} gear={v.gear} size={68} ring="var(--panel)" />
                <p style={S({ margin: '10px 0 0', fontSize: '18px', fontWeight: '650', letterSpacing: '-0.02em' })}>
                  {v.crewName}
                </p>
                <p style={S({ margin: '2px 0 0', fontSize: '13.5px', color: 'var(--muted)' })}>
                  Level {v.lvl} · {v.rank} · {v.crewRole}
                </p>
                <div style={S({ marginTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: 'var(--muted)' })}>
                  <span>
                    {v.xpText}
                  </span>
                  <span>
                    Level {v.nextLvl}
                  </span>
                </div>
                <div role="progressbar" aria-label="Level progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow={v.xpPctNum} style={S({ marginTop: '6px', height: '8px', borderRadius: '999px', background: 'var(--paper-deep)', overflow: 'hidden' })}>
                  <span style={S({ display: 'block', height: '100%', width: v.xpPct, borderRadius: '999px', background: 'var(--ink)' })}>
                  </span>
                </div>
              </div>
              <div style={S({ padding: '10px 10px 4px', borderTop: '1px solid var(--rule)' })}>
                <p style={S({ margin: '2px 8px 6px', fontSize: '13px', color: 'var(--muted)' })}>
                  Acting as
                </p>
                <div role="radiogroup" aria-label="Crew" style={S({ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' })}>
                  {(v.crewItems ?? []).map((c: any, c_i: number) => (
                      <Fragment key={c_i}>
                    <button type="button" role="radio" aria-checked={c.active} aria-label={c.crew.name} onClick={c.pick} style={S({ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '10px 4px', borderRadius: '16px', background: c.bg, border: `1px solid ${c.border}`, cursor: 'pointer', color: 'var(--ink)' })} className="topbarview-hover-8">
                      <P.Avatar crew={c.crew} gear={c.gear} size={40} ring={c.ring} />
                      <span style={S({ fontSize: '12px', fontWeight: '600' })}>
                        {c.crew.code}
                      </span>
                    </button>
                      </Fragment>
                    ))}
                </div>
              </div>
              <div style={S({ padding: '6px 10px 10px' })}>
                <a href="Rewards.dc.html" style={S({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: '48px', padding: '0 12px', borderRadius: '14px', color: 'var(--ink)', textDecoration: 'none', fontSize: '14.5px', fontWeight: '500' })} className="topbarview-hover-9">
                  <span>
                    Rewards and locker
                  </span>
                  <span style={S({ fontSize: '13px', color: 'var(--muted)' })}>
                    {v.coins} coins
                  </span>
                </a>
                <a href="Onboarding.dc.html" style={S({ display: 'flex', alignItems: 'center', minHeight: '48px', padding: '0 12px', borderRadius: '14px', color: 'var(--ink)', textDecoration: 'none', fontSize: '14.5px', fontWeight: '500' })} className="topbarview-hover-10">
                  Replay the setup
                </a>
                <button type="button" role="switch" aria-checked={v.isDeck} onClick={v.toggleTheme} style={S({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', minHeight: '48px', padding: '0 12px', borderRadius: '14px', background: 'transparent', border: '0', color: 'var(--ink)', fontSize: '14.5px', fontWeight: '500', cursor: 'pointer' })} className="topbarview-hover-11">
                  Flight deck theme
                  <span aria-hidden="true" style={S({ position: 'relative', width: '44px', height: '26px', borderRadius: '999px', background: v.swBg, transition: 'background-color 200ms ease' })}>
                    <span style={S({ position: 'absolute', top: '3px', left: '3px', width: '20px', height: '20px', borderRadius: '999px', background: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,.3)', transform: v.swX, transition: 'transform 260ms cubic-bezier(.34,1.56,.64,1)' })}>
                    </span>
                  </span>
                </button>
              </div>
            </div>
            </>
          ) : null}
        </div>
        <AlertBanner />
        <AskOrbit />
      </header>
    </>
  )
}
