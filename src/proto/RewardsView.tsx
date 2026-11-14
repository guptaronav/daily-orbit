// @ts-nocheck
/* eslint-disable */
// GENERATED from the UI overhaul prototype by dc2jsx.py. Styles are the prototype's, verbatim.
// Edit the view model that feeds this, not this markup, unless you are re-porting the prototype.
import { Fragment } from 'react'
import { FloatingCrew } from './FloatingCrew'
import * as P from './parts'
import { S } from './parts'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function RewardsView({ v }: { v: any }) {
  return (
    <>
      <div data-chm-root="1" style={S({ '--ink': '#14181f', '--ink-soft': '#2b323d', '--paper': '#f3f1ea', '--paper-deep': '#e8e4d8', '--panel': '#fbfaf6', '--panel-2': '#f6f4ec', '--rule': '#d9d4c4', '--rule-strong': '#a49c88', '--muted': '#5b6270', '--accent': '#0b3d91', '--accent-wash': '#e4e9f3', '--ok': '#2f7d4f', '--ok-ink': '#1b5b33', '--watch': '#b7791f', '--watch-ink': '#7a4f00', '--act': '#b3261e', '--act-ink': '#8c1d18', '--nodata': '#8a8f98', '--nodata-ink': '#5b6270', '--on-accent': '#ffffff', '--star-o': '0', '--glow': 'none', minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--paper)', color: 'var(--ink)', fontFamily: 'ui-sans-serif, system-ui, -apple-system, \'Segoe UI\', Roboto, sans-serif', fontVariantNumeric: 'tabular-nums' })}>
        <P.TopBar current="Rewards" />
        <main id="main" tabIndex={-1} style={S({ flex: '1', width: '100%', maxWidth: '1440px', margin: '0 auto', padding: '24px clamp(16px, 3vw, 32px) 72px', boxSizing: 'border-box', outline: 'none', display: 'flex', flexDirection: 'column', gap: '20px' })}>
          <section data-reveal="1" aria-label="Profile" style={S({ position: 'relative', borderRadius: '32px', overflow: 'hidden', background: 'var(--panel)', border: '1px solid var(--rule)', animation: 'rw-rise 520ms cubic-bezier(.22,1,.36,1) both' })}>
            <div style={S({ position: 'relative', overflow: 'hidden', height: 'clamp(130px, 18vw, 200px)', background: v.bannerBg, transition: 'background 400ms ease' })}>
              <FloatingCrew crew={v.crew} gear={v.gear} size={46} duration={18} />
            </div>
            <div style={S({ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '20px 32px', padding: '0 clamp(20px, 3vw, 36px) 28px', marginTop: '-64px' })}>
              <div style={S({ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: '20px' })}>
                <span key={v.gearKey} style={S({ animation: 'rw-pop 520ms cubic-bezier(.34,1.56,.64,1) both' })}>
                  <P.Avatar crew={v.crew} gear={v.gear} size={136} ring="var(--panel)" level={v.lvl} />
                </span>
                <div style={S({ paddingTop: '76px', minWidth: '0' })}>
                  <p style={S({ margin: '0', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' })}>
                    <span style={S({ whiteSpace: 'nowrap', padding: '4px 11px', borderRadius: '999px', background: 'var(--ink)', color: 'var(--paper)', fontSize: '12.5px', fontWeight: '650' })}>
                      Level {v.lvl} · {v.rank}
                    </span>
                    <span style={S({ fontSize: '14px', color: 'var(--muted)', whiteSpace: 'nowrap' })}>
                      {v.crewRole}
                    </span>
                  </p>
                  <h1 style={S({ margin: '8px 0 0', fontSize: 'clamp(32px, 4.4vw, 54px)', lineHeight: '1', fontWeight: '700', letterSpacing: '-0.045em' })}>
                    {v.crewName}
                  </h1>
                  <div style={S({ marginTop: '14px', width: 'min(360px, 70vw)' })}>
                    <div style={S({ display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '13px', color: 'var(--muted)', whiteSpace: 'nowrap' })}>
                      <span>
                        {v.xpText}
                      </span>
                      <span>
                        {v.xpToGo}
                      </span>
                    </div>
                    <div role="progressbar" aria-label="Level progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow={v.xpPctNum} style={S({ marginTop: '6px', height: '10px', borderRadius: '999px', background: 'var(--paper-deep)', overflow: 'hidden' })}>
                      <span style={S({ display: 'block', height: '100%', width: v.xpPct, borderRadius: '999px', background: 'var(--ink)', transition: 'width 800ms cubic-bezier(.22,1,.36,1)' })}>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <dl style={S({ margin: '0', display: 'flex', gap: '10px', flexWrap: 'wrap' })}>
                <div style={S({ minWidth: '150px', padding: '16px 20px', borderRadius: '22px', background: '#14181f', color: '#f3f1ea' })}>
                  <dt style={S({ fontSize: '13px', opacity: '.72' })}>
                    Coins
                  </dt>
                  <dd style={S({ margin: '6px 0 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '38px', fontWeight: '700', lineHeight: '1', letterSpacing: '-0.04em' })}>
                    <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" fill="#f6c445">
                      </circle>
                      <circle cx="12" cy="12" r="6.6" fill="none" stroke="#b9831a" strokeWidth="1.6">
                      </circle>
                      <path d="M12 8.6v6.8" stroke="#b9831a" strokeWidth="1.6" strokeLinecap="round">
                      </path>
                    </svg>
                    {v.coinsShown}
                  </dd>
                </div>
                <div style={S({ minWidth: '130px', padding: '16px 20px', borderRadius: '22px', background: 'var(--panel-2)', border: '1px solid var(--rule)' })}>
                  <dt style={S({ fontSize: '13px', color: 'var(--muted)' })}>
                    Streak
                  </dt>
                  <dd style={S({ margin: '6px 0 0', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '38px', fontWeight: '700', lineHeight: '1', letterSpacing: '-0.04em' })}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="#ff9d4d" stroke="#e8742c" strokeWidth="1.2" strokeLinejoin="round" aria-hidden="true">
                      <path d={v.flameIcon}>
                      </path>
                    </svg>
                    {v.streak}
                  </dd>
                </div>
                <div style={S({ minWidth: '130px', padding: '16px 20px', borderRadius: '22px', background: 'var(--panel-2)', border: '1px solid var(--rule)' })}>
                  <dt style={S({ fontSize: '13px', color: 'var(--muted)' })}>
                    Badges
                  </dt>
                  <dd style={S({ margin: '6px 0 0', fontSize: '38px', fontWeight: '700', lineHeight: '1', letterSpacing: '-0.04em' })}>
                    {v.badgeCount}
                    <span style={S({ fontSize: '16px', fontWeight: '500', color: 'var(--muted)' })}>
                      / {v.badgeTotal}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
          </section>
          <section data-reveal="1" aria-labelledby="proof-heading" style={S({ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'stretch' })}>
            <div style={S({ flex: '2 1 520px', padding: '26px 28px', borderRadius: '28px', background: 'var(--panel)', border: '1px solid var(--rule)' })}>
              <div style={S({ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px 16px' })}>
                <h2 id="proof-heading" style={S({ margin: '0', fontSize: '22px', fontWeight: '700', letterSpacing: '-0.02em', whiteSpace: 'nowrap' })}>
                  Proof of consistency
                </h2>
                <span style={S({ fontSize: '14px', color: 'var(--muted)' })}>
                  Last 30 days · darker means more done
                </span>
              </div>
              <div aria-label={v.proofAria} role="img" style={S({ marginTop: '18px', display: 'grid', gridTemplateColumns: 'repeat(15, minmax(0, 1fr))', gap: '6px', maxWidth: '640px' })}>
                {(v.month ?? []).map((m: any, m_i: number) => (
                    <Fragment key={m_i}>
                  <span style={S({ aspectRatio: '1', borderRadius: '9px', background: m.bg, boxShadow: m.ring, animation: `rw-pop 420ms ${m.delay} cubic-bezier(.34,1.56,.64,1) both` })}>
                  </span>
                    </Fragment>
                  ))}
              </div>
              <dl style={S({ margin: '20px 0 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px' })}>
                {(v.proofStats ?? []).map((p: any, p_i: number) => (
                    <Fragment key={p_i}>
                  <div style={S({ padding: '12px 14px', borderRadius: '16px', background: 'var(--panel-2)' })}>
                    <dt style={S({ fontSize: '12.5px', color: 'var(--muted)' })}>
                      {p.k}
                    </dt>
                    <dd style={S({ margin: '4px 0 0', fontSize: '24px', fontWeight: '800', letterSpacing: '-0.03em' })}>
                      {p.v}
                    </dd>
                  </div>
                    </Fragment>
                  ))}
              </dl>
            </div>
            <div style={S({ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '14px' })}>
              <div style={S({ flex: '1', padding: '22px 24px', borderRadius: '28px', background: '#14181f', color: '#f3f1ea' })}>
                <p style={S({ margin: '0', fontSize: '13.5px', opacity: '.72' })}>
                  Weekly challenge
                </p>
                <p style={S({ margin: '6px 0 0', fontSize: '20px', fontWeight: '750', letterSpacing: '-0.02em' })}>
                  Check in 6 of 7 days
                </p>
                <div style={S({ marginTop: '14px', display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' })}>
                  {(v.week ?? []).map((d: any, d_i: number) => (
                      <Fragment key={d_i}>
                    <span style={S({ height: '12px', borderRadius: '999px', background: d })}>
                    </span>
                      </Fragment>
                    ))}
                </div>
                <p style={S({ margin: '12px 0 0', display: 'flex', justifyContent: 'space-between', fontSize: '13.5px' })}>
                  <span style={S({ opacity: '.8' })}>
                    {v.weekText}
                  </span>
                  <span style={S({ fontWeight: '800', color: '#f6c445' })}>
                    +75 coins
                  </span>
                </p>
              </div>
              <div style={S({ flex: '1', display: 'flex', alignItems: 'center', gap: '16px', padding: '22px 24px', borderRadius: '28px', background: 'var(--panel)', border: '1px solid var(--rule)' })}>
                <span aria-hidden="true" style={S({ display: 'grid', placeItems: 'center', width: '56px', height: '56px', flexShrink: '0', borderRadius: '18px', background: 'linear-gradient(135deg, #9cc4ff, #3b6fd4)', color: '#fff', boxShadow: '0 5px 0 #24488f', animation: 'rw-float 3s ease-in-out infinite' })}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d={v.shieldIcon}>
                    </path>
                  </svg>
                </span>
                <div>
                  <p style={S({ margin: '0', fontSize: '18px', fontWeight: '750', letterSpacing: '-0.02em' })}>
                    {v.shields} streak shield{v.shieldS}
                  </p>
                  <p style={S({ margin: '4px 0 0', fontSize: '13.5px', lineHeight: '1.45', color: 'var(--muted)' })}>
                    A shield covers one missed day so the streak survives. Earn one every 7 days in a row.
                  </p>
                </div>
              </div>
            </div>
          </section>
          <section data-reveal="1" aria-labelledby="pass-heading" style={S({ padding: '26px 0 22px', borderRadius: '28px', background: 'linear-gradient(135deg, #0b3d91, #14181f 70%)', color: '#f3f1ea', overflow: 'hidden', animation: 'rw-rise 520ms 60ms cubic-bezier(.22,1,.36,1) both' })}>
            <div style={S({ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px 24px', padding: '0 28px' })}>
              <div>
                <p style={S({ margin: '0', fontSize: '13.5px', opacity: '.75' })}>
                  Season 1 · Mars transit
                </p>
                <h2 id="pass-heading" style={S({ margin: '4px 0 0', fontSize: 'clamp(28px, 3.4vw, 40px)', lineHeight: '1', fontWeight: '750', letterSpacing: '-0.04em' })}>
                  Mission pass
                </h2>
              </div>
              <div style={S({ minWidth: 'min(320px, 100%)' })}>
                <div style={S({ display: 'flex', justifyContent: 'space-between', fontSize: '13px', opacity: '.8' })}>
                  <span>
                    Tier {v.passTier} of 10
                  </span>
                  <span>
                    {v.passToNext}
                  </span>
                </div>
                <div style={S({ marginTop: '6px', height: '10px', borderRadius: '999px', background: 'rgba(243,241,234,.15)', overflow: 'hidden' })}>
                  <span style={S({ display: 'block', height: '100%', width: v.passPct, borderRadius: '999px', background: '#f6c445', transition: 'width 800ms cubic-bezier(.22,1,.36,1)' })}>
                  </span>
                </div>
              </div>
            </div>
            <ol data-noscroll="1" style={S({ listStyle: 'none', margin: '22px 0 0', padding: '4px 28px 8px', display: 'flex', gap: '12px', overflowX: 'auto' })}>
              {(v.tiers ?? []).map((p: any, p_i: number) => (
                  <Fragment key={p_i}>
                <li style={S({ flex: '0 0 132px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '14px 10px 12px', borderRadius: '20px', background: p.bg, border: `2px solid ${p.border}`, opacity: p.op })}>
                  <span style={S({ fontSize: '12.5px', fontWeight: '700', opacity: '.8' })}>
                    Tier {p.n}
                  </span>
                  <span style={S({ display: 'grid', placeItems: 'center', width: '64px', height: '64px', borderRadius: '18px', background: p.tile })}>
                    {(p.isCoins) ? (
                      <>
                      <span style={S({ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '15px', fontWeight: '800', color: '#f6c445' })}>
                        <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
                          <circle cx="12" cy="12" r="10" fill="#f6c445">
                          </circle>
                          <circle cx="12" cy="12" r="6.6" fill="none" stroke="#b9831a" strokeWidth="1.6">
                          </circle>
                        </svg>
                        {p.coins}
                      </span>
                      </>
                    ) : null}
                    {(p.isItem) ? (
                      <>
                      <P.Avatar crew={v.crew} gear={p.gear} size={52} ring="rgba(243,241,234,.4)" />
                      </>
                    ) : null}
                  </span>
                  <span style={S({ minHeight: '32px', fontSize: '12.5px', fontWeight: '600', textAlign: 'center', lineHeight: '1.25' })}>
                    {p.name}
                  </span>
                  <button type="button" onClick={p.claim} disabled={p.disabled} style={S({ width: '100%', minHeight: '36px', borderRadius: '10px', background: p.btnBg, color: p.btnInk, border: '0', boxShadow: p.btnShadow, fontSize: '13px', fontWeight: '750', cursor: p.cursor, whiteSpace: 'nowrap' })} className="rewardsview-active-1">
                    {p.btn}
                  </button>
                </li>
                  </Fragment>
                ))}
            </ol>
          </section>
          <div style={S({ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'stretch' })}>
            <section data-reveal="1" aria-labelledby="drop-heading" style={S({ flex: '1 1 340px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '28px 24px', borderRadius: '28px', background: '#0f141c', color: '#f3f1ea', animation: 'rw-rise 520ms 80ms cubic-bezier(.22,1,.36,1) both' })}>
              <span aria-hidden="true" style={S({ position: 'absolute', inset: '0', background: 'radial-gradient(1px 1px at 14% 22%, #fff, transparent), radial-gradient(1px 1px at 72% 18%, #fff, transparent), radial-gradient(1.5px 1.5px at 86% 64%, #fff, transparent), radial-gradient(1px 1px at 28% 78%, #fff, transparent), radial-gradient(1px 1px at 52% 46%, rgba(255,255,255,.6), transparent)', opacity: '.7' })}>
              </span>
              <h2 id="drop-heading" style={S({ position: 'relative', margin: '0', fontSize: '14px', fontWeight: '500', opacity: '.75' })}>
                Daily supply drop
              </h2>
              <div style={S({ position: 'relative', display: 'grid', placeItems: 'center', width: '180px', height: '150px', marginTop: '8px' })}>
                {(v.burst ?? []).map((b: any, b_i: number) => (
                    <Fragment key={b_i}>
                  <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" style={S({ position: 'absolute', left: '79px', top: '64px', '--dx': b.dx, '--dy': b.dy, '--rot': b.rot, animation: `rw-coin 1.2s ${b.delay} cubic-bezier(.22,1,.36,1) both` })}>
                    <circle cx="12" cy="12" r="10" fill="#f6c445">
                    </circle>
                    <circle cx="12" cy="12" r="6.6" fill="none" stroke="#b9831a" strokeWidth="1.6">
                    </circle>
                  </svg>
                    </Fragment>
                  ))}
                <svg key={v.chestKey} width="120" height="104" viewBox="0 0 120 104" aria-hidden="true" style={S({ transformOrigin: '50% 90%', animation: v.chestAnim })}>
                  <rect x="10" y="44" width="100" height="56" rx="10" fill="#c7863a" stroke="#6b3f12" strokeWidth="3">
                  </rect>
                  <rect x="10" y="62" width="100" height="8" fill="#6b3f12" opacity=".35">
                  </rect>
                  <g style={S({ transformOrigin: '10px 44px', transform: v.lidT, transition: 'transform 500ms cubic-bezier(.34,1.56,.64,1)' })}>
                    <path d="M10 44 V30 a20 20 0 0 1 20-20 H90 a20 20 0 0 1 20 20 V44 Z" fill="#dd9c4b" stroke="#6b3f12" strokeWidth="3">
                    </path>
                    <rect x="50" y="34" width="20" height="18" rx="4" fill="#f6c445" stroke="#6b3f12" strokeWidth="3">
                    </rect>
                  </g>
                  <rect x="26" y="44" width="10" height="56" fill="#6b3f12" opacity=".25">
                  </rect>
                  <rect x="84" y="44" width="10" height="56" fill="#6b3f12" opacity=".25">
                  </rect>
                </svg>
              </div>
              {(v.dropOpened) ? (
                <>
                <p style={S({ position: 'relative', margin: '10px 0 0', fontSize: '34px', fontWeight: '750', letterSpacing: '-0.03em', color: '#f6c445', animation: 'rw-pop 520ms 300ms cubic-bezier(.34,1.56,.64,1) both' })}>
                  +{v.dropReward} coins
                </p>
                <p style={S({ position: 'relative', margin: '6px 0 0', fontSize: '14px', opacity: '.72' })}>
                  Next drop in {v.nextDrop}
                </p>
                </>
              ) : null}
              {(v.dropReady) ? (
                <>
                <p style={S({ position: 'relative', margin: '10px 0 18px', maxWidth: '30ch', fontSize: '15px', lineHeight: '1.5', opacity: '.8' })}>
                  One free crate a day for opening the console. Ten to thirty coins inside.
                </p>
                <button type="button" onClick={v.openDrop} style={S({ position: 'relative', overflow: 'hidden', minHeight: '54px', padding: '0 28px', borderRadius: '16px', background: '#f6c445', color: '#3b2a00', border: '0', boxShadow: '0 5px 0 #a8740a', fontSize: '16px', fontWeight: '750', cursor: 'pointer', transition: 'transform 90ms ease, box-shadow 90ms ease' })} className="rewardsview-active-2">
                  <span aria-hidden="true" style={S({ position: 'absolute', top: '0', bottom: '0', left: '0', width: '40%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.6), transparent)', animation: 'rw-shine 2.4s ease-in-out infinite' })}>
                  </span>
                  <span style={S({ position: 'relative' })}>
                    Open the crate
                  </span>
                </button>
                </>
              ) : null}
            </section>
            <section data-reveal="1" aria-labelledby="streak-heading" style={S({ flex: '2 1 520px', padding: '26px 28px', borderRadius: '28px', background: 'var(--panel)', border: '1px solid var(--rule)', animation: 'rw-rise 520ms 140ms cubic-bezier(.22,1,.36,1) both' })}>
              <div style={S({ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px 16px' })}>
                <h2 id="streak-heading" style={S({ margin: '0', fontSize: '22px', fontWeight: '650', letterSpacing: '-0.02em' })}>
                  Streak rewards
                </h2>
                <span style={S({ fontSize: '14px', color: 'var(--muted)' })}>
                  A missed day resets the streak, never your coins
                </span>
              </div>
              <div style={S({ position: 'relative', margin: '34px 8px 0' })}>
                <div aria-hidden="true" style={S({ position: 'absolute', left: '0', right: '0', top: '23px', height: '8px', borderRadius: '999px', background: 'var(--paper-deep)' })}>
                  <span style={S({ display: 'block', height: '100%', width: v.trackPct, borderRadius: '999px', background: 'linear-gradient(90deg, #ffb066, #e8742c)', transition: 'width 900ms cubic-bezier(.22,1,.36,1)' })}>
                  </span>
                </div>
                <ol style={S({ position: 'relative', listStyle: 'none', margin: '0', padding: '0', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' })}>
                  {(v.milestones ?? []).map((m: any, m_i: number) => (
                      <Fragment key={m_i}>
                    <li style={S({ display: 'flex', flexDirection: 'column', alignItems: m.align, gap: '10px', textAlign: 'center' })}>
                      <span style={S({ display: 'grid', placeItems: 'center', width: '54px', height: '54px', borderRadius: '999px', background: m.bg, color: m.color, border: '3px solid var(--panel)', boxShadow: `0 0 0 2px ${m.ring}`, fontSize: '16px', fontWeight: '750', animation: m.anim })}>
                        {m.days}
                      </span>
                      <span style={S({ fontSize: '13.5px', fontWeight: '600' })}>
                        {m.label}
                      </span>
                      {(m.claimable) ? (
                        <>
                        <button type="button" onClick={m.claim} style={S({ minHeight: '40px', padding: '0 14px', borderRadius: '12px', background: 'var(--ink)', color: 'var(--paper)', border: '0', boxShadow: '0 4px 0 #000', fontSize: '13.5px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' })} className="rewardsview-active-3">
                          Claim +{m.coins}
                        </button>
                        </>
                      ) : null}
                      {(m.static) ? (
                        <>
                        <span style={S({ display: 'inline-flex', alignItems: 'center', gap: '5px', minHeight: '40px', fontSize: '13.5px', fontWeight: '650', color: m.rewardColor, whiteSpace: 'nowrap' })}>
                          <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
                            <circle cx="12" cy="12" r="10" fill="#f6c445">
                            </circle>
                            <circle cx="12" cy="12" r="6.6" fill="none" stroke="#b9831a" strokeWidth="1.6">
                            </circle>
                          </svg>
                          {m.rewardText}
                        </span>
                        </>
                      ) : null}
                    </li>
                      </Fragment>
                    ))}
                </ol>
              </div>
              <div style={S({ marginTop: '26px', paddingTop: '18px', borderTop: '1px solid var(--rule)' })}>
                <p style={S({ margin: '0 0 10px', fontSize: '13.5px', color: 'var(--muted)' })}>
                  Last 14 days
                </p>
                <div aria-hidden="true" style={S({ display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)', gap: '6px' })}>
                  {(v.days ?? []).map((d: any, d_i: number) => (
                      <Fragment key={d_i}>
                    <span style={S({ display: 'grid', placeItems: 'center', aspectRatio: '1', borderRadius: '10px', background: d.bg, color: d.color })}>
                      <svg width="60%" height="60%" viewBox="0 0 24 24" fill="currentColor" stroke="none" style={S({ opacity: d.op })}>
                        <path d={v.flameIcon}>
                        </path>
                      </svg>
                    </span>
                      </Fragment>
                    ))}
                </div>
              </div>
            </section>
          </div>
          <section data-reveal="1" aria-labelledby="badges-heading" style={S({ padding: '26px 28px', borderRadius: '28px', background: 'var(--panel)', border: '1px solid var(--rule)', animation: 'rw-rise 520ms 200ms cubic-bezier(.22,1,.36,1) both' })}>
            <div style={S({ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px 16px' })}>
              <h2 id="badges-heading" style={S({ margin: '0', fontSize: '22px', fontWeight: '650', letterSpacing: '-0.02em' })}>
                Badges
              </h2>
              <span style={S({ fontSize: '14px', color: 'var(--muted)' })}>
                For things you did, never for a number
              </span>
            </div>
            <ul style={S({ listStyle: 'none', margin: '20px 0 0', padding: '0', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 170px), 1fr))', gap: '12px' })}>
              {(v.badges ?? []).map((b: any, b_i: number) => (
                  <Fragment key={b_i}>
                <li style={S({ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '10px', padding: '20px 14px', borderRadius: '22px', background: b.bg, border: b.border })}>
                  <span style={S({ position: 'relative', display: 'grid', placeItems: 'center', width: '64px', height: '64px', borderRadius: '20px', background: b.tileBg, color: b.tileColor, transform: 'rotate(-6deg)', boxShadow: b.tileShadow })}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={S({ transform: 'rotate(6deg)' })}>
                      <path d={b.icon}>
                      </path>
                    </svg>
                    {(b.locked) ? (
                      <>
                      <span aria-hidden="true" style={S({ position: 'absolute', right: '-6px', bottom: '-6px', display: 'grid', placeItems: 'center', width: '24px', height: '24px', borderRadius: '999px', background: 'var(--panel)', border: '1px solid var(--rule)', transform: 'rotate(6deg)' })}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2.4" strokeLinecap="round">
                          <rect x="5" y="11" width="14" height="10" rx="2">
                          </rect>
                          <path d="M8 11V8a4 4 0 0 1 8 0v3">
                          </path>
                        </svg>
                      </span>
                      </>
                    ) : null}
                  </span>
                  <span style={S({ fontSize: '15px', fontWeight: '650', whiteSpace: 'nowrap', color: b.nameColor })}>
                    {b.name}
                  </span>
                  <span style={S({ fontSize: '13px', lineHeight: '1.4', color: 'var(--muted)' })}>
                    {b.desc}
                  </span>
                </li>
                  </Fragment>
                ))}
            </ul>
          </section>
          <section data-reveal="1" aria-labelledby="locker-heading" style={S({ padding: '26px 28px', borderRadius: '28px', background: 'var(--panel)', border: '1px solid var(--rule)', animation: 'rw-rise 520ms 260ms cubic-bezier(.22,1,.36,1) both' })}>
            <div style={S({ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '14px 20px' })}>
              <div>
                <h2 id="locker-heading" style={S({ margin: '0', fontSize: '22px', fontWeight: '650', letterSpacing: '-0.02em' })}>
                  Locker
                </h2>
                <p style={S({ margin: '4px 0 0', fontSize: '14px', color: 'var(--muted)' })}>
                  Spend coins on gear. It changes how you look, nothing else.
                </p>
              </div>
              <div role="tablist" aria-label="Gear type" style={S({ display: 'flex', flexWrap: 'wrap', gap: '4px', padding: '4px', borderRadius: '999px', background: 'var(--paper-deep)' })}>
                {(v.slots ?? []).map((t: any, t_i: number) => (
                    <Fragment key={t_i}>
                  <button type="button" role="tab" aria-selected={t.on} onClick={t.pick} style={S({ minHeight: '40px', padding: '0 16px', borderRadius: '999px', background: t.bg, color: t.color, border: '0', boxShadow: t.shadow, fontSize: '14px', fontWeight: '550', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'background-color 180ms ease' })}>
                    {t.label}
                  </button>
                    </Fragment>
                  ))}
              </div>
            </div>
            <ul key={v.slot} style={S({ listStyle: 'none', margin: '22px 0 0', padding: '0', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 200px), 1fr))', gap: '14px' })}>
              {(v.items ?? []).map((it: any, it_i: number) => (
                  <Fragment key={it_i}>
                <li style={S({ display: 'flex', flexDirection: 'column', borderRadius: '24px', background: 'var(--panel)', border: `2px solid ${it.border}`, overflow: 'hidden', animation: `rw-rise 420ms ${it.delay} cubic-bezier(.22,1,.36,1) both`, transition: 'transform 220ms cubic-bezier(.34,1.56,.64,1), border-color 160ms ease' })} className="rewardsview-hover-4">
                  <div style={S({ position: 'relative', display: 'grid', placeItems: 'center', height: '150px', background: it.stage })}>
                    {(it.isBanner) ? (
                      <>
                      <span style={S({ position: 'absolute', inset: '0', background: it.bannerBg })}>
                      </span>
                      </>
                    ) : null}
                    <span style={S({ position: 'relative', animation: 'rw-float 3.4s ease-in-out infinite' })}>
                      <P.Avatar crew={v.crew} gear={it.gear} size={92} ring="var(--panel)" />
                    </span>
                    {(it.equipped) ? (
                      <>
                      <span style={S({ position: 'absolute', top: '10px', left: '10px', padding: '3px 9px', borderRadius: '999px', background: 'var(--ink)', color: 'var(--paper)', fontSize: '12px', fontWeight: '650' })}>
                        Wearing
                      </span>
                      </>
                    ) : null}
                  </div>
                  <div style={S({ flex: '1', display: 'flex', flexDirection: 'column', gap: '12px', padding: '14px 16px 16px' })}>
                    <div style={S({ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px' })}>
                      <span style={S({ fontSize: '15.5px', fontWeight: '650' })}>
                        {it.name}
                      </span>
                      <span style={S({ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '14px', fontWeight: '700', color: it.priceColor, whiteSpace: 'nowrap' })}>
                        <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true" style={S({ opacity: it.coinOp })}>
                          <circle cx="12" cy="12" r="10" fill="#f6c445">
                          </circle>
                          <circle cx="12" cy="12" r="6.6" fill="none" stroke="#b9831a" strokeWidth="1.6">
                          </circle>
                        </svg>
                        {it.priceText}
                      </span>
                    </div>
                    <button type="button" onClick={it.act} disabled={it.disabled} style={S({ marginTop: 'auto', minHeight: '46px', borderRadius: '14px', background: it.btnBg, color: it.btnColor, border: it.btnBorder, boxShadow: it.btnShadow, fontSize: '14.5px', fontWeight: '700', cursor: it.cursor, transition: 'transform 90ms ease, box-shadow 90ms ease' })} className="rewardsview-active-5">
                      {it.btnText}
                    </button>
                  </div>
                </li>
                  </Fragment>
                ))}
            </ul>
          </section>
          <section data-reveal="1" aria-labelledby="earn-heading" style={S({ display: 'flex', flexWrap: 'wrap', gap: '24px 48px', padding: '28px', borderRadius: '28px', background: '#14181f', color: '#f3f1ea', animation: 'rw-rise 520ms 320ms cubic-bezier(.22,1,.36,1) both' })}>
            <div style={S({ flex: '1 1 280px' })}>
              <h2 id="earn-heading" style={S({ margin: '0', fontSize: 'clamp(26px, 3vw, 36px)', lineHeight: '1.05', fontWeight: '700', letterSpacing: '-0.035em' })}>
                How coins are earned.
              </h2>
              <p style={S({ margin: '12px 0 0', maxWidth: '40ch', fontSize: '15px', lineHeight: '1.6', opacity: '.75' })}>
                Only for showing up and being honest. A bad day logged pays the same as a good one, so nobody has a reason to hide it.
              </p>
            </div>
            <ul style={S({ flex: '1.4 1 380px', listStyle: 'none', margin: '0', padding: '0' })}>
              {(v.earnRows ?? []).map((e: any, e_i: number) => (
                  <Fragment key={e_i}>
                <li style={S({ display: 'grid', gridTemplateColumns: '36px 1fr auto', alignItems: 'center', gap: '14px', padding: '12px 0', borderBottom: '1px solid color-mix(in srgb, var(--paper) 16%, transparent)' })}>
                  <span aria-hidden="true" style={S({ display: 'grid', placeItems: 'center', width: '36px', height: '36px', borderRadius: '11px', background: 'color-mix(in srgb, var(--paper) 12%, transparent)' })}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d={e.icon}>
                      </path>
                    </svg>
                  </span>
                  <span style={S({ fontSize: '15px' })}>
                    {e.t}
                  </span>
                  <span style={S({ fontSize: '15px', fontWeight: '700', color: '#f6c445', whiteSpace: 'nowrap' })}>
                    {e.c}
                  </span>
                </li>
                  </Fragment>
                ))}
            </ul>
          </section>
        </main>
        {(v.toast) ? (
          <>
          <div key={v.toastKey} role="status" style={S({ position: 'fixed', left: '50%', bottom: '112px', zIndex: '50', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 18px', borderRadius: '999px', background: '#14181f', color: '#f3f1ea', fontSize: '15px', fontWeight: '600', boxShadow: '0 16px 40px -16px rgba(20,24,31,.6)', animation: 'rw-toast 2.6s cubic-bezier(.22,1,.36,1) forwards', whiteSpace: 'nowrap' })}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7ef0c5" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5">
              </path>
            </svg>
            {v.toast}
          </div>
          </>
        ) : null}
        <P.SiteFooter dock={true} />
        <P.CrewDock current="Rewards" />
      </div>
    </>
  )
}
